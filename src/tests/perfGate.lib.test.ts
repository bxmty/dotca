import {
  PERF_GATE_USAGE,
  assertDarkRender,
  buildPerfReport,
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

describe("isDarkRender luminance", () => {
  const TRANSPARENT = "rgba(0, 0, 0, 0)";
  const isDarkBody = (bodyBackgroundColor: string) =>
    isDarkRender({ bodyBackgroundColor, htmlBackgroundColor: TRANSPARENT });

  // Each pair straddles the 0.2 relative-luminance ceiling by one channel step.
  it.each([
    ["mid grey", "rgb(123, 123, 123)", "rgb(124, 124, 124)"],
    ["red", "rgb(248, 0, 0)", "rgb(249, 0, 0)"],
    ["green", "rgb(0, 144, 0)", "rgb(0, 145, 0)"],
    ["green over full blue", "rgb(0, 117, 255)", "rgb(0, 118, 255)"],
    ["green over red", "rgb(200, 92, 0)", "rgb(200, 93, 0)"],
  ])("should split %s at the 0.2 ceiling", (_name, darkColor, lightColor) => {
    expect(isDarkBody(darkColor)).toBe(true);
    expect(isDarkBody(lightColor)).toBe(false);
  });

  it("should count full blue as dark and near-black as dark", () => {
    expect(isDarkBody("rgb(0, 0, 255)")).toBe(true);
    expect(isDarkBody("rgb(10, 10, 10)")).toBe(true);
  });

  it("should treat a partly transparent body as painted", () => {
    expect(
      isDarkRender({
        bodyBackgroundColor: "rgba(0, 0, 0, 0.5)",
        htmlBackgroundColor: "rgb(255, 255, 255)",
      }),
    ).toBe(true);
  });

  it("should treat a zero percent alpha as transparent", () => {
    expect(
      isDarkRender({
        bodyBackgroundColor: "rgb(0 0 0 / 0%)",
        htmlBackgroundColor: "rgb(255, 255, 255)",
      }),
    ).toBe(false);
  });

  it.each(["rgb(0, 0, 0) and more", "color: rgb(0, 0, 0)", "#000000", "black"])(
    "should not read %p as a painted colour",
    (bodyBackgroundColor) => {
      expect(isDarkBody(bodyBackgroundColor)).toBe(false);
    },
  );
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

  it("should keep third-party CSS and fonts in their caps but out of the net total", () => {
    const lighthouseResult = buildLighthouseResult();
    const networkRequests = (
      lighthouseResult.audits["network-requests"].details as {
        items: Array<Record<string, unknown>>;
      }
    ).items;
    networkRequests.push(
      {
        url: "https://fonts.googleapis.com/css2?family=Inter",
        resourceType: "Stylesheet",
        transferSize: 1000,
      },
      {
        url: "https://fonts.gstatic.com/s/inter/v1/inter.woff2",
        resourceType: "Font",
        transferSize: 20000,
      },
    );

    expect(extractRunSample(lighthouseResult).bytes).toEqual({
      cssBytes: 31000,
      firstPartyJavaScriptBytes: 92000,
      fontBytes: 69000,
      fontFileCount: 3,
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

  it("should report a metric whose audit is missing as NaN instead of throwing", () => {
    const lighthouseResult = buildLighthouseResult();
    delete (lighthouseResult.audits as Record<string, unknown>)[
      "total-blocking-time"
    ];

    const runSample = extractRunSample(lighthouseResult);

    expect(runSample.totalBlockingTimeMs).toBeNaN();
    expect(runSample.largestContentfulPaintMs).toBe(1834.6);
    expect(runSample.didRender).toBe(true);
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

  it("should leave the dark-render proof off a light configuration", () => {
    const configurationResult = summarizeConfigurationRuns({
      configuration: MOBILE_LIGHT_PRICING,
      runSamples: [buildRunSample()],
      measuredAt: "2026-10-05T10:00:00.000Z",
    });

    expect(configurationResult).not.toHaveProperty("isDarkRenderProven");
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
 * A full-matrix report whose passes are identical, so each median is the
 * pass value itself. Overrides are keyed by configuration key.
 */
function buildFixtureReport({
  measuredAt = BEFORE_MEASURED_AT,
  overridesByKey = {},
  omittedKeys = [],
  passesPerConfiguration = 5,
}: {
  measuredAt?: string;
  overridesByKey?: Record<string, Record<string, unknown>>;
  omittedKeys?: string[];
  passesPerConfiguration?: number;
} = {}) {
  return {
    schemaVersion: 1,
    lighthouseVersion: "13.5.0",
    baseUrl: "https://staging.boximity.ca",
    measuredAt,
    passesPerConfiguration,
    results: perfGateMatrix
      .filter(
        (configuration) =>
          !omittedKeys.includes(getConfigurationKey(configuration)),
      )
      .map((configuration) =>
        summarizeConfigurationRuns({
          configuration,
          measuredAt,
          runSamples: Array.from({ length: passesPerConfiguration }, () =>
            buildRunSample({
              ...(configuration.formFactor === "desktop"
                ? DESKTOP_DEFAULTS
                : {}),
              ...(configuration.colorScheme === "dark"
                ? { renderProbe: DARK_PROBE }
                : {}),
              ...overridesByKey[getConfigurationKey(configuration)],
            }),
          ),
        }),
      ),
  };
}

function compareWithAfter(
  afterOverridesByKey: Record<string, Record<string, unknown>>,
  beforeOverridesByKey: Record<string, Record<string, unknown>> = {},
) {
  return comparePerfReports({
    beforeReport: buildFixtureReport({ overridesByKey: beforeOverridesByKey }),
    afterReport: buildFixtureReport({
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
      const bytesReferenceReport = buildFixtureReport({
        overridesByKey: { [KEY]: withBytes({ netTotalBytes: 150000 }) },
      });
      const compareNetTotal = (netTotalBytes: number) =>
        comparePerfReports({
          beforeReport: buildFixtureReport(),
          afterReport: buildFixtureReport({
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
        beforeReport: buildFixtureReport(),
        afterReport: buildFixtureReport({ measuredAt: AFTER_MEASURED_AT }),
        bytesReferenceReport: buildFixtureReport({ omittedKeys: [KEY] }),
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
      beforeReport: buildFixtureReport(),
      afterReport: buildFixtureReport({
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
      beforeReport: buildFixtureReport({
        omittedKeys: ["mobile-light:/pricing"],
      }),
      afterReport: buildFixtureReport({ measuredAt: AFTER_MEASURED_AT }),
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
        buildFixtureReport({
          measuredAt: AFTER_MEASURED_AT,
          overridesByKey: {
            "mobile-light:/": { largestContentfulPaintMs: Number.NaN },
          },
        }),
      ),
    );
    const comparison = comparePerfReports({
      beforeReport: buildFixtureReport(),
      afterReport,
    });

    expect(findCheckStatus(comparison, "mobile-light:/", "LCP cap")).toBe(
      "fail",
    );
  });

  describe("reports with missing data", () => {
    const KEY = "mobile-light:/pricing";
    const FONT_BLOCKED_KEY = "mobile-light-fonts-blocked:/pricing";
    const DARK_KEY = "mobile-dark:/pricing";

    function findCheck(
      comparison: ReturnType<typeof comparePerfReports>,
      configurationKey: string,
      checkName: string,
    ) {
      return comparison.checks.find(
        (check) =>
          check.configurationKey === configurationKey &&
          check.checkName === checkName,
      );
    }

    /** A report with one field deleted from one configuration's result. */
    function buildReportWithout(
      configurationKey: string,
      field: "medians" | "byteMedians",
      measuredAt = BEFORE_MEASURED_AT,
    ) {
      const perfReport = buildFixtureReport({ measuredAt });
      const result = perfReport.results.find(
        (candidate) => candidate.key === configurationKey,
      );
      delete (result as unknown as Record<string, unknown>)[field];
      return perfReport;
    }

    it("should fail, not throw, when the after result has no medians", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport(),
        afterReport: buildReportWithout(KEY, "medians", AFTER_MEASURED_AT),
      });

      expect(findCheck(comparison, KEY, "LCP cap")).toEqual({
        configurationKey: KEY,
        checkName: "LCP cap",
        beforeValue: "1800 ms",
        afterValue: "missing",
        limit: "≤ 2000 ms",
        status: "fail",
      });
    });

    it("should fail relative checks, not throw, when the before result has no medians", () => {
      const comparison = comparePerfReports({
        beforeReport: buildReportWithout(KEY, "medians"),
        afterReport: buildFixtureReport({ measuredAt: AFTER_MEASURED_AT }),
      });

      expect(findCheck(comparison, KEY, "LCP vs before")).toEqual({
        configurationKey: KEY,
        checkName: "LCP vs before",
        beforeValue: "missing",
        afterValue: "1800 ms",
        limit: "missing before",
        status: "fail",
      });
      expect(findCheckStatus(comparison, KEY, "LCP cap")).toBe("pass");
    });

    it("should fail byte checks, not throw, when the after result has no byte medians", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport(),
        afterReport: buildReportWithout(KEY, "byteMedians", AFTER_MEASURED_AT),
      });

      expect(findCheck(comparison, KEY, "CSS bytes")).toEqual({
        configurationKey: KEY,
        checkName: "CSS bytes",
        beforeValue: "29.3 KiB",
        afterValue: "missing",
        limit: "≤ 35.0 KiB",
        status: "fail",
      });
    });

    it("should fail the first-party JS check, not throw, when the before result has no byte medians", () => {
      const comparison = comparePerfReports({
        beforeReport: buildReportWithout(KEY, "byteMedians"),
        afterReport: buildFixtureReport({ measuredAt: AFTER_MEASURED_AT }),
      });

      expect(findCheck(comparison, KEY, "First-party JS vs before")).toEqual({
        configurationKey: KEY,
        checkName: "First-party JS vs before",
        beforeValue: "missing",
        afterValue: "87.9 KiB",
        limit: "missing before",
        status: "fail",
      });
      expect(findCheckStatus(comparison, KEY, "CSS bytes")).toBe("pass");
    });

    it("should fail the net total, not throw, when the bytes-ref entry has no byte medians", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport(),
        afterReport: buildFixtureReport({ measuredAt: AFTER_MEASURED_AT }),
        bytesReferenceReport: buildReportWithout(KEY, "byteMedians"),
      });

      expect(findCheck(comparison, KEY, "Net bytes vs bytes-ref")).toEqual({
        configurationKey: KEY,
        checkName: "Net bytes vs bytes-ref",
        beforeValue: "156.3 KiB",
        afterValue: "156.3 KiB",
        limit: "missing before",
        status: "fail",
      });
    });

    it("should describe flags the before report never measured as missing", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport({
          omittedKeys: [FONT_BLOCKED_KEY, DARK_KEY],
        }),
        afterReport: buildFixtureReport({ measuredAt: AFTER_MEASURED_AT }),
      });

      expect(findCheck(comparison, FONT_BLOCKED_KEY, "Page renders")).toEqual({
        configurationKey: FONT_BLOCKED_KEY,
        checkName: "Page renders",
        beforeValue: "missing",
        afterValue: "yes",
        limit: "every pass paints",
        status: "pass",
      });
      expect(findCheck(comparison, DARK_KEY, "Dark render proven")).toEqual({
        configurationKey: DARK_KEY,
        checkName: "Dark render proven",
        beforeValue: "missing",
        afterValue: "yes",
        limit: "before and after dark",
        status: "fail",
      });
    });

    it("should describe a configuration measured before but not after", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport(),
        afterReport: buildFixtureReport({
          measuredAt: AFTER_MEASURED_AT,
          omittedKeys: [KEY],
        }),
      });

      expect(
        comparison.checks.filter((check) => check.configurationKey === KEY),
      ).toEqual([
        {
          configurationKey: KEY,
          checkName: "Measured",
          beforeValue: "yes",
          afterValue: "missing",
          limit: "in after report",
          status: "fail",
        },
      ]);
    });
  });

  describe("warnings", () => {
    // The shared fixture's font-blocked passes still load fonts, which is a
    // warning of its own; these start from passes where the block worked.
    const BLOCKED_FONT_BYTES = {
      bytes: {
        cssBytes: 30000,
        firstPartyJavaScriptBytes: 90000,
        fontBytes: 0,
        fontFileCount: 0,
        netTotalBytes: 120000,
      },
    };

    function buildCleanReport(
      options: Parameters<typeof buildFixtureReport>[0] = {},
    ) {
      return buildFixtureReport({
        ...options,
        overridesByKey: {
          "mobile-light-fonts-blocked:/": BLOCKED_FONT_BYTES,
          "mobile-light-fonts-blocked:/pricing": BLOCKED_FONT_BYTES,
          ...options.overridesByKey,
        },
      });
    }

    function compareClean(
      afterOverridesByKey: Record<string, Record<string, unknown>> = {},
    ) {
      return comparePerfReports({
        beforeReport: buildCleanReport(),
        afterReport: buildCleanReport({
          measuredAt: AFTER_MEASURED_AT,
          overridesByKey: afterOverridesByKey,
        }),
      });
    }

    it("should raise none for a clean, paired, five-pass comparison", () => {
      const comparison = compareClean();

      expect(comparison.warnings).toEqual([]);
      expect(comparison.markdown).not.toContain("### Warnings");
      expect(comparison.markdown.endsWith("| PASS |\n")).toBe(true);
    });

    it("should name the configurations a side under-sampled", () => {
      const beforeReport = buildCleanReport();
      beforeReport.results[0].runs = beforeReport.results[0].runs.slice(0, 4);
      beforeReport.results[2].runs = [];

      const comparison = comparePerfReports({
        beforeReport,
        afterReport: buildCleanReport({ measuredAt: AFTER_MEASURED_AT }),
      });

      expect(comparison.warnings).toEqual([
        "before has fewer than 5 passes for 2 configuration(s): mobile-light:/, mobile-light:/services/managed-it-services-ontario. Re-measure with the default --passes before relying on the verdict.",
      ]);
    });

    it("should not invent an LCP element warning for a result with no runs recorded", () => {
      const afterReport = buildCleanReport({ measuredAt: AFTER_MEASURED_AT });
      delete (afterReport.results[0] as unknown as Record<string, unknown>)
        .runs;

      const comparison = comparePerfReports({
        beforeReport: buildCleanReport(),
        afterReport,
      });

      expect(comparison.warnings).toEqual([
        "after has fewer than 5 passes for 1 configuration(s): mobile-light:/. Re-measure with the default --passes before relying on the verdict.",
      ]);
    });

    it("should say how much font data a font-blocked pass still loaded", () => {
      const comparison = compareClean({
        "mobile-light-fonts-blocked:/pricing": {
          bytes: {
            cssBytes: 30000,
            firstPartyJavaScriptBytes: 90000,
            fontBytes: 40960,
            fontFileCount: 2,
            netTotalBytes: 160000,
          },
        },
      });

      expect(comparison.warnings).toEqual([
        "mobile-light-fonts-blocked:/pricing still loaded 40.0 KiB of font files; the block patterns did not match them, so this pass did not test fallback fonts.",
      ]);
    });

    it("should not warn about a font-blocked pass that loaded no fonts but missed a paint", () => {
      const comparison = compareClean({
        "mobile-light-fonts-blocked:/pricing": {
          didRender: false,
          bytes: {
            cssBytes: 30000,
            firstPartyJavaScriptBytes: 90000,
            fontBytes: 0,
            fontFileCount: 0,
            netTotalBytes: 120000,
          },
        },
      });

      expect(comparison.warnings).toEqual([]);
    });

    it("should warn when a normal pass did not paint", () => {
      const comparison = compareClean({
        "desktop-light:/pricing": { didRender: false },
      });

      expect(comparison.warnings).toEqual([
        "desktop-light:/pricing had passes that did not paint; its medians use only the passes that did.",
      ]);
    });

    it("should warn when the two sides used different Lighthouse versions", () => {
      const comparison = comparePerfReports({
        beforeReport: { ...buildCleanReport(), lighthouseVersion: "13.4.0" },
        afterReport: buildCleanReport({ measuredAt: AFTER_MEASURED_AT }),
      });

      expect(comparison.warnings).toEqual([
        "Lighthouse versions differ: before 13.4.0, after 13.5.0.",
      ]);
      expect(comparison.exitCode).toBe(0);
    });

    it("should report the largest gap among the stale pairs, in hours", () => {
      const afterReport = buildCleanReport({ measuredAt: AFTER_MEASURED_AT });
      // Before was measured at 10:00 on the 5th.
      afterReport.results[0].measuredAt = "2026-10-06T16:00:00.000Z"; // 30 h
      afterReport.results[1].measuredAt = "2026-10-07T12:30:00.000Z"; // 50.5 h
      afterReport.results[2].measuredAt = "2026-10-06T22:00:00.000Z"; // 36 h

      const comparison = comparePerfReports({
        beforeReport: buildCleanReport(),
        afterReport,
      });

      expect(comparison.warnings).toEqual([
        "Before and after are more than 24 h apart (up to 50.5 h) for mobile-light:/, desktop-light:/, mobile-light:/services/managed-it-services-ontario. The gate assumes a paired run; staging drift can move the numbers, so consider re-measuring before.",
      ]);
    });

    it("should flag a stale pair measured in either order", () => {
      const comparison = comparePerfReports({
        beforeReport: buildCleanReport({
          measuredAt: "2026-10-07T10:00:00.000Z",
        }),
        afterReport: buildCleanReport({
          measuredAt: "2026-10-05T10:00:00.000Z",
        }),
      });

      expect(comparison.warnings[0]).toContain("(up to 48.0 h)");
    });

    it.each([
      ["an H1 nested in another element", '<div class="hero"><h1>'],
      ["a tag that only starts like an H1", "<h1x>"],
    ])("should not accept %s as the H1", (_label, snippet) => {
      const comparison = compareClean({
        "mobile-light:/": { lcpElement: { selector: "div.hero", snippet } },
      });

      expect(comparison.warnings).toEqual([
        "mobile-light:/ LCP element is not the H1 in 5/5 runs: div.hero",
      ]);
    });

    it.each(['<h1 class="display-4">', "<H1>", "<h1\nclass='x'>"])(
      "should accept %p as the H1",
      (snippet) => {
        const comparison = compareClean({
          "mobile-light:/": { lcpElement: { selector: "main > h1", snippet } },
        });

        expect(comparison.warnings).toEqual([]);
      },
    );

    it("should say when no LCP element was recorded at all", () => {
      const comparison = compareClean({
        "desktop-light:/": { lcpElement: undefined },
      });

      expect(comparison.warnings).toEqual([
        "desktop-light:/ LCP element is not the H1 in 5/5 runs: none recorded",
      ]);
    });

    it("should not expect an H1 on a font-blocked pass", () => {
      const comparison = compareClean({
        "mobile-light-fonts-blocked:/": {
          lcpElement: { selector: "div", snippet: "<div>" },
          bytes: {
            cssBytes: 30000,
            firstPartyJavaScriptBytes: 90000,
            fontBytes: 0,
            fontFileCount: 0,
            netTotalBytes: 120000,
          },
        },
      });

      expect(comparison.warnings).toEqual([]);
    });
  });

  describe("staleness warning", () => {
    it("should not warn when before and after are exactly 24 h apart", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport({
          measuredAt: "2026-10-04T10:00:00.000Z",
        }),
        afterReport: buildFixtureReport({
          measuredAt: "2026-10-05T10:00:00.000Z",
        }),
      });

      expect(comparison.warnings.join("\n")).not.toMatch(/24 h/);
    });

    it("should warn, without failing, when before and after are more than 24 h apart", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport({
          measuredAt: "2026-10-04T10:00:00.000Z",
        }),
        afterReport: buildFixtureReport({
          measuredAt: "2026-10-05T10:01:00.000Z",
        }),
      });

      expect(comparison.warnings.join("\n")).toMatch(/more than 24 h apart/);
      expect(comparison.markdown).toMatch(/more than 24 h apart/);
      expect(comparison.exitCode).toBe(0);
    });
  });

  describe("pass count warning", () => {
    it("should not warn when every compared configuration has 5 passes", () => {
      expect(compareWithAfter({}).warnings.join("\n")).not.toMatch(/passes/);
    });

    it("should warn when a side was measured with fewer than 5 passes", () => {
      const comparison = comparePerfReports({
        beforeReport: buildFixtureReport({ passesPerConfiguration: 1 }),
        afterReport: buildFixtureReport({ measuredAt: AFTER_MEASURED_AT }),
      });

      expect(comparison.warnings.join("\n")).toMatch(
        /before has fewer than 5 passes for 12 configuration/,
      );
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

    it("should render the whole report: verdict, table, warnings and the rerun command", () => {
      const comparison = comparePerfReports({
        beforeReport: {
          ...buildFixtureReport(),
          lighthouseVersion: "13.4.0",
          commitSha: "0123456789abcdef",
        },
        afterReport: buildFixtureReport({
          measuredAt: AFTER_MEASURED_AT,
          overridesByKey: {
            "mobile-light:/pricing": { largestContentfulPaintMs: 2050 },
            "desktop-light:/": { performanceScore: 97 },
          },
          omittedKeys: ["mobile-dark:/"],
        }),
        bytesReferenceReport: buildFixtureReport(),
        afterReportPath: "perf/after.json",
      });

      expect(comparison.markdown).toMatchSnapshot();
    });

    it("should leave the rerun section out when nothing failed", () => {
      expect(compareWithAfter({}).markdown).not.toContain(
        "### Rerun failing configurations",
      );
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

  it.each(["ftp://staging.boximity.ca", "file:///tmp/site", "staging"])(
    "should reject the base URL %p, quoting it",
    (baseUrl) => {
      expect(() =>
        parsePerfGateArguments([
          "measure",
          "--base-url",
          baseUrl,
          "--out",
          "a.json",
        ]),
      ).toThrow(
        `--base-url must be an absolute http(s) URL, got "${baseUrl}".`,
      );
    },
  );

  it.each([
    ["http://localhost:3000///", "http://localhost:3000"],
    ["https://staging.boximity.ca/", "https://staging.boximity.ca"],
    ["https://staging.boximity.ca/app/", "https://staging.boximity.ca/app"],
  ])("should trim trailing slashes from %p", (baseUrlText, baseUrl) => {
    expect(
      parsePerfGateArguments([
        "measure",
        "--base-url",
        baseUrlText,
        "--out",
        "a.json",
      ]),
    ).toMatchObject({ baseUrl });
  });

  it.each(["0", "-1", "1.5", "five", ""])(
    "should reject the pass count %p, quoting it",
    (passes) => {
      expect(() =>
        parsePerfGateArguments([
          "measure",
          "--base-url",
          "http://localhost:3000",
          "--out",
          "a.json",
          `--passes=${passes}`,
        ]),
      ).toThrow(`--passes must be a positive integer, got "${passes}".`);
    },
  );

  it("should accept a single pass", () => {
    expect(
      parsePerfGateArguments([
        "measure",
        "--base-url",
        "http://localhost:3000",
        "--out",
        "a.json",
        "--passes",
        "1",
      ]),
    ).toMatchObject({ passesPerConfiguration: 1 });
  });

  it("should carry the commit and Chrome path only when given", () => {
    const base = [
      "measure",
      "--base-url",
      "http://localhost:3000",
      "--out",
      "a.json",
    ];

    expect(
      parsePerfGateArguments([
        ...base,
        "--commit",
        "abc1234",
        "--chrome-path",
        "/usr/bin/chromium",
      ]),
    ).toMatchObject({ commitSha: "abc1234", chromePath: "/usr/bin/chromium" });
    const bare = parsePerfGateArguments(base);
    expect(bare).not.toHaveProperty("commitSha");
    expect(bare).not.toHaveProperty("chromePath");
  });

  it.each([
    [["measure", "--out", "a.json"], "Missing required --base-url."],
    [
      ["measure", "--base-url", "http://localhost:3000"],
      "Missing required --out.",
    ],
    [["compare", "--after", "after.json"], "Missing required --before."],
    [["compare", "--before", "before.json"], "Missing required --after."],
  ])(
    "should name the missing option for %p, with usage",
    (commandLine, message) => {
      expect(() => parsePerfGateArguments(commandLine)).toThrow(
        `${message}\n\n${PERF_GATE_USAGE}`,
      );
    },
  );

  it.each([
    [["benchmark"], 'Unknown command "benchmark".'],
    [[], 'Unknown command "".'],
  ])(
    "should name the unknown command in %p, with usage",
    (commandLine, message) => {
      expect(() => parsePerfGateArguments(commandLine)).toThrow(
        `${message}\n\n${PERF_GATE_USAGE}`,
      );
    },
  );

  it("should document both commands and every configuration key", () => {
    expect(PERF_GATE_USAGE).toMatchSnapshot();
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
    const perfReport = buildPerfReport({
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

  it("should keep results in matrix order however they were measured", () => {
    const perfReport = buildPerfReport({
      ...metadata,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [
        resultFor("mobile-light-fonts-blocked:/", BEFORE_MEASURED_AT),
        resultFor("mobile-dark:/pricing", BEFORE_MEASURED_AT),
        resultFor("desktop-light:/pricing", BEFORE_MEASURED_AT),
        resultFor("mobile-light:/", BEFORE_MEASURED_AT),
      ],
    });

    expect(perfReport.results.map((result) => result.key)).toEqual([
      "mobile-light:/",
      "desktop-light:/pricing",
      "mobile-dark:/pricing",
      "mobile-light-fonts-blocked:/",
    ]);
  });

  it("should leave the commit off a report measured without one", () => {
    const perfReport = buildPerfReport({
      ...metadata,
      commitSha: undefined,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [],
    });

    expect(perfReport).not.toHaveProperty("commitSha");
  });

  it("should name both base URLs when refusing to merge a rerun", () => {
    const previousReport = buildPerfReport({
      ...metadata,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [],
    });

    expect(() =>
      buildPerfReport({
        ...metadata,
        baseUrl: "http://localhost:3000",
        measuredAt: AFTER_MEASURED_AT,
        previousReport,
        freshResults: [],
      }),
    ).toThrow(
      "Refusing to merge a rerun against base URL http://localhost:3000 into a report measured against https://staging.boximity.ca. Use a different --out file.",
    );
  });

  it("should replace only the rerun configurations when merging into a previous report", () => {
    const previousReport = buildPerfReport({
      ...metadata,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [
        resultFor("mobile-light:/", BEFORE_MEASURED_AT, 80),
        resultFor("mobile-light:/pricing", BEFORE_MEASURED_AT, 80),
      ],
    });

    const mergedReport = buildPerfReport({
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
    const previousReport = buildPerfReport({
      ...metadata,
      measuredAt: BEFORE_MEASURED_AT,
      freshResults: [],
    });

    expect(() =>
      buildPerfReport({
        ...metadata,
        baseUrl: "http://localhost:3000",
        measuredAt: AFTER_MEASURED_AT,
        previousReport,
        freshResults: [],
      }),
    ).toThrow(/base URL/);
  });
});
