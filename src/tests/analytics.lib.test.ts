// Mock the dependencies
jest.mock("@/lib/gtag", () => ({
  pageview: jest.fn(),
  event: jest.fn(),
  initGA: jest.fn(),
  GA_MEASUREMENT_ID: "GA-TEST-ID",
}));

import {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  trackFormSubmit,
  trackButtonClick,
  trackEngagement,
  isAnalyticsConfigured,
  getAnalyticsStatus,
  analytics,
  __resetAnalyticsState,
  type UnifiedEventData,
} from "@/lib/analytics";

import { pageview as gaPageview, event as gaEvent, initGA } from "@/lib/gtag";

// Create mock references for gtag functions
const mockGaPageview = gaPageview as jest.MockedFunction<typeof gaPageview>;
const mockGaEvent = gaEvent as jest.MockedFunction<typeof gaEvent>;
const mockInitGA = initGA as jest.MockedFunction<typeof initGA>;

// Note: Console methods are already mocked globally in jest.setup.js

describe("analytics.ts unified analytics interface", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Reset analytics global state
    __resetAnalyticsState();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("initializeAnalytics", () => {
    it("initializes Google Analytics when GA_MEASUREMENT_ID is available", () => {
      initializeAnalytics();

      expect(mockInitGA).toHaveBeenCalledTimes(1);
    });

    it("handles Google Analytics initialization errors gracefully", () => {
      mockInitGA.mockImplementation(() => {
        throw new Error("GA init failed");
      });

      initializeAnalytics();
    });
  });

  describe("trackPageView", () => {
    it("tracks page view with Google Analytics", async () => {
      await trackPageView("/test-page");

      expect(mockGaPageview).toHaveBeenCalledWith("/test-page");
    });

    it("handles Google Analytics errors gracefully", async () => {
      mockGaPageview.mockImplementation(() => {
        throw new Error("GA error");
      });

      await expect(trackPageView("/test-page")).resolves.not.toThrow();
    });
  });

  describe("trackEvent", () => {
    const testEventData: UnifiedEventData = {
      action: "test_action",
      category: "test_category",
      label: "test_label",
      value: 42,
      customProp: "custom_value",
    };

    it("tracks event with Google Analytics", async () => {
      await trackEvent(testEventData);

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        value: 42,
      });
    });

    it("uses default category when not provided", async () => {
      await trackEvent({ action: "test_action" });

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "engagement",
        label: "",
        value: undefined,
      });
    });

    it("handles Google Analytics errors gracefully", async () => {
      mockGaEvent.mockImplementation(() => {
        throw new Error("GA error");
      });

      await expect(trackEvent(testEventData)).resolves.not.toThrow();
    });
  });

  describe("trackFormSubmit", () => {
    it("tracks form submission as a GA event", async () => {
      await trackFormSubmit("contact_form");

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "form_submit",
        category: "forms",
        label: "contact_form",
        value: undefined,
      });
    });
  });

  describe("trackButtonClick", () => {
    it("tracks button click as a GA event", async () => {
      await trackButtonClick("submit_button");

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "button_click",
        category: "interaction",
        label: "submit_button",
        value: undefined,
      });
    });
  });

  describe("trackEngagement", () => {
    it("tracks engagement as a GA event", async () => {
      await trackEngagement("time_on_page");

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "engagement_time_on_page",
        category: "engagement",
        label: "time_on_page",
        value: undefined,
      });
    });
  });

  describe("isAnalyticsConfigured", () => {
    it("returns true when Google Analytics is configured", () => {
      const result = isAnalyticsConfigured();

      expect(result).toBe(true);
    });

    it("returns false when Google Analytics is not configured", () => {
      // Temporarily mock GA_MEASUREMENT_ID to be undefined
      const gtagModule = jest.requireMock("@/lib/gtag");
      const originalGAValue = gtagModule.GA_MEASUREMENT_ID;
      gtagModule.GA_MEASUREMENT_ID = undefined;

      const result = isAnalyticsConfigured();

      expect(result).toBe(false);

      // Restore
      gtagModule.GA_MEASUREMENT_ID = originalGAValue;
    });
  });

  describe("getAnalyticsStatus", () => {
    it("returns complete analytics configuration and status", () => {
      const status = getAnalyticsStatus();

      expect(status).toEqual({
        isGoogleAnalyticsEnabled: true,
        isInitialized: false, // not initialized yet
      });

      initializeAnalytics();

      expect(getAnalyticsStatus()).toEqual({
        isGoogleAnalyticsEnabled: true,
        isInitialized: true,
      });
    });
  });

  describe("lazy initialisation", () => {
    it("initialises Google Analytics once, on the first page view", async () => {
      await trackPageView("/first");
      await trackPageView("/second");
      await trackEvent({ action: "later" });

      expect(mockInitGA).toHaveBeenCalledTimes(1);
      expect(mockGaPageview).toHaveBeenCalledTimes(2);
    });

    it("initialises Google Analytics once, on the first event", async () => {
      await trackEvent({ action: "first" });
      await trackEvent({ action: "second" });
      await trackPageView("/later");

      expect(mockInitGA).toHaveBeenCalledTimes(1);
      expect(mockGaEvent).toHaveBeenCalledTimes(2);
    });

    it("does not initialise again after an explicit init", async () => {
      initializeAnalytics();
      await trackPageView("/page");
      await trackEvent({ action: "click" });

      expect(mockInitGA).toHaveBeenCalledTimes(1);
    });

    it("counts a failed init as done instead of retrying on every call", async () => {
      mockInitGA.mockImplementationOnce(() => {
        throw new Error("GA init failed");
      });

      await trackPageView("/first");
      await trackPageView("/second");

      expect(mockInitGA).toHaveBeenCalledTimes(1);
    });
  });

  describe("without a measurement ID", () => {
    const gtagModule = jest.requireMock("@/lib/gtag");

    beforeEach(() => {
      gtagModule.GA_MEASUREMENT_ID = undefined;
    });

    afterEach(() => {
      gtagModule.GA_MEASUREMENT_ID = "GA-TEST-ID";
    });

    it("sends nothing to Google Analytics", async () => {
      initializeAnalytics();
      await trackPageView("/page");
      await trackEvent({ action: "click" });
      await trackFormSubmit("contact_form");
      await trackButtonClick("submit_button");
      await trackEngagement("scroll");

      expect(mockInitGA).not.toHaveBeenCalled();
      expect(mockGaPageview).not.toHaveBeenCalled();
      expect(mockGaEvent).not.toHaveBeenCalled();
    });
  });

  describe("analytics convenience object", () => {
    it("exports all functions through the convenience object", () => {
      expect(analytics.init).toBe(initializeAnalytics);
      expect(analytics.pageview).toBe(trackPageView);
      expect(analytics.event).toBe(trackEvent);
      expect(analytics.formSubmit).toBe(trackFormSubmit);
      expect(analytics.buttonClick).toBe(trackButtonClick);
      expect(analytics.engagement).toBe(trackEngagement);
      expect(analytics.isConfigured).toBe(isAnalyticsConfigured);
      expect(analytics.getStatus).toBe(getAnalyticsStatus);
    });
  });

  describe("error handling", () => {
    it("continues execution when GA fails", async () => {
      mockGaPageview.mockImplementation(() => {
        throw new Error("GA failed");
      });

      await expect(trackPageView("/test")).resolves.not.toThrow();
    });
  });
});
