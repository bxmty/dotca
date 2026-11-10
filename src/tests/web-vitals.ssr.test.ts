/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import { initWebVitals, type WebVitalsMetric } from "@/lib/web-vitals";

jest.mock("@/lib/gtag", () => ({
  GA_MEASUREMENT_ID: "GA-TEST-ID",
  event: jest.fn(),
}));

jest.mock("web-vitals", () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

import { event as gaEvent } from "@/lib/gtag";
import { onFCP } from "web-vitals";

const mockOnFCP = onFCP as jest.MockedFunction<typeof onFCP>;
const mockFetch = jest.fn();

describe("web-vitals.ts without a window (SSR)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  it("still sends to the API and skips GA through the observer", async () => {
    let reportCallback: (metric: WebVitalsMetric) => void = () => {};
    mockOnFCP.mockImplementation((callback) => {
      reportCallback = callback;
    });
    initWebVitals();

    expect(typeof window).toBe("undefined");

    const metric: WebVitalsMetric = {
      name: "FCP",
      value: 1200,
      id: "fcp-id",
      delta: 1200,
      rating: "good",
      navigationType: "navigate",
    };

    await expect(reportCallback(metric)).resolves.not.toThrow();

    expect(mockFetch).toHaveBeenCalled();
    expect(gaEvent).not.toHaveBeenCalled();
  });
});
