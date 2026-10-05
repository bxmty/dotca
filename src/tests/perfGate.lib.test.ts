import {
  assertDarkRender,
  buildPerfReport as buildMeasuredPerfReport,
  calculateMedian,
  comparePerfReports,
  parsePerfGateArguments,
  extractRunSample,
  getConfigurationKey,
  perfGateMatrix,
  summarizeConfigurationRuns,
  isDarkRender,
} from "@/lib/perfGate";

describe("calculateMedian", () => {
  it("should return the middle value of an odd-length sample", () => {
    expect(calculateMedian([1900, 1700, 2400, 1750, 1800])).toBe(1800);
  });

  it("should average the two middle values of an even-length sample", () => {
    expect(calculateMedian([10, 40, 20, 30])).toBe(25);
  });

  it("should throw on an empty sample instead of inventing a value", () => {
    expect(() => calculateMedian([])).toThrow(/empty/);
  });
});

describe("isDarkRender", () => {
  it("should accept Bootstrap's dark body background", () => {
    expect(
      isDarkRender({
        bodyBackgroundColor: "rgb(33, 37, 41)",
        htmlBackgroundColor: "rgba(0, 0, 0, 0)",
      }),
    ).toBe(true);
  });

  it("should reject a white body background", () => {
    expect(
      isDarkRender({
        bodyBackgroundColor: "rgb(255, 255, 255)",
        htmlBackgroundColor: "rgba(0, 0, 0, 0)",
      }),
    ).toBe(false);
  });

  it("should fall back to the html background when the body is transparent", () => {
    expect(
      isDarkRender({
        bodyBackgroundColor: "rgba(0, 0, 0, 0)",
        htmlBackgroundColor: "rgb(18, 18, 18)",
      }),
    ).toBe(true);
  });

  it("should not count a fully transparent page as dark", () => {
    expect(
      isDarkRender({
        bodyBackgroundColor: "rgba(0, 0, 0, 0)",
        htmlBackgroundColor: "transparent",
      }),
    ).toBe(false);
  });
});

describe("assertDarkRender", () => {
  it("should throw loudly, naming the configuration and colour, when a dark run rendered light", () => {
    expect(() =>
      assertDarkRender("mobile-dark:/pricing", {
        bodyBackgroundColor: "rgb(255, 255, 255)",
        htmlBackgroundColor: "rgba(0, 0, 0, 0)",
      }),
    ).toThrow(
      /mobile-dark:\/pricing.*did not render dark.*rgb\(255, 255, 255\)/,
    );
  });

  it("should pass silently when the run rendered dark", () => {
    expect(() =>
      assertDarkRender("mobile-dark:/", {
        bodyBackgroundColor: "rgb(33, 37, 41)",
        htmlBackgroundColor: "rgba(0, 0, 0, 0)",
      }),
    ).not.toThrow();
  });
});

/**
 * A trimmed Lighthouse result: only the fields the gate reads, with the shape
 * Lighthouse 13 produces (network-requests table, lcp-breakdown-insight list
 * holding a node item).
 */
function buildLighthouseResult(overrides: Record<string, unknown> = {}) {
  return {
    lighthouseVersion: "13.5.0",
    finalDisplayedUrl: "https://staging.boximity.ca/pricing",
    categories: { performance: { score: 0.91 } },
    audits: {
      "largest-contentful-paint": { numericValue: 1834.6 },
      "total-blocking-time": { numericValue: 120 },
      "cumulative-layout-shift": { numericValue: 0.004 },
      "first-contentful-paint": { numericValue: 1210 },
      "network-requests": {
        details: {
          items: [
            {
              url: "https://staging.boximity.ca/pricing",
              resourceType: "Document",
              transferSize: 9000,
            },
            {
              url: "https://staging.boximity.ca/_next/static/css/app.css",
              resourceType: "Stylesheet",
              transferSize: 30000,
            },
            {
              url: "https://staging.boximity.ca/_next/static/chunks/main.js",
              resourceType: "Script",
              transferSize: 80000,
            },
            {
              url: "https://staging.boximity.ca/_next/static/chunks/page.js",
              resourceType: "Script",
              transferSize: 12000,
            },
            {
              url: "https://www.googletagmanager.com/gtag/js?id=G-X",
              resourceType: "Script",
              transferSize: 140000,
            },
            {
              url: "https://staging.boximity.ca/_next/static/media/inter.woff2",
              resourceType: "Font",
              transferSize: 25000,
            },
            {
              url: "https://staging.boximity.ca/_next/static/media/inter-bold.woff2",
              resourceType: "Font",
              transferSize: 24000,
            },
            {
              url: "https://staging.boximity.ca/images/hero.webp",
              resourceType: "Image",
              transferSize: 60000,
            },
          ],
        },
      },
      "lcp-breakdown-insight": {
        details: {
          type: "list",
          items: [
            {
              type: "table",
              items: [{ subpart: "timeToFirstByte", duration: 300 }],
            },
            {
              type: "node",
              selector: "main > section > h1",
              snippet: '<h1 class="display-4">',
              nodeLabel: "IT that just works",
            },
          ],
        },
      },
    },
    ...overrides,
  };
}

describe("extractRunSample", () => {
  it("should read the five gate metrics, with the score on a 0-100 scale", () => {
    const runSample = extractRunSample(buildLighthouseResult());

    expect(runSample).toMatchObject({
      performanceScore: 91,
      largestContentfulPaintMs: 1834.6,
      totalBlockingTimeMs: 120,
      cumulativeLayoutShift: 0.004,
      firstContentfulPaintMs: 1210,
      didRender: true,
    });
  });

  it("should total CSS, first-party JS and fonts, leaving GTM and images out of the net total", () => {
    expect(extractRunSample(buildLighthouseResult()).bytes).toEqual({
      cssBytes: 30000,
      firstPartyJavaScriptBytes: 92000,
      fontBytes: 49000,
      fontFileCount: 2,
      netTotalBytes: 171000,
    });
  });

  it("should not count a font request that was blocked (zero bytes transferred) as a font file", () => {
    const lighthouseResult = buildLighthouseResult();
    const networkRequests = (
      lighthouseResult.audits["network-requests"].details as {
        items: Array<Record<string, unknown>>;
      }
    ).items;
    networkRequests.push({
      url: "https://staging.boximity.ca/_next/static/media/blocked.woff2",
      resourceType: "Font",
      transferSize: 0,
      statusCode: -1,
    });

    expect(extractRunSample(lighthouseResult).bytes.fontFileCount).toBe(2);
  });

  it("should record the LCP element from the LCP breakdown insight", () => {
    expect(extractRunSample(buildLighthouseResult()).lcpElement).toEqual({
      selector: "main > section > h1",
      snippet: '<h1 class="display-4">',
    });
  });

  it("should leave the LCP element unset when Lighthouse found none", () => {
    const lighthouseResult = buildLighthouseResult();
    lighthouseResult.audits["lcp-breakdown-insight"] = {
      details: { type: "list", items: [] },
    };

    expect(extractRunSample(lighthouseResult).lcpElement).toBeUndefined();
  });

  it("should mark the page as not rendered when Lighthouse reports a runtime error", () => {
    const runSample = extractRunSample(
      buildLighthouseResult({
        runtimeError: {
          code: "NO_FCP",
          message: "The page did not paint any content.",
        },
        categories: { performance: { score: null } },
      }),
    );

    expect(runSample.didRender).toBe(false);
  });
});

describe("perfGateMatrix", () => {
  it("should cover the 12 configurations the cutover budget names", () => {
    expect(perfGateMatrix.map(getConfigurationKey).sort()).toEqual(
      [
        "desktop-light:/",
        "desktop-light:/blog/backups",
        "desktop-light:/pricing",
        "desktop-light:/services/managed-it-services-ontario",
        "mobile-dark:/",
        "mobile-dark:/pricing",
        "mobile-light-fonts-blocked:/",
        "mobile-light-fonts-blocked:/pricing",
        "mobile-light:/",
        "mobile-light:/blog/backups",
        "mobile-light:/pricing",
        "mobile-light:/services/managed-it-services-ontario",
      ].sort(),
    );
  });
});

function buildRunSample(overrides: Record<string, unknown> = {}) {
  return {
    performanceScore: 90,
    largestContentfulPaintMs: 1800,
    totalBlockingTimeMs: 100,
    cumulativeLayoutShift: 0.01,
    firstContentfulPaintMs: 1200,
    bytes: {
      cssBytes: 30000,
      firstPartyJavaScriptBytes: 90000,
      fontBytes: 40000,
      fontFileCount: 2,
      netTotalBytes: 160000,
    },
    lcpElement: { selector: "main > h1", snippet: "<h1>" },
    didRender: true,
    ...overrides,
  };
}

const MOBILE_DARK_HOME = {
  route: "/",
  formFactor: "mobile",
  colorScheme: "dark",
  isFontBlocked: false,
} as const;

const DARK_PROBE = {
  bodyBackgroundColor: "rgb(33, 37, 41)",
  htmlBackgroundColor: "rgba(0, 0, 0, 0)",
};

describe("summarizeConfigurationRuns", () => {
  const MOBILE_LIGHT_PRICING = {
    route: "/pricing",
    formFactor: "mobile",
    colorScheme: "light",
    isFontBlocked: false,
  } as const;

  it("should keep per-run raw values and report the median of each metric and byte category", () => {
    const largestContentfulPaintsMs = [1900, 1700, 2400, 1750, 1800];
    const runSamples = largestContentfulPaintsMs.map(
      (largestContentfulPaintMs, index) =>
        buildRunSample({
          largestContentfulPaintMs,
          bytes: {
            cssBytes: 30000 + index,
            firstPartyJavaScriptBytes: 90000,
            fontBytes: 40000,
            fontFileCount: 2,
            netTotalBytes: 160000 + index,
          },
        }),
    );

    const configurationResult = summarizeConfigurationRuns({
      configuration: MOBILE_LIGHT_PRICING,
      runSamples,
      measuredAt: "2026-10-05T12:00:00.000Z",
    });

    expect(configurationResult.key).toBe("mobile-light:/pricing");
    expect(configurationResult.measuredAt).toBe("2026-10-05T12:00:00.000Z");
    expect(configurationResult.medians.largestContentfulPaintMs).toBe(1800);
    expect(configurationResult.byteMedians.cssBytes).toBe(30002);
    expect(configurationResult.byteMedians.netTotalBytes).toBe(160002);
    expect(configurationResult.runs).toHaveLength(5);
    expect(configurationResult.didEveryRunRender).toBe(true);
  });

  it("should report a configuration as not rendered when any pass failed to paint", () => {
    const configurationResult = summarizeConfigurationRuns({
      configuration: MOBILE_LIGHT_PRICING,
      runSamples: [
        buildRunSample(),
        buildRunSample({
          didRender: false,
          firstContentfulPaintMs: Number.NaN,
        }),
        buildRunSample(),
      ],
      measuredAt: "2026-10-05T12:00:00.000Z",
    });

    expect(configurationResult.didEveryRunRender).toBe(false);
    expect(configurationResult.medians.firstContentfulPaintMs).toBe(1200);
  });

  it("should prove a dark configuration only when every run carries a dark render probe", () => {
    const provenResult = summarizeConfigurationRuns({
      configuration: MOBILE_DARK_HOME,
      runSamples: [
        buildRunSample({ renderProbe: DARK_PROBE }),
        buildRunSample({ renderProbe: DARK_PROBE }),
      ],
      measuredAt: "2026-10-05T12:00:00.000Z",
    });
    const unprovenResult = summarizeConfigurationRuns({
      configuration: MOBILE_DARK_HOME,
      runSamples: [
        buildRunSample({ renderProbe: DARK_PROBE }),
        buildRunSample(),
      ],
      measuredAt: "2026-10-05T12:00:00.000Z",
    });

    expect(provenResult.isDarkRenderProven).toBe(true);
    expect(unprovenResult.isDarkRenderProven).toBe(false);
  });
});

const BEFORE_MEASURED_AT = "2026-10-05T10:00:00.000Z";
const AFTER_MEASURED_AT = "2026-10-05T11:30:00.000Z";

const DESKTOP_DEFAULTS = {
  performanceScore: 99,
  largestContentfulPaintMs: 700,
  totalBlockingTimeMs: 20,
  firstContentfulPaintMs: 500,
};

/**
 * A full-matrix report with one pass per configuration, so each median is the
 * pass value itself. Overrides are keyed by configuration key.
 */
function buildPerfReport({
  measuredAt = BEFORE_MEASURED_AT,
  overridesByKey = {},
  omittedKeys = [],
}: {
  measuredAt?: string;
  overridesByKey?: Record<string, Record<string, unknown>>;
  omittedKeys?: string[];
} = {}) {
  return {
    schemaVersion: 1,
    lighthouseVersion: "13.5.0",
    baseUrl: "https://staging.boximity.ca",
    measuredAt,
    passesPerConfiguration: 1,
    results: perfGateMatrix
      .filter(
        (configuration) =>
          !omittedKeys.includes(getConfigurationKey(configuration)),
      )
      .map((configuration) =>
        summarizeConfigurationRuns({
          configuration,
          measuredAt,
          runSamples: [
            buildRunSample({
              ...(configuration.formFactor === "desktop"
                ? DESKTOP_DEFAULTS
                : {}),
              ...(configuration.colorScheme === "dark"
                ? { renderProbe: DARK_PROBE }
                : {}),
              ...overridesByKey[getConfigurationKey(configuration)],
            }),
          ],
        }),
      ),
  };
}

function compareWithAfter(
  afterOverridesByKey: Record<string, Record<string, unknown>>,
  beforeOverridesByKey: Record<string, Record<string, unknown>> = {},
) {
  return comparePerfReports({
    beforeReport: buildPerfReport({ overridesByKey: beforeOverridesByKey }),
    afterReport: buildPerfReport({
      measuredAt: AFTER_MEASURED_AT,
      overridesByKey: afterOverridesByKey,
    }),
  });
}

function findCheckStatus(
  comparison: ReturnType<typeof comparePerfReports>,
  configurationKey: string,
  checkName: string,
) {
  const matchingChecks = comparison.checks.filter(
    (check) =>
      check.configurationKey === configurationKey &&
      check.checkName === checkName,
  );
  expect(matchingChecks).toHaveLength(1);
  return matchingChecks[0].status;
}

describe("comparePerfReports", () => {
  it("should pass every check and exit 0 when before and after are identical", () => {
    const comparison = compareWithAfter({});

    expect(
      comparison.checks.filter((check) => check.status === "fail"),
    ).toEqual([]);
    expect(comparison.exitCode).toBe(0);
    expect(comparison.failingConfigurationKeys).toEqual([]);
  });

  describe("mobile thresholds (relative to the paired before median)", () => {
    const KEY = "mobile-light:/pricing";

    it.each([
      ["Perf score", { performanceScore: 87 }, "pass"],
      ["Perf score", { performanceScore: 86 }, "fail"],
      ["LCP vs before", { largestContentfulPaintMs: 1950 }, "pass"],
      ["LCP vs before", { largestContentfulPaintMs: 1951 }, "fail"],
      ["TBT vs before", { totalBlockingTimeMs: 150 }, "pass"],
      ["TBT vs before", { totalBlockingTimeMs: 151 }, "fail"],
      ["CLS", { cumulativeLayoutShift: 0.02 }, "pass"],
      ["CLS", { cumulativeLayoutShift: 0.021 }, "fail"],
      ["FCP vs before", { firstContentfulPaintMs: 1350 }, "pass"],
      ["FCP vs before", { firstContentfulPaintMs: 1351 }, "fail"],
    ])(
      "%s with after %o should %s",
      (checkName, afterOverride, expectedStatus) => {
        const comparison = compareWithAfter({ [KEY]: afterOverride });

        expect(findCheckStatus(comparison, KEY, checkName)).toBe(
          expectedStatus,
        );
      },
    );

    it("should fail the 2.0 s LCP cap even when the regression is inside +150 ms", () => {
      const comparison = compareWithAfter(
        { [KEY]: { largestContentfulPaintMs: 2050 } },
        { [KEY]: { largestContentfulPaintMs: 1950 } },
      );

      expect(findCheckStatus(comparison, KEY, "LCP vs before")).toBe("pass");
      expect(findCheckStatus(comparison, KEY, "LCP cap")).toBe("fail");
      expect(comparison.exitCode).toBe(1);
    });

    it("should pass the LCP cap at exactly 2.0 s", () => {
      const comparison = compareWithAfter(
        { [KEY]: { largestContentfulPaintMs: 2000 } },
        { [KEY]: { largestContentfulPaintMs: 1950 } },
      );

      expect(findCheckStatus(comparison, KEY, "LCP cap")).toBe("pass");
    });
  });

  describe("desktop thresholds", () => {
    const KEY = "desktop-light:/";

    it.each([
      ["Perf score", { performanceScore: 98 }, "pass"],
      ["Perf score", { performanceScore: 97 }, "fail"],
      ["TBT cap", { totalBlockingTimeMs: 50 }, "pass"],
      ["TBT cap", { totalBlockingTimeMs: 51 }, "fail"],
      ["CLS", { cumulativeLayoutShift: 0.021 }, "fail"],
      ["LCP vs before", { largestContentfulPaintMs: 800 }, "pass"],
      ["LCP vs before", { largestContentfulPaintMs: 801 }, "fail"],
      ["FCP vs before", { firstContentfulPaintMs: 600 }, "pass"],
      ["FCP vs before", { firstContentfulPaintMs: 601 }, "fail"],
    ])(
      "%s with after %o should %s",
      (checkName, afterOverride, expectedStatus) => {
        const comparison = compareWithAfter({ [KEY]: afterOverride });

        expect(findCheckStatus(comparison, KEY, checkName)).toBe(
          expectedStatus,
        );
      },
    );

    it("should hold the desktop score to an absolute 98 even when before was already lower", () => {
      const comparison = compareWithAfter(
        { [KEY]: { performanceScore: 97 } },
        { [KEY]: { performanceScore: 96 } },
      );

      expect(findCheckStatus(comparison, KEY, "Perf score")).toBe("fail");
    });

    it("should fail the 0.8 s LCP cap even when the regression is inside +100 ms", () => {
      const comparison = compareWithAfter(
        { [KEY]: { largestContentfulPaintMs: 820 } },
        { [KEY]: { largestContentfulPaintMs: 750 } },
      );

      expect(findCheckStatus(comparison, KEY, "LCP vs before")).toBe("pass");
      expect(findCheckStatus(comparison, KEY, "LCP cap")).toBe("fail");
    });
  });

  describe("font-blocked pass", () => {
    const KEY = "mobile-light-fonts-blocked:/pricing";

    it("should only gate CLS and that the page still renders", () => {
      const comparison = compareWithAfter({
        [KEY]: { largestContentfulPaintMs: 9000, performanceScore: 10 },
      });
      const checkNames = comparison.checks
        .filter((check) => check.configurationKey === KEY)
        .map((check) => check.checkName);

      expect(checkNames).toEqual(["CLS", "Page renders"]);
      expect(comparison.exitCode).toBe(0);
    });

    it("should fail when blocking fonts shifts layout past 0.02", () => {
      const comparison = compareWithAfter({
        [KEY]: { cumulativeLayoutShift: 0.03 },
      });

      expect(findCheckStatus(comparison, KEY, "CLS")).toBe("fail");
    });

    it("should warn when the font-blocked pass still transferred font bytes", () => {
      const comparison = compareWithAfter({
        [KEY]: {
          bytes: {
            cssBytes: 30000,
            firstPartyJavaScriptBytes: 90000,
            fontBytes: 40000,
            fontFileCount: 2,
            netTotalBytes: 160000,
          },
        },
      });

      expect(comparison.warnings.join("\n")).toMatch(
        /mobile-light-fonts-blocked:\/pricing still loaded .*font/,
      );
    });

    it("should fail when the page does not render with fonts blocked", () => {
      const comparison = compareWithAfter({
        [KEY]: { didRender: false, firstContentfulPaintMs: Number.NaN },
      });

      expect(findCheckStatus(comparison, KEY, "Page renders")).toBe("fail");
    });
  });

  describe("dark mode", () => {
    const KEY = "mobile-dark:/pricing";

    it("should fail when the after run did not prove a dark render", () => {
      const comparison = compareWithAfter({
        [KEY]: { renderProbe: undefined },
      });

      expect(findCheckStatus(comparison, KEY, "Dark render proven")).toBe(
        "fail",
      );
      expect(comparison.exitCode).toBe(1);
    });

    it("should fail when the paired before number was not a proven dark render", () => {
      const comparison = compareWithAfter(
        {},
        {
          [KEY]: {
            renderProbe: {
              bodyBackgroundColor: "rgb(255, 255, 255)",
              htmlBackgroundColor: "rgba(0, 0, 0, 0)",
            },
          },
        },
      );

      expect(findCheckStatus(comparison, KEY, "Dark render proven")).toBe(
        "fail",
      );
    });

    it("should hold dark runs to the mobile relative thresholds", () => {
      const comparison = compareWithAfter({
        [KEY]: { largestContentfulPaintMs: 1951 },
      });

      expect(findCheckStatus(comparison, KEY, "LCP vs before")).toBe("fail");
    });
  });

  describe("byte budgets", () => {
    const KEY = "mobile-light:/pricing";
    const withBytes = (bytes: Record<string, number>) => ({
      bytes: {
        cssBytes: 30000,
        firstPartyJavaScriptBytes: 90000,
        fontBytes: 40000,
        fontFileCount: 2,
        netTotalBytes: 160000,
        ...bytes,
      },
    });

    it("should skip the net total without failing when no bytes-ref is supplied", () => {
      const comparison = compareWithAfter({});

      expect(findCheckStatus(comparison, KEY, "Net bytes vs bytes-ref")).toBe(
        "skip",
      );
      expect(comparison.exitCode).toBe(0);
    });

    it("should hold the net total to the frozen bytes-ref", () => {
      const bytesReferenceReport = buildPerfReport({
        overridesByKey: { [KEY]: withBytes({ netTotalBytes: 150000 }) },
      });
      const compareNetTotal = (netTotalBytes: number) =>
        comparePerfReports({
          beforeReport: buildPerfReport(),
          afterReport: buildPerfReport({
            measuredAt: AFTER_MEASURED_AT,
            overridesByKey: { [KEY]: withBytes({ netTotalBytes }) },
          }),
          bytesReferenceReport,
        });

      expect(
        findCheckStatus(compareNetTotal(150000), KEY, "Net bytes vs bytes-ref"),
      ).toBe("pass");
      expect(
        findCheckStatus(compareNetTotal(150001), KEY, "Net bytes vs bytes-ref"),
      ).toBe("fail");
    });

    it("should fail the net total when the bytes-ref has no entry for the route", () => {
      const comparison = comparePerfReports({
        beforeReport: buildPerfReport(),
        afterReport: buildPerfReport({ measuredAt: AFTER_MEASURED_AT }),
        bytesReferenceReport: buildPerfReport({ omittedKeys: [KEY] }),
      });

      expect(findCheckStatus(comparison, KEY, "Net bytes vs bytes-ref")).toBe(
        "fail",
      );
    });

    it.each([
      ["CSS bytes", { cssBytes: 35 * 1024 }, "pass"],
      ["CSS bytes", { cssBytes: 35 * 1024 + 1 }, "fail"],
      [
        "First-party JS vs before",
        { firstPartyJavaScriptBytes: 90000 },
        "pass",
      ],
      [
        "First-party JS vs before",
        { firstPartyJavaScriptBytes: 90001 },
        "fail",
      ],
      ["Font bytes", { fontBytes: 60 * 1024 }, "pass"],
      ["Font bytes", { fontBytes: 60 * 1024 + 1 }, "fail"],
      ["Font files", { fontFileCount: 2 }, "pass"],
      ["Font files", { fontFileCount: 3 }, "fail"],
    ])(
      "%s with after %o should %s",
      (checkName, byteOverride, expectedStatus) => {
        const comparison = compareWithAfter({ [KEY]: withBytes(byteOverride) });

        expect(findCheckStatus(comparison, KEY, checkName)).toBe(
          expectedStatus,
        );
      },
    );

    it("should apply byte budgets once per route, on the mobile light run", () => {
      const comparison = compareWithAfter({});
      const cssCheckKeys = comparison.checks
        .filter((check) => check.checkName === "CSS bytes")
        .map((check) => check.configurationKey);

      expect(cssCheckKeys).toEqual([
        "mobile-light:/",
        "mobile-light:/services/managed-it-services-ontario",
        "mobile-light:/pricing",
        "mobile-light:/blog/backups",
      ]);
    });
  });

  it("should fail a matrix configuration missing from the after report", () => {
    const comparison = comparePerfReports({
      beforeReport: buildPerfReport(),
      afterReport: buildPerfReport({
        measuredAt: AFTER_MEASURED_AT,
        omittedKeys: ["desktop-light:/pricing"],
      }),
    });

    expect(
      findCheckStatus(comparison, "desktop-light:/pricing", "Measured"),
    ).toBe("fail");
  });

  it("should fail relative checks when the before report lacks the configuration", () => {
    const comparison = comparePerfReports({
      beforeReport: buildPerfReport({ omittedKeys: ["mobile-light:/pricing"] }),
      afterReport: buildPerfReport({ measuredAt: AFTER_MEASURED_AT }),
    });

    expect(
      findCheckStatus(comparison, "mobile-light:/pricing", "LCP vs before"),
    ).toBe("fail");
    expect(findCheckStatus(comparison, "mobile-light:/pricing", "CLS")).toBe(
      "pass",
    );
  });

  it("should treat a metric lost in JSON (NaN serialised as null) as a failure, not a pass", () => {
    const afterReport = JSON.parse(
      JSON.stringify(
        buildPerfReport({
          measuredAt: AFTER_MEASURED_AT,
          overridesByKey: {
            "mobile-light:/": { largestContentfulPaintMs: Number.NaN },
          },
        }),
      ),
    );
    const comparison = comparePerfReports({
      beforeReport: buildPerfReport(),
      afterReport,
    });

    expect(findCheckStatus(comparison, "mobile-light:/", "LCP cap")).toBe(
      "fail",
    );
  });

  describe("staleness warning", () => {
    it("should not warn when before and after are exactly 24 h apart", () => {
      const comparison = comparePerfReports({
        beforeReport: buildPerfReport({
          measuredAt: "2026-10-04T10:00:00.000Z",
        }),
        afterReport: buildPerfReport({
          measuredAt: "2026-10-05T10:00:00.000Z",
        }),
      });

      expect(comparison.warnings.join("\n")).not.toMatch(/24 h/);
    });

    it("should warn, without failing, when before and after are more than 24 h apart", () => {
      const comparison = comparePerfReports({
        beforeReport: buildPerfReport({
          measuredAt: "2026-10-04T10:00:00.000Z",
        }),
        afterReport: buildPerfReport({
          measuredAt: "2026-10-05T10:01:00.000Z",
        }),
      });

      expect(comparison.warnings.join("\n")).toMatch(/more than 24 h apart/);
      expect(comparison.markdown).toMatch(/more than 24 h apart/);
      expect(comparison.exitCode).toBe(0);
    });
  });

  describe("LCP element (report-only)", () => {
    it("should warn when the LCP element is not the H1 on the home page", () => {
      const comparison = compareWithAfter({
        "mobile-light:/": {
          lcpElement: {
            selector: "div.hero > img",
            snippet: '<img class="hero">',
          },
        },
      });

      expect(comparison.warnings.join("\n")).toMatch(
        /mobile-light:\/ LCP element is not the H1.*div\.hero > img/,
      );
      expect(comparison.exitCode).toBe(0);
    });

    it("should not flag a non-H1 LCP element on routes where the H1 is not expected", () => {
      const comparison = compareWithAfter({
        "mobile-light:/pricing": {
          lcpElement: { selector: "div.card", snippet: '<div class="card">' },
        },
      });

      expect(comparison.warnings.join("\n")).not.toMatch(/LCP element/);
    });
  });

  describe("Markdown output", () => {
    it("should print one table row per check with its result", () => {
      const comparison = compareWithAfter({
        "mobile-light:/pricing": { largestContentfulPaintMs: 2050 },
      });

      expect(comparison.markdown).toContain(
        "| Configuration | Check | Before | After | Limit | Result |",
      );
      expect(comparison.markdown).toContain(
        "| mobile-light:/pricing | LCP cap | 1800 ms | 2050 ms | ≤ 2000 ms | FAIL |",
      );
      expect(comparison.markdown).toContain(
        "| mobile-light:/pricing | CSS bytes | 29.3 KiB | 29.3 KiB | ≤ 35.0 KiB | PASS |",
      );
      const tableRows = comparison.markdown
        .split("\n")
        .filter(
          (line) =>
            line.startsWith("| ") && !line.startsWith("| Configuration"),
        );
      expect(tableRows).toHaveLength(comparison.checks.length);
    });

    it("should headline the verdict and name the failing configurations to rerun", () => {
      const comparison = compareWithAfter({
        "mobile-light:/pricing": { largestContentfulPaintMs: 2050 },
      });

      expect(comparison.markdown).toMatch(/^## Perf gate: FAIL/);
      expect(comparison.failingConfigurationKeys).toEqual([
        "mobile-light:/pricing",
      ]);
      expect(comparison.markdown).toContain("--only mobile-light:/pricing");
    });

    it("should headline a pass when nothing failed", () => {
      expect(compareWithAfter({}).markdown).toMatch(/^## Perf gate: PASS/);
    });
  });
});

describe("parsePerfGateArguments", () => {
  it("should default measure to the full matrix and 5 passes", () => {
    const command = parsePerfGateArguments([
      "measure",
      "--base-url",
      "https://staging.boximity.ca/",
      "--out",
      "perf/before.json",
    ]);

    expect(command).toMatchObject({
      command: "measure",
      baseUrl: "https://staging.boximity.ca",
      outputPath: "perf/before.json",
      passesPerConfiguration: 5,
    });
    expect(command.command === "measure" && command.configurations).toEqual(
      perfGateMatrix,
    );
  });

  it("should narrow measure to the configurations named by repeated --only flags", () => {
    const command = parsePerfGateArguments([
      "measure",
      "--base-url",
      "http://localhost:3000",
      "--out",
      "after.json",
      "--only",
      "mobile-dark:/pricing",
      "--only",
      "desktop-light:/",
      "--commit",
      "abc1234",
    ]);

    expect(
      command.command === "measure" &&
        command.configurations.map(getConfigurationKey),
    ).toEqual(["desktop-light:/", "mobile-dark:/pricing"]);
    expect(command).toMatchObject({ commitSha: "abc1234" });
  });

  it("should reject an --only key that is not in the matrix, listing the valid keys", () => {
    expect(() =>
      parsePerfGateArguments([
        "measure",
        "--base-url",
        "http://localhost:3000",
        "--out",
        "after.json",
        "--only",
        "desktop-dark:/",
      ]),
    ).toThrow(/desktop-dark:\/.*mobile-light:\/pricing/s);
  });

  it("should reject a base URL that is not http(s)", () => {
    expect(() =>
      parsePerfGateArguments([
        "measure",
        "--base-url",
        "staging",
        "--out",
        "a.json",
      ]),
    ).toThrow(/--base-url/);
  });

  it("should reject a pass count that is not a positive integer", () => {
    expect(() =>
      parsePerfGateArguments([
        "measure",
        "--base-url",
        "http://localhost:3000",
        "--out",
        "a.json",
        "--passes",
        "0",
      ]),
    ).toThrow(/--passes/);
  });

  it("should parse compare with an optional bytes-ref", () => {
    expect(
      parsePerfGateArguments([
        "compare",
        "--before",
        "before.json",
        "--after",
        "after.json",
        "--bytes-ref",
        "perf/baseline-pre-collapse.json",
      ]),
    ).toEqual({
      command: "compare",
      beforePath: "before.json",
      afterPath: "after.json",
      bytesReferencePath: "perf/baseline-pre-collapse.json",
    });
  });

  it("should require --before and --after for compare", () => {
    expect(() =>
      parsePerfGateArguments(["compare", "--before", "before.json"]),
    ).toThrow(/--after/);
  });

  it("should reject an unknown command with usage", () => {
    expect(() => parsePerfGateArguments(["benchmark"])).toThrow(/Usage/);
  });
});

describe("buildPerfReport", () => {
  const metadata = {
    lighthouseVersion: "13.5.0",
    baseUrl: "https://staging.boximity.ca",
    commitSha: "abc1234",
    passesPerConfiguration: 5,
  };
  const resultFor = (key: string, measuredAt: string, performanceScore = 90) =>
    summarizeConfigurationRuns({
      configuration: perfGateMatrix.find(
        (configuration) => getConfigurationKey(configuration) === key,
      )!,
      runSamples: [buildRunSample({ performanceScore })],
      measuredAt,
    });

  it("should write a fresh measurement with its metadata", () => {
    const perfReport = buildMeasuredPerfReport({
      ...metadata,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [resultFor("mobile-light:/", BEFORE_MEASURED_AT)],
    });

    expect(perfReport).toMatchObject({
      schemaVersion: 1,
      lighthouseVersion: "13.5.0",
      baseUrl: "https://staging.boximity.ca",
      measuredAt: BEFORE_MEASURED_AT,
      commitSha: "abc1234",
      passesPerConfiguration: 5,
    });
    expect(perfReport.results.map((result) => result.key)).toEqual([
      "mobile-light:/",
    ]);
  });

  it("should replace only the rerun configurations when merging into a previous report", () => {
    const previousReport = buildMeasuredPerfReport({
      ...metadata,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [
        resultFor("mobile-light:/", BEFORE_MEASURED_AT, 80),
        resultFor("mobile-light:/pricing", BEFORE_MEASURED_AT, 80),
      ],
    });

    const mergedReport = buildMeasuredPerfReport({
      ...metadata,
      measuredAt: AFTER_MEASURED_AT,
      previousReport,
      freshResults: [resultFor("mobile-light:/pricing", AFTER_MEASURED_AT, 95)],
    });

    expect(
      mergedReport.results.map((result) => [
        result.key,
        result.medians.performanceScore,
        result.measuredAt,
      ]),
    ).toEqual([
      ["mobile-light:/", 80, BEFORE_MEASURED_AT],
      ["mobile-light:/pricing", 95, AFTER_MEASURED_AT],
    ]);
    expect(mergedReport.measuredAt).toBe(AFTER_MEASURED_AT);
  });

  it("should refuse to merge a rerun against a different base URL", () => {
    const previousReport = buildMeasuredPerfReport({
      ...metadata,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [],
    });

    expect(() =>
      buildMeasuredPerfReport({
        ...metadata,
        baseUrl: "http://localhost:3000",
        measuredAt: AFTER_MEASURED_AT,
        previousReport,
        freshResults: [],
      }),
    ).toThrow(/base URL/);
  });
});
