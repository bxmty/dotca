/**
 * Perf gate: the pure half of `scripts/perf-gate.ts` (issue #614).
 *
 * Everything here is deterministic and free of Lighthouse/Chrome so it can be
 * unit tested: the gate matrix, reducing Lighthouse results to medians, the
 * dark-render proof, the threshold/byte-budget comparison and its Markdown
 * table, and CLI argument parsing. The script is a thin shell that drives
 * Chrome and hands results to these functions.
 */
import { parseArgs } from "node:util";

/**
 * Calculates the median of a sample. Five-pass medians are the unit every
 * perf-gate threshold is applied to, so an empty sample is a measurement bug
 * and throws rather than producing a number that would silently pass.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate the median of an empty sample");
  }
  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex];
  }
  return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
}

/** Computed background colours read from the page after a dark-mode run. */
export interface RenderProbe {
  bodyBackgroundColor: string;
  htmlBackgroundColor: string;
}

// Relative luminance (WCAG) below this is "dark". Bootstrap's dark body
// (#212529) is ~0.02 and its light body (#fff) is 1.0, so 0.2 separates them
// with a wide margin either way.
const DARK_LUMINANCE_CEILING = 0.2;

interface OpaqueColor {
  red: number;
  green: number;
  blue: number;
}

function parseOpaqueColor(cssColor: string): OpaqueColor | undefined {
  const match = cssColor.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
  );
  if (!match) {
    return undefined;
  }
  const alphaText = match[4];
  if (alphaText !== undefined && parseFloat(alphaText) === 0) {
    return undefined;
  }
  return {
    red: Number(match[1]),
    green: Number(match[2]),
    blue: Number(match[3]),
  };
}

function calculateRelativeLuminance({ red, green, blue }: OpaqueColor): number {
  const toLinear = (channel: number) => {
    const scaled = channel / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue)
  );
}

/**
 * Proves a run rendered dark from what the browser actually painted, not from
 * whether the emulation was requested. The body background wins; a
 * transparent body falls through to <html>. A page with no opaque background
 * at all renders on the browser's default (white) canvas, so it is not dark.
 */
export function isDarkRender(probe: RenderProbe): boolean {
  const paintedColor =
    parseOpaqueColor(probe.bodyBackgroundColor) ??
    parseOpaqueColor(probe.htmlBackgroundColor);
  if (!paintedColor) {
    return false;
  }
  return calculateRelativeLuminance(paintedColor) < DARK_LUMINANCE_CEILING;
}

/** Throws when a dark-mode run did not paint dark, so it can never pass. */
export function assertDarkRender(
  configurationKey: string,
  probe: RenderProbe,
): void {
  if (!isDarkRender(probe)) {
    throw new Error(
      `${configurationKey} did not render dark: body background ` +
        `${probe.bodyBackgroundColor}, html background ` +
        `${probe.htmlBackgroundColor}. The prefers-color-scheme emulation ` +
        `did not take effect, so this run cannot count toward the gate.`,
    );
  }
}

/**
 * The slice of a Lighthouse result (LHR) the gate reads. Declared here rather
 * than imported from Lighthouse so this module stays importable — and
 * testable — without Lighthouse or Chrome installed.
 */
export interface LighthouseResultSubset {
  lighthouseVersion: string;
  finalDisplayedUrl: string;
  runtimeError?: { code: string; message: string };
  categories: Record<string, { score: number | null } | undefined>;
  audits: Record<string, { numericValue?: number; details?: unknown }>;
}

/** Compressed transfer bytes by gate category for one pass. */
export interface ByteTotals {
  cssBytes: number;
  firstPartyJavaScriptBytes: number;
  fontBytes: number;
  fontFileCount: number;
  /** CSS + first-party JS + fonts. Third-party JS (GTM etc.) is excluded. */
  netTotalBytes: number;
}

export interface LcpElement {
  selector: string;
  snippet: string;
}

/** Everything the gate keeps from one Lighthouse pass. */
export interface RunSample {
  performanceScore: number;
  largestContentfulPaintMs: number;
  totalBlockingTimeMs: number;
  cumulativeLayoutShift: number;
  firstContentfulPaintMs: number;
  bytes: ByteTotals;
  lcpElement?: LcpElement;
  /** False when Lighthouse could not paint the page (runtime error / no FCP). */
  didRender: boolean;
  /** Set on dark-mode runs only: the computed colours that prove the render. */
  renderProbe?: RenderProbe;
}

interface NetworkRequestItem {
  url: string;
  resourceType?: string;
  transferSize?: number;
}

function readNumericAudit(
  lighthouseResult: LighthouseResultSubset,
  auditId: string,
): number {
  return lighthouseResult.audits[auditId]?.numericValue ?? Number.NaN;
}

function readNetworkRequests(
  lighthouseResult: LighthouseResultSubset,
): NetworkRequestItem[] {
  const details = lighthouseResult.audits["network-requests"]?.details as
    | { items?: NetworkRequestItem[] }
    | undefined;
  return details?.items ?? [];
}

// CSS and fonts count from any origin, so a font pulled from a third-party
// CDN still lands in the font budget. JavaScript counts first-party only:
// the net total deliberately excludes GTM and other third-party scripts whose
// size the site does not control.
function calculateByteTotals(
  networkRequests: NetworkRequestItem[],
  pageUrl: string,
): ByteTotals {
  const pageHostname = new URL(pageUrl).hostname;
  let cssBytes = 0;
  let firstPartyJavaScriptBytes = 0;
  let fontBytes = 0;
  let fontFileCount = 0;
  for (const request of networkRequests) {
    const transferSize = request.transferSize ?? 0;
    if (request.resourceType === "Stylesheet") {
      cssBytes += transferSize;
    } else if (request.resourceType === "Font" && transferSize > 0) {
      // A blocked font (the font-blocked pass) is still listed as a failed
      // request with nothing transferred; it is not a file the page loaded.
      fontBytes += transferSize;
      fontFileCount += 1;
    } else if (
      request.resourceType === "Script" &&
      new URL(request.url).hostname === pageHostname
    ) {
      firstPartyJavaScriptBytes += transferSize;
    }
  }
  return {
    cssBytes,
    firstPartyJavaScriptBytes,
    fontBytes,
    fontFileCount,
    netTotalBytes: cssBytes + firstPartyJavaScriptBytes + fontBytes,
  };
}

// Lighthouse 13 dropped the `largest-contentful-paint-element` audit; the
// element now lives as a `node` item inside the LCP breakdown insight's list.
function findLcpElement(
  lighthouseResult: LighthouseResultSubset,
): LcpElement | undefined {
  const details = lighthouseResult.audits["lcp-breakdown-insight"]?.details as
    | { items?: Array<{ type?: string; selector?: string; snippet?: string }> }
    | undefined;
  const nodeItem = details?.items?.find((item) => item.type === "node");
  if (!nodeItem) {
    return undefined;
  }
  return { selector: nodeItem.selector ?? "", snippet: nodeItem.snippet ?? "" };
}

/** Reduces one Lighthouse result to the values the gate compares. */
export function extractRunSample(
  lighthouseResult: LighthouseResultSubset,
): RunSample {
  const firstContentfulPaintMs = readNumericAudit(
    lighthouseResult,
    "first-contentful-paint",
  );
  const performanceScore =
    (lighthouseResult.categories.performance?.score ?? Number.NaN) * 100;
  return {
    performanceScore: Math.round(performanceScore),
    largestContentfulPaintMs: readNumericAudit(
      lighthouseResult,
      "largest-contentful-paint",
    ),
    totalBlockingTimeMs: readNumericAudit(
      lighthouseResult,
      "total-blocking-time",
    ),
    cumulativeLayoutShift: readNumericAudit(
      lighthouseResult,
      "cumulative-layout-shift",
    ),
    firstContentfulPaintMs,
    bytes: calculateByteTotals(
      readNetworkRequests(lighthouseResult),
      lighthouseResult.finalDisplayedUrl,
    ),
    lcpElement: findLcpElement(lighthouseResult),
    didRender:
      !lighthouseResult.runtimeError && Number.isFinite(firstContentfulPaintMs),
  };
}

export type FormFactor = "mobile" | "desktop";
export type ColorScheme = "light" | "dark";

/** One cell of the gate matrix: a route measured one way. */
export interface PerfConfiguration {
  route: string;
  formFactor: FormFactor;
  colorScheme: ColorScheme;
  /** Font files blocked via Lighthouse's blockedUrlPatterns. */
  isFontBlocked: boolean;
}

const GATED_ROUTES = [
  "/",
  "/services/managed-it-services-ontario",
  "/pricing",
  "/blog/backups",
];
const DARK_AND_FONT_BLOCKED_ROUTES = ["/", "/pricing"];

/**
 * The matrix from msp-playbook#163: mobile + desktop light on four routes,
 * mobile dark and a mobile font-blocked pass on two. Other service pages,
 * checkout/onboarding and desktop dark are deliberately not measured.
 */
export const perfGateMatrix: PerfConfiguration[] = [
  ...GATED_ROUTES.flatMap((route) =>
    (["mobile", "desktop"] as const).map((formFactor) => ({
      route,
      formFactor,
      colorScheme: "light" as const,
      isFontBlocked: false,
    })),
  ),
  ...DARK_AND_FONT_BLOCKED_ROUTES.map((route) => ({
    route,
    formFactor: "mobile" as const,
    colorScheme: "dark" as const,
    isFontBlocked: false,
  })),
  ...DARK_AND_FONT_BLOCKED_ROUTES.map((route) => ({
    route,
    formFactor: "mobile" as const,
    colorScheme: "light" as const,
    isFontBlocked: true,
  })),
];

/**
 * A shell-safe, human-readable key such as `mobile-dark:/pricing`. It is how
 * results are stored in the JSON and how `measure --only` names a rerun.
 */
export function getConfigurationKey(configuration: PerfConfiguration): string {
  const fontSuffix = configuration.isFontBlocked ? "-fonts-blocked" : "";
  return `${configuration.formFactor}-${configuration.colorScheme}${fontSuffix}:${configuration.route}`;
}

export interface MetricMedians {
  performanceScore: number;
  largestContentfulPaintMs: number;
  totalBlockingTimeMs: number;
  cumulativeLayoutShift: number;
  firstContentfulPaintMs: number;
}

/** Medians plus raw passes for one configuration — the unit of the JSON. */
export interface ConfigurationResult extends PerfConfiguration {
  key: string;
  measuredAt: string;
  medians: MetricMedians;
  byteMedians: ByteTotals;
  didEveryRunRender: boolean;
  /** Dark configurations only: every pass carried a dark render probe. */
  isDarkRenderProven?: boolean;
  runs: RunSample[];
}

// A pass that failed to paint has NaN metrics. Those are dropped from the
// median (the failure is reported through didEveryRunRender instead); if no
// pass produced a value the median is NaN, which serialises to null and is
// treated as a failed check by compare.
function calculateFiniteMedian(values: number[]): number {
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length === 0 ? Number.NaN : calculateMedian(finiteValues);
}

export function summarizeConfigurationRuns({
  configuration,
  runSamples,
  measuredAt,
}: {
  configuration: PerfConfiguration;
  runSamples: RunSample[];
  measuredAt: string;
}): ConfigurationResult {
  const medianOf = (readValue: (runSample: RunSample) => number) =>
    calculateFiniteMedian(runSamples.map(readValue));
  const configurationResult: ConfigurationResult = {
    ...configuration,
    key: getConfigurationKey(configuration),
    measuredAt,
    medians: {
      performanceScore: medianOf((run) => run.performanceScore),
      largestContentfulPaintMs: medianOf((run) => run.largestContentfulPaintMs),
      totalBlockingTimeMs: medianOf((run) => run.totalBlockingTimeMs),
      cumulativeLayoutShift: medianOf((run) => run.cumulativeLayoutShift),
      firstContentfulPaintMs: medianOf((run) => run.firstContentfulPaintMs),
    },
    byteMedians: {
      cssBytes: medianOf((run) => run.bytes.cssBytes),
      firstPartyJavaScriptBytes: medianOf(
        (run) => run.bytes.firstPartyJavaScriptBytes,
      ),
      fontBytes: medianOf((run) => run.bytes.fontBytes),
      fontFileCount: medianOf((run) => run.bytes.fontFileCount),
      netTotalBytes: medianOf((run) => run.bytes.netTotalBytes),
    },
    didEveryRunRender: runSamples.every((run) => run.didRender),
    runs: runSamples,
  };
  if (configuration.colorScheme === "dark") {
    configurationResult.isDarkRenderProven = runSamples.every(
      (run) => run.renderProbe !== undefined && isDarkRender(run.renderProbe),
    );
  }
  return configurationResult;
}

/** The JSON file `measure` writes and `compare` reads. */
export interface PerfReport {
  schemaVersion: number;
  lighthouseVersion: string;
  baseUrl: string;
  /** When the report was last written (a rerun refreshes it). */
  measuredAt: string;
  commitSha?: string;
  passesPerConfiguration: number;
  results: ConfigurationResult[];
}

export type CheckStatus = "pass" | "fail" | "skip";

/** One row of the gate table. Values are pre-formatted for display. */
export interface GateCheck {
  configurationKey: string;
  checkName: string;
  beforeValue: string;
  afterValue: string;
  limit: string;
  status: CheckStatus;
}

export interface GateComparison {
  checks: GateCheck[];
  warnings: string[];
  /** Keys to pass to `measure --only` for the one permitted rerun. */
  failingConfigurationKeys: string[];
  markdown: string;
  exitCode: 0 | 1;
}

// Budgets from msp-playbook#163. Relative limits are added to the paired
// before median; caps are absolute.
const mobileBudget = {
  allowedScoreDrop: 3,
  allowedLcpRegressionMs: 150,
  lcpCapMs: 2000,
  allowedTbtRegressionMs: 50,
  allowedFcpRegressionMs: 150,
};
const desktopBudget = {
  scoreFloor: 98,
  allowedLcpRegressionMs: 100,
  lcpCapMs: 800,
  tbtCapMs: 50,
  allowedFcpRegressionMs: 100,
};
const CLS_CAP = 0.02;
// KiB, matching how Lighthouse and DevTools display transfer sizes.
const BYTES_PER_KIB = 1024;
const CSS_CAP_BYTES = 35 * BYTES_PER_KIB;
const FONT_CAP_BYTES = 60 * BYTES_PER_KIB;
const FONT_FILE_CAP = 2;
const STALE_PAIR_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const H1_EXPECTED_ROUTES = ["/", "/services/managed-it-services-ontario"];

type ValueFormat = "milliseconds" | "score" | "layoutShift" | "bytes" | "count";

// A NaN median is written to JSON as null, and `null + 150` is 150 in
// JavaScript — so every value read from a report is normalised to a finite
// number or NaN before any arithmetic, and NaN always fails.
function toFiniteOrNaN(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Number.NaN;
}

function formatValue(value: number, valueFormat: ValueFormat): string {
  if (!Number.isFinite(value)) {
    return "missing";
  }
  switch (valueFormat) {
    case "milliseconds":
      return `${Math.round(value)} ms`;
    case "layoutShift":
      return value.toFixed(3);
    case "bytes":
      return `${(value / BYTES_PER_KIB).toFixed(1)} KiB`;
    default:
      return String(Math.round(value));
  }
}

function buildThresholdCheck({
  configurationKey,
  checkName,
  beforeValue,
  afterValue,
  limitValue,
  direction,
  valueFormat,
}: {
  configurationKey: string;
  checkName: string;
  beforeValue: number;
  afterValue: number;
  limitValue: number;
  direction: "atMost" | "atLeast";
  valueFormat: ValueFormat;
}): GateCheck {
  const isWithinLimit =
    direction === "atMost"
      ? afterValue <= limitValue
      : afterValue >= limitValue;
  const hasValues = Number.isFinite(afterValue) && Number.isFinite(limitValue);
  const limitSymbol = direction === "atMost" ? "≤" : "≥";
  return {
    configurationKey,
    checkName,
    beforeValue: formatValue(beforeValue, valueFormat),
    afterValue: formatValue(afterValue, valueFormat),
    limit: Number.isFinite(limitValue)
      ? `${limitSymbol} ${formatValue(limitValue, valueFormat)}`
      : "missing before",
    status: hasValues && isWithinLimit ? "pass" : "fail",
  };
}

function buildMetricChecks(
  afterResult: ConfigurationResult,
  beforeResult: ConfigurationResult | undefined,
): GateCheck[] {
  const configurationKey = afterResult.key;
  const readAfter = (metric: keyof MetricMedians) =>
    toFiniteOrNaN(afterResult.medians?.[metric]);
  const readBefore = (metric: keyof MetricMedians) =>
    toFiniteOrNaN(beforeResult?.medians?.[metric]);
  const metricCheck = (
    checkName: string,
    metric: keyof MetricMedians,
    limitValue: number,
    direction: "atMost" | "atLeast" = "atMost",
  ) =>
    buildThresholdCheck({
      configurationKey,
      checkName,
      beforeValue: readBefore(metric),
      afterValue: readAfter(metric),
      limitValue,
      direction,
      valueFormat:
        metric === "performanceScore"
          ? "score"
          : metric === "cumulativeLayoutShift"
            ? "layoutShift"
            : "milliseconds",
    });
  const clsCheck = metricCheck("CLS", "cumulativeLayoutShift", CLS_CAP);

  if (afterResult.isFontBlocked) {
    return [
      clsCheck,
      {
        configurationKey,
        checkName: "Page renders",
        beforeValue: describeFlag(beforeResult?.didEveryRunRender),
        afterValue: describeFlag(afterResult.didEveryRunRender),
        limit: "every pass paints",
        status: afterResult.didEveryRunRender === true ? "pass" : "fail",
      },
    ];
  }

  if (afterResult.formFactor === "desktop") {
    return [
      metricCheck(
        "Perf score",
        "performanceScore",
        desktopBudget.scoreFloor,
        "atLeast",
      ),
      metricCheck(
        "LCP vs before",
        "largestContentfulPaintMs",
        readBefore("largestContentfulPaintMs") +
          desktopBudget.allowedLcpRegressionMs,
      ),
      metricCheck(
        "LCP cap",
        "largestContentfulPaintMs",
        desktopBudget.lcpCapMs,
      ),
      metricCheck("TBT cap", "totalBlockingTimeMs", desktopBudget.tbtCapMs),
      clsCheck,
      metricCheck(
        "FCP vs before",
        "firstContentfulPaintMs",
        readBefore("firstContentfulPaintMs") +
          desktopBudget.allowedFcpRegressionMs,
      ),
    ];
  }

  const mobileChecks = [
    metricCheck(
      "Perf score",
      "performanceScore",
      readBefore("performanceScore") - mobileBudget.allowedScoreDrop,
      "atLeast",
    ),
    metricCheck(
      "LCP vs before",
      "largestContentfulPaintMs",
      readBefore("largestContentfulPaintMs") +
        mobileBudget.allowedLcpRegressionMs,
    ),
    metricCheck("LCP cap", "largestContentfulPaintMs", mobileBudget.lcpCapMs),
    metricCheck(
      "TBT vs before",
      "totalBlockingTimeMs",
      readBefore("totalBlockingTimeMs") + mobileBudget.allowedTbtRegressionMs,
    ),
    clsCheck,
    metricCheck(
      "FCP vs before",
      "firstContentfulPaintMs",
      readBefore("firstContentfulPaintMs") +
        mobileBudget.allowedFcpRegressionMs,
    ),
  ];
  if (afterResult.colorScheme === "dark") {
    // The dark before-number is only a valid baseline if it was dark too.
    mobileChecks.push({
      configurationKey,
      checkName: "Dark render proven",
      beforeValue: describeFlag(beforeResult?.isDarkRenderProven),
      afterValue: describeFlag(afterResult.isDarkRenderProven),
      limit: "before and after dark",
      status:
        beforeResult?.isDarkRenderProven === true &&
        afterResult.isDarkRenderProven === true
          ? "pass"
          : "fail",
    });
  }
  return mobileChecks;
}

function describeFlag(flag: boolean | undefined): string {
  if (flag === undefined) {
    return "missing";
  }
  return flag ? "yes" : "no";
}

function buildByteChecks({
  afterResult,
  beforeResult,
  bytesReferenceResult,
  hasBytesReference,
}: {
  afterResult: ConfigurationResult;
  beforeResult: ConfigurationResult | undefined;
  bytesReferenceResult: ConfigurationResult | undefined;
  hasBytesReference: boolean;
}): GateCheck[] {
  const configurationKey = afterResult.key;
  const readAfter = (category: keyof ByteTotals) =>
    toFiniteOrNaN(afterResult.byteMedians?.[category]);
  const readBefore = (category: keyof ByteTotals) =>
    toFiniteOrNaN(beforeResult?.byteMedians?.[category]);
  const byteCheck = (
    checkName: string,
    category: keyof ByteTotals,
    limitValue: number,
  ) =>
    buildThresholdCheck({
      configurationKey,
      checkName,
      beforeValue: readBefore(category),
      afterValue: readAfter(category),
      limitValue,
      direction: "atMost",
      valueFormat: category === "fontFileCount" ? "count" : "bytes",
    });

  const netTotalCheck = hasBytesReference
    ? byteCheck(
        "Net bytes vs bytes-ref",
        "netTotalBytes",
        toFiniteOrNaN(bytesReferenceResult?.byteMedians?.netTotalBytes),
      )
    : {
        configurationKey,
        checkName: "Net bytes vs bytes-ref",
        beforeValue: formatValue(readBefore("netTotalBytes"), "bytes"),
        afterValue: formatValue(readAfter("netTotalBytes"), "bytes"),
        limit: "no --bytes-ref",
        status: "skip" as const,
      };
  if (hasBytesReference && !bytesReferenceResult) {
    netTotalCheck.limit = "missing in bytes-ref";
  }

  return [
    netTotalCheck,
    byteCheck("CSS bytes", "cssBytes", CSS_CAP_BYTES),
    byteCheck(
      "First-party JS vs before",
      "firstPartyJavaScriptBytes",
      readBefore("firstPartyJavaScriptBytes"),
    ),
    byteCheck("Font bytes", "fontBytes", FONT_CAP_BYTES),
    byteCheck("Font files", "fontFileCount", FONT_FILE_CAP),
  ];
}

// Byte budgets are per route, not per mode: CSS/JS/font transfer does not
// depend on colour scheme, so they are read once from the mobile light run.
function isByteBudgetCarrier(configuration: PerfConfiguration): boolean {
  return (
    configuration.formFactor === "mobile" &&
    configuration.colorScheme === "light" &&
    !configuration.isFontBlocked
  );
}

function indexResultsByKey(
  perfReport: PerfReport | undefined,
): Map<string, ConfigurationResult> {
  return new Map(
    (perfReport?.results ?? []).map((result) => [result.key, result]),
  );
}

function findStalePairWarning(
  beforeResultsByKey: Map<string, ConfigurationResult>,
  afterResults: ConfigurationResult[],
): string | undefined {
  const staleKeys: string[] = [];
  let largestGapMs = 0;
  for (const afterResult of afterResults) {
    const beforeResult = beforeResultsByKey.get(afterResult.key);
    if (!beforeResult) {
      continue;
    }
    const gapMs = Math.abs(
      Date.parse(afterResult.measuredAt) - Date.parse(beforeResult.measuredAt),
    );
    if (gapMs > STALE_PAIR_THRESHOLD_MS) {
      staleKeys.push(afterResult.key);
      largestGapMs = Math.max(largestGapMs, gapMs);
    }
  }
  if (staleKeys.length === 0) {
    return undefined;
  }
  const largestGapHours = (largestGapMs / (60 * 60 * 1000)).toFixed(1);
  return (
    `Before and after are more than 24 h apart (up to ${largestGapHours} h) ` +
    `for ${staleKeys.join(", ")}. The gate assumes a paired run; ` +
    `staging drift can move the numbers, so consider re-measuring before.`
  );
}

function isH1Element(lcpElement: LcpElement | undefined): boolean {
  return lcpElement !== undefined && /^<h1[\s>]/i.test(lcpElement.snippet);
}

function findLcpElementWarnings(afterResults: ConfigurationResult[]): string[] {
  return afterResults
    .filter(
      (result) =>
        H1_EXPECTED_ROUTES.includes(result.route) && !result.isFontBlocked,
    )
    .flatMap((result) => {
      const runs = result.runs ?? [];
      const nonH1Runs = runs.filter((run) => !isH1Element(run.lcpElement));
      if (nonH1Runs.length === 0) {
        return [];
      }
      const selectors = [
        ...new Set(
          nonH1Runs.map((run) => run.lcpElement?.selector || "none recorded"),
        ),
      ];
      return [
        `${result.key} LCP element is not the H1 in ${nonH1Runs.length}/${runs.length} runs: ${selectors.join(", ")}`,
      ];
    });
}

// Signs a measurement is not what it claims to be, short of failing a check:
// a normal pass that did not paint, or a font-blocked pass where the block
// pattern missed the font files (so it did not test fallback fonts at all).
function findMeasurementValidityWarnings(
  afterResults: ConfigurationResult[],
): string[] {
  return afterResults.flatMap((result) => {
    if (result.isFontBlocked) {
      const fontBytes = toFiniteOrNaN(result.byteMedians?.fontBytes);
      return fontBytes > 0
        ? [
            `${result.key} still loaded ${formatValue(fontBytes, "bytes")} of font files; the block patterns did not match them, so this pass did not test fallback fonts.`,
          ]
        : [];
    }
    return result.didEveryRunRender
      ? []
      : [
          `${result.key} had passes that did not paint; its medians use only the passes that did.`,
        ];
  });
}

function describeReportSide(perfReport: PerfReport): string {
  const commitSuffix = perfReport.commitSha
    ? ` @ ${perfReport.commitSha.slice(0, 7)}`
    : "";
  return `${perfReport.measuredAt}${commitSuffix}`;
}

function formatComparisonMarkdown({
  checks,
  warnings,
  failingConfigurationKeys,
  beforeReport,
  afterReport,
  afterReportPath,
}: {
  checks: GateCheck[];
  warnings: string[];
  failingConfigurationKeys: string[];
  beforeReport: PerfReport;
  afterReport: PerfReport;
  afterReportPath: string;
}): string {
  const failedCount = checks.filter((check) => check.status === "fail").length;
  const verdict = failedCount === 0 ? "PASS" : "FAIL";
  const lines = [
    `## Perf gate: ${verdict}`,
    "",
    `${failedCount} of ${checks.length} checks failed. ` +
      `Before: ${describeReportSide(beforeReport)}. ` +
      `After: ${describeReportSide(afterReport)}. ` +
      `Lighthouse ${afterReport.lighthouseVersion}, ${afterReport.baseUrl}, ` +
      `median of ${afterReport.passesPerConfiguration} passes.`,
    "",
    "| Configuration | Check | Before | After | Limit | Result |",
    "|---|---|---|---|---|---|",
    ...checks.map(
      (check) =>
        `| ${check.configurationKey} | ${check.checkName} | ${check.beforeValue} | ${check.afterValue} | ${check.limit} | ${check.status.toUpperCase()} |`,
    ),
  ];
  if (warnings.length > 0) {
    lines.push(
      "",
      "### Warnings",
      "",
      ...warnings.map((warning) => `- ${warning}`),
    );
  }
  if (failingConfigurationKeys.length > 0) {
    const onlyFlags = failingConfigurationKeys
      .map((key) => `--only ${key}`)
      .join(" ");
    lines.push(
      "",
      "### Rerun failing configurations",
      "",
      "One rerun (fresh passes) is allowed; a failure after it blocks unless waived in the PR.",
      "",
      "```sh",
      `npm run perf:gate -- measure --base-url ${afterReport.baseUrl} --out ${afterReportPath} ${onlyFlags}`,
      "```",
    );
  }
  return `${lines.join("\n")}\n`;
}

/**
 * Applies the cutover budget to a paired before/after measurement. Every
 * matrix configuration is checked; a configuration missing from the after
 * report fails rather than being silently skipped.
 */
export function comparePerfReports({
  beforeReport,
  afterReport,
  bytesReferenceReport,
  afterReportPath = "after.json",
}: {
  beforeReport: PerfReport;
  afterReport: PerfReport;
  /** Frozen net-bytes reference (perf/baseline-pre-collapse.json). */
  bytesReferenceReport?: PerfReport;
  /** Only used to print a copy-pasteable rerun command. */
  afterReportPath?: string;
}): GateComparison {
  const beforeResultsByKey = indexResultsByKey(beforeReport);
  const afterResultsByKey = indexResultsByKey(afterReport);
  const bytesReferenceResultsByKey = indexResultsByKey(bytesReferenceReport);

  const checks = perfGateMatrix.flatMap((configuration): GateCheck[] => {
    const configurationKey = getConfigurationKey(configuration);
    const afterResult = afterResultsByKey.get(configurationKey);
    const beforeResult = beforeResultsByKey.get(configurationKey);
    if (!afterResult) {
      return [
        {
          configurationKey,
          checkName: "Measured",
          beforeValue: beforeResult ? "yes" : "missing",
          afterValue: "missing",
          limit: "in after report",
          status: "fail",
        },
      ];
    }
    const metricChecks = buildMetricChecks(afterResult, beforeResult);
    if (!isByteBudgetCarrier(configuration)) {
      return metricChecks;
    }
    return [
      ...metricChecks,
      ...buildByteChecks({
        afterResult,
        beforeResult,
        bytesReferenceResult: bytesReferenceResultsByKey.get(configurationKey),
        hasBytesReference: bytesReferenceReport !== undefined,
      }),
    ];
  });

  const afterResults = afterReport.results;
  const warnings = [
    findStalePairWarning(beforeResultsByKey, afterResults),
    beforeReport.lighthouseVersion !== afterReport.lighthouseVersion
      ? `Lighthouse versions differ: before ${beforeReport.lighthouseVersion}, after ${afterReport.lighthouseVersion}.`
      : undefined,
    ...findMeasurementValidityWarnings(afterResults),
    ...findLcpElementWarnings(afterResults),
  ].filter((warning): warning is string => warning !== undefined);

  const failingConfigurationKeys = [
    ...new Set(
      checks
        .filter((check) => check.status === "fail")
        .map((check) => check.configurationKey),
    ),
  ];

  return {
    checks,
    warnings,
    failingConfigurationKeys,
    markdown: formatComparisonMarkdown({
      checks,
      warnings,
      failingConfigurationKeys,
      beforeReport,
      afterReport,
      afterReportPath,
    }),
    exitCode: failingConfigurationKeys.length > 0 ? 1 : 0,
  };
}

const PERF_REPORT_SCHEMA_VERSION = 1;

/**
 * Builds the report `measure` writes. With a previousReport (a targeted rerun
 * via `--only`), the fresh configurations replace their old entries and every
 * other configuration is kept as it was, timestamps included.
 */
export function buildPerfReport({
  lighthouseVersion,
  baseUrl,
  commitSha,
  passesPerConfiguration,
  measuredAt,
  freshResults,
  previousReport,
}: {
  lighthouseVersion: string;
  baseUrl: string;
  commitSha?: string;
  passesPerConfiguration: number;
  measuredAt: string;
  freshResults: ConfigurationResult[];
  previousReport?: PerfReport;
}): PerfReport {
  if (previousReport && previousReport.baseUrl !== baseUrl) {
    throw new Error(
      `Refusing to merge a rerun against base URL ${baseUrl} into a report ` +
        `measured against ${previousReport.baseUrl}. Use a different --out file.`,
    );
  }
  const resultsByKey = indexResultsByKey(previousReport);
  for (const freshResult of freshResults) {
    resultsByKey.set(freshResult.key, freshResult);
  }
  const matrixOrder = perfGateMatrix.map(getConfigurationKey);
  const results = [...resultsByKey.values()].sort(
    (left, right) =>
      matrixOrder.indexOf(left.key) - matrixOrder.indexOf(right.key),
  );
  return {
    schemaVersion: PERF_REPORT_SCHEMA_VERSION,
    lighthouseVersion,
    baseUrl,
    measuredAt,
    ...(commitSha ? { commitSha } : {}),
    passesPerConfiguration,
    results,
  };
}

export const PERF_GATE_USAGE = `Usage:
  npm run perf:gate -- measure --base-url <url> --out <file.json>
      [--only <configuration-key>]... [--passes <n>] [--commit <sha>]
      [--chrome-path <path>]
  npm run perf:gate -- compare --before <file.json> --after <file.json>
      [--bytes-ref <file.json>]

measure   Runs ${perfGateMatrix.length} configurations x --passes (default 5) Lighthouse passes against
          --base-url and writes per-configuration medians plus raw runs.
          With --only and an existing --out file, re-measures just those
          configurations and merges them in (the targeted rerun).
compare   Prints a Markdown pass/fail table; exits 1 if any check fails.

Configuration keys:
  ${perfGateMatrix.map(getConfigurationKey).join("\n  ")}

See docs/perf-gate.md for the before -> deploy -> after procedure.`;

export type PerfGateCommand =
  | {
      command: "measure";
      baseUrl: string;
      outputPath: string;
      configurations: PerfConfiguration[];
      passesPerConfiguration: number;
      commitSha?: string;
      chromePath?: string;
    }
  | {
      command: "compare";
      beforePath: string;
      afterPath: string;
      bytesReferencePath?: string;
    };

const DEFAULT_PASSES_PER_CONFIGURATION = 5;

function requireOption(
  optionValue: string | undefined,
  optionName: string,
): string {
  if (!optionValue) {
    throw new Error(`Missing required ${optionName}.\n\n${PERF_GATE_USAGE}`);
  }
  return optionValue;
}

function parseBaseUrl(baseUrlText: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrlText);
  } catch {
    throw new Error(
      `--base-url must be an absolute http(s) URL, got "${baseUrlText}".`,
    );
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(
      `--base-url must be an absolute http(s) URL, got "${baseUrlText}".`,
    );
  }
  // Routes start with "/", so drop the trailing slash to avoid "//pricing".
  return parsedUrl.toString().replace(/\/+$/, "");
}

function selectConfigurations(onlyKeys: string[]): PerfConfiguration[] {
  const validKeys = perfGateMatrix.map(getConfigurationKey);
  const unknownKeys = onlyKeys.filter((key) => !validKeys.includes(key));
  if (unknownKeys.length > 0) {
    throw new Error(
      `Unknown --only configuration ${unknownKeys.join(", ")}. ` +
        `Valid keys:\n  ${validKeys.join("\n  ")}`,
    );
  }
  if (onlyKeys.length === 0) {
    return perfGateMatrix;
  }
  return perfGateMatrix.filter((configuration) =>
    onlyKeys.includes(getConfigurationKey(configuration)),
  );
}

function parsePassCount(passesText: string | undefined): number {
  if (passesText === undefined) {
    return DEFAULT_PASSES_PER_CONFIGURATION;
  }
  const passCount = Number(passesText);
  if (!Number.isInteger(passCount) || passCount < 1) {
    throw new Error(
      `--passes must be a positive integer, got "${passesText}".`,
    );
  }
  return passCount;
}

/** Parses and validates the CLI arguments (everything after the script). */
export function parsePerfGateArguments(
  commandLineArguments: string[],
): PerfGateCommand {
  const [commandName, ...optionArguments] = commandLineArguments;
  if (commandName === "measure") {
    const { values: options } = parseArgs({
      args: optionArguments,
      options: {
        "base-url": { type: "string" },
        out: { type: "string" },
        only: { type: "string", multiple: true },
        passes: { type: "string" },
        commit: { type: "string" },
        "chrome-path": { type: "string" },
      },
    });
    return {
      command: "measure",
      baseUrl: parseBaseUrl(requireOption(options["base-url"], "--base-url")),
      outputPath: requireOption(options.out, "--out"),
      configurations: selectConfigurations(options.only ?? []),
      passesPerConfiguration: parsePassCount(options.passes),
      ...(options.commit ? { commitSha: options.commit } : {}),
      ...(options["chrome-path"] ? { chromePath: options["chrome-path"] } : {}),
    };
  }
  if (commandName === "compare") {
    const { values: options } = parseArgs({
      args: optionArguments,
      options: {
        before: { type: "string" },
        after: { type: "string" },
        "bytes-ref": { type: "string" },
      },
    });
    return {
      command: "compare",
      beforePath: requireOption(options.before, "--before"),
      afterPath: requireOption(options.after, "--after"),
      ...(options["bytes-ref"]
        ? { bytesReferencePath: options["bytes-ref"] }
        : {}),
    };
  }
  throw new Error(
    `Unknown command "${commandName ?? ""}".\n\n${PERF_GATE_USAGE}`,
  );
}
