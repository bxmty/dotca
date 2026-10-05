/**
 * Perf gate (issue #614): a manually run Lighthouse gate for the cutover
 * budget in msp-playbook#163. It is not run in CI on purpose — shared runners
 * are too noisy for millisecond budgets.
 *
 * Run with Node 24's built-in TypeScript support (no build step):
 *
 *   npm run perf:gate -- measure --base-url <url> --out <file.json>
 *       [--only <configuration-key>]... [--passes <n>] [--commit <sha>]
 *       [--chrome-path <path>]
 *   npm run perf:gate -- compare --before <file.json> --after <file.json>
 *       [--bytes-ref <file.json>]
 *
 * Chrome: pass --chrome-path or set CHROME_PATH. Any Chrome/Chromium works,
 * e.g. the one Playwright installs under ~/.cache/ms-playwright/.
 *
 * Procedure (before -> deploy -> after, and the one targeted rerun) is in
 * docs/perf-gate.md. All gate logic lives in src/lib/perfGate.ts, which is
 * unit tested; this file only drives Chrome and does file I/O.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import lighthouse, { desktopConfig } from "lighthouse";
import type { Flags } from "lighthouse";
import puppeteer from "puppeteer-core";
import type { Browser } from "puppeteer-core";
import {
  assertDarkRender,
  buildPerfReport,
  comparePerfReports,
  extractRunSample,
  getConfigurationKey,
  parsePerfGateArguments,
  perfGateMatrix,
  summarizeConfigurationRuns,
} from "../src/lib/perfGate.ts";
import type {
  ConfigurationResult,
  PerfConfiguration,
  PerfReport,
  RenderProbe,
  RunSample,
} from "../src/lib/perfGate.ts";

// Blocks the font files themselves (self-hosted next/font output and Google
// Fonts' file CDN), not the stylesheets that declare them, so the pass shows
// what fallback fonts do to layout.
const FONT_FILE_URL_PATTERNS = [
  "*.woff2",
  "*.woff",
  "*.ttf",
  "*.otf",
  "*fonts.gstatic.com*",
];

function writeProgress(message: string): void {
  process.stderr.write(`${message}\n`);
}

function resolveChromePath(chromePath: string | undefined): string {
  const resolvedPath = chromePath ?? process.env.CHROME_PATH;
  if (!resolvedPath) {
    throw new Error(
      "No Chrome found. Pass --chrome-path <path> or set CHROME_PATH " +
        "(e.g. ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome).",
    );
  }
  return resolvedPath;
}

async function readPerfReport(reportPath: string): Promise<PerfReport> {
  return JSON.parse(await readFile(reportPath, "utf8")) as PerfReport;
}

/**
 * Dark mode is emulated with Puppeteer's emulateMediaFeatures on the page
 * Lighthouse then drives. It is scoped to that page (nothing browser-wide to
 * leak into light runs) and Lighthouse does not reset media emulation. The
 * proof is not that we asked for dark: after the run the page's computed
 * background is read and assertDarkRender throws if it is not dark, which
 * aborts the whole measurement rather than recording a light number as dark.
 */
async function measureOnePass({
  browser,
  pageUrl,
  configuration,
}: {
  browser: Browser;
  pageUrl: string;
  configuration: PerfConfiguration;
}): Promise<{ runSample: RunSample; lighthouseVersion: string }> {
  const page = await browser.newPage();
  try {
    if (configuration.colorScheme === "dark") {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: "dark" },
      ]);
    }
    const lighthouseFlags: Flags = {
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance"],
      ...(configuration.isFontBlocked
        ? { blockedUrlPatterns: FONT_FILE_URL_PATTERNS }
        : {}),
    };
    const runnerResult = await lighthouse(
      pageUrl,
      lighthouseFlags,
      configuration.formFactor === "desktop" ? desktopConfig : undefined,
      page,
    );
    if (!runnerResult) {
      throw new Error(`Lighthouse returned no result for ${pageUrl}`);
    }
    const runSample = extractRunSample(runnerResult.lhr);
    if (configuration.colorScheme === "dark") {
      const renderProbe: RenderProbe = await page.evaluate(() => ({
        bodyBackgroundColor: window.getComputedStyle(document.body)
          .backgroundColor,
        htmlBackgroundColor: window.getComputedStyle(document.documentElement)
          .backgroundColor,
      }));
      assertDarkRender(getConfigurationKey(configuration), renderProbe);
      runSample.renderProbe = renderProbe;
    }
    return {
      runSample,
      lighthouseVersion: runnerResult.lhr.lighthouseVersion,
    };
  } finally {
    await page.close();
  }
}

async function measureConfigurations({
  browser,
  baseUrl,
  configurations,
  passesPerConfiguration,
}: {
  browser: Browser;
  baseUrl: string;
  configurations: PerfConfiguration[];
  passesPerConfiguration: number;
}): Promise<{ results: ConfigurationResult[]; lighthouseVersion: string }> {
  const results: ConfigurationResult[] = [];
  let lighthouseVersion = "unknown";
  for (const configuration of configurations) {
    const configurationKey = getConfigurationKey(configuration);
    const runSamples: RunSample[] = [];
    // Sequential on purpose: parallel Lighthouse runs contend for CPU and
    // skew the simulated timings.
    for (
      let passNumber = 1;
      passNumber <= passesPerConfiguration;
      passNumber++
    ) {
      writeProgress(
        `${configurationKey} pass ${passNumber}/${passesPerConfiguration}`,
      );
      const passResult = await measureOnePass({
        browser,
        pageUrl: `${baseUrl}${configuration.route}`,
        configuration,
      });
      runSamples.push(passResult.runSample);
      lighthouseVersion = passResult.lighthouseVersion;
    }
    results.push(
      summarizeConfigurationRuns({
        configuration,
        runSamples,
        measuredAt: new Date().toISOString(),
      }),
    );
  }
  return { results, lighthouseVersion };
}

async function runMeasure(
  command: Extract<
    ReturnType<typeof parsePerfGateArguments>,
    { command: "measure" }
  >,
): Promise<void> {
  const isTargetedRerun =
    command.configurations.length < perfGateMatrix.length &&
    existsSync(command.outputPath);
  const previousReport = isTargetedRerun
    ? await readPerfReport(command.outputPath)
    : undefined;
  const browser = await puppeteer.launch({
    executablePath: resolveChromePath(command.chromePath),
    headless: true,
  });
  try {
    const { results, lighthouseVersion } = await measureConfigurations({
      browser,
      baseUrl: command.baseUrl,
      configurations: command.configurations,
      passesPerConfiguration: command.passesPerConfiguration,
    });
    const perfReport = buildPerfReport({
      lighthouseVersion,
      baseUrl: command.baseUrl,
      commitSha: command.commitSha ?? previousReport?.commitSha,
      passesPerConfiguration: command.passesPerConfiguration,
      measuredAt: new Date().toISOString(),
      freshResults: results,
      previousReport,
    });
    await mkdir(dirname(command.outputPath), { recursive: true });
    await writeFile(
      command.outputPath,
      `${JSON.stringify(perfReport, null, 2)}\n`,
    );
    writeProgress(
      `${isTargetedRerun ? "Merged" : "Wrote"} ${results.length} configuration(s) into ${command.outputPath}`,
    );
  } finally {
    await browser.close();
  }
}

async function runCompare(
  command: Extract<
    ReturnType<typeof parsePerfGateArguments>,
    { command: "compare" }
  >,
): Promise<void> {
  const comparison = comparePerfReports({
    beforeReport: await readPerfReport(command.beforePath),
    afterReport: await readPerfReport(command.afterPath),
    bytesReferenceReport: command.bytesReferencePath
      ? await readPerfReport(command.bytesReferencePath)
      : undefined,
    afterReportPath: command.afterPath,
  });
  process.stdout.write(comparison.markdown);
  process.exitCode = comparison.exitCode;
}

async function runPerfGate(): Promise<void> {
  try {
    const command = parsePerfGateArguments(process.argv.slice(2));
    if (command.command === "measure") {
      await runMeasure(command);
    } else {
      await runCompare(command);
    }
  } catch (error) {
    process.stderr.write(
      `perf-gate: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 2;
  }
}

await runPerfGate();
