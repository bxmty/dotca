import {
  initWebVitals,
  reportWebVitals,
  type WebVitalsMetric,
} from "@/lib/web-vitals";

// Mock the dependencies
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
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const mockGaEvent = gaEvent as jest.MockedFunction<typeof gaEvent>;
const mockOnCLS = onCLS as jest.MockedFunction<typeof onCLS>;
const mockOnFCP = onFCP as jest.MockedFunction<typeof onFCP>;
const mockOnINP = onINP as jest.MockedFunction<typeof onINP>;
const mockOnLCP = onLCP as jest.MockedFunction<typeof onLCP>;
const mockOnTTFB = onTTFB as jest.MockedFunction<typeof onTTFB>;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("web-vitals.ts web performance tracking", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    // Setup default environment
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("web vitals reporting through observers", () => {
    let reportCallback: (metric: WebVitalsMetric) => void;

    beforeEach(() => {
      // Capture the callback that gets passed to the observers
      mockOnCLS.mockImplementation((callback) => {
        reportCallback = callback;
      });
      mockOnFCP.mockImplementation((callback) => {
        reportCallback = callback;
      });
      mockOnINP.mockImplementation((callback) => {
        reportCallback = callback;
      });
      mockOnLCP.mockImplementation((callback) => {
        reportCallback = callback;
      });
      mockOnTTFB.mockImplementation((callback) => {
        reportCallback = callback;
      });
    });

    it("reports CLS metric correctly through observer", async () => {
      initWebVitals();

      const clsMetric: WebVitalsMetric = {
        name: "CLS",
        value: 0.1,
        id: "cls-id",
        delta: 0.05,
        rating: "good",
        navigationType: "navigate",
      };

      await reportCallback(clsMetric);

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "web_vitals",
        category: "Web Vitals",
        label: "cls-id",
        value: 50, // CLS delta * 1000 = 0.05 * 1000 = 50
      });
    });

    it("reports FCP metric correctly through observer", async () => {
      initWebVitals();

      const fcpMetric: WebVitalsMetric = {
        name: "FCP",
        value: 1200,
        id: "fcp-id",
        delta: 1200,
        rating: "good",
        navigationType: "navigate",
      };

      await reportCallback(fcpMetric);

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "web_vitals",
        category: "Web Vitals",
        label: "fcp-id",
        value: 1200,
      });
    });

    it("reports all metrics to API endpoint", async () => {
      initWebVitals();

      const metric: WebVitalsMetric = {
        name: "LCP",
        value: 2500,
        id: "lcp-id",
        delta: 2500,
        rating: "needs-improvement",
        navigationType: "navigate",
      };

      await reportCallback(metric);

      expect(mockFetch).toHaveBeenCalledWith("/api/analytics/web-vitals", {
        body: JSON.stringify({
          name: "LCP",
          id: "lcp-id",
          value: 2500,
          rating: "needs-improvement",
          delta: 2500,
          navigationType: "navigate",
        }),
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("handles API errors gracefully", async () => {
      initWebVitals();
      mockFetch.mockRejectedValueOnce(new Error("API error"));

      // Set to development mode so error gets logged
      process.env.NODE_ENV = "development";

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const metric: WebVitalsMetric = {
        name: "FCP",
        value: 1200,
        id: "fcp-id",
        delta: 1200,
        rating: "good",
        navigationType: "navigate",
      };

      // Should not throw despite API error
      await expect(reportCallback(metric)).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error reporting web vitals:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("does not send GA events when GA_MEASUREMENT_ID is not available", async () => {
      // Temporarily modify the gtag mock to not have GA_MEASUREMENT_ID
      const originalGA = jest.requireActual("@/lib/gtag");
      jest.doMock("@/lib/gtag", () => ({
        ...originalGA,
        GA_MEASUREMENT_ID: undefined,
        event: mockGaEvent,
      }));

      // Force re-import of the web-vitals module to use the new mock
      jest.resetModules();
      const { initWebVitals: newInitWebVitals } = require("@/lib/web-vitals");

      // Set up the mock to capture the callback after resetModules
      let capturedCallback: (metric: WebVitalsMetric) => void;
      const { onFCP: newOnFCP } = require("web-vitals");
      newOnFCP.mockImplementation((callback) => {
        capturedCallback = callback;
      });

      newInitWebVitals();

      const metric: WebVitalsMetric = {
        name: "FCP",
        value: 1200,
        id: "fcp-id",
        delta: 1200,
        rating: "good",
        navigationType: "navigate",
      };

      await capturedCallback(metric);

      expect(mockGaEvent).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled(); // API call should still happen
    });
  });

  describe("initWebVitals", () => {
    it("initializes all web vitals observers", () => {
      initWebVitals();

      expect(mockOnCLS).toHaveBeenCalledWith(reportWebVitals);
      expect(mockOnFCP).toHaveBeenCalledWith(reportWebVitals);
      expect(mockOnINP).toHaveBeenCalledWith(reportWebVitals);
      expect(mockOnLCP).toHaveBeenCalledWith(reportWebVitals);
      expect(mockOnTTFB).toHaveBeenCalledWith(reportWebVitals);
    });

    it("calls each observer exactly once", () => {
      initWebVitals();

      expect(mockOnCLS).toHaveBeenCalledTimes(1);
      expect(mockOnFCP).toHaveBeenCalledTimes(1);
      expect(mockOnINP).toHaveBeenCalledTimes(1);
      expect(mockOnLCP).toHaveBeenCalledTimes(1);
      expect(mockOnTTFB).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling and edge cases", () => {
    it("handles malformed metrics gracefully through observer", async () => {
      // Set up the observer callback
      let reportCallback: (metric: WebVitalsMetric) => void;
      mockOnFCP.mockImplementation((callback) => {
        reportCallback = callback;
      });
      initWebVitals();

      const malformedMetric = {
        name: "UNKNOWN",
        value: "invalid",
        id: "test-id",
        delta: "invalid",
      } as Partial<WebVitalsMetric>;

      // Should not throw despite malformed data
      await expect(reportCallback(malformedMetric)).resolves.not.toThrow();

      // Should still attempt to send to API
      expect(mockFetch).toHaveBeenCalledWith("/api/analytics/web-vitals", {
        body: JSON.stringify({
          name: "UNKNOWN",
          id: "test-id",
          value: "invalid",
          rating: undefined,
          delta: "invalid",
          navigationType: undefined,
        }),
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("handles missing metric properties through observer", async () => {
      // Set up the observer callback
      let reportCallback: (metric: WebVitalsMetric) => void;
      mockOnFCP.mockImplementation((callback) => {
        reportCallback = callback;
      });
      initWebVitals();

      const incompleteMetric = {
        name: "FCP",
        // missing value, id, delta, etc.
      } as Partial<WebVitalsMetric>;

      await reportCallback(incompleteMetric);

      expect(mockFetch).toHaveBeenCalledWith("/api/analytics/web-vitals", {
        body: JSON.stringify({
          name: "FCP",
          id: undefined,
          value: undefined,
          rating: undefined,
          delta: undefined,
          navigationType: undefined,
        }),
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("works when window is undefined (SSR) through observer", async () => {
      // Set up the observer callback
      let reportCallback: (metric: WebVitalsMetric) => void;
      mockOnFCP.mockImplementation((callback) => {
        reportCallback = callback;
      });
      initWebVitals();

      const originalWindow = global.window;
      delete (global as NodeJS.Global & { window?: typeof global.window })
        .window;

      const metric: WebVitalsMetric = {
        name: "FCP",
        value: 1200,
        id: "fcp-id",
        delta: 1200,
        rating: "good",
        navigationType: "navigate",
      };

      // Should not throw and should still send to API
      await expect(reportCallback(metric)).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalled();

      // Restore window
      global.window = originalWindow;
    });
  });
});
