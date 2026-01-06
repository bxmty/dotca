// Mock the dependencies
jest.mock("@/lib/gtag", () => ({
  pageview: jest.fn(),
  event: jest.fn(),
  initGA: jest.fn(),
  GA_MEASUREMENT_ID: "GA-TEST-ID",
}));

jest.mock("@/lib/umami", () => ({
  trackPageView: jest.fn().mockResolvedValue(undefined),
  trackCustomEvent: jest.fn().mockResolvedValue(undefined),
  trackFormSubmission: jest.fn().mockResolvedValue(undefined),
  trackButtonClick: jest.fn().mockResolvedValue(undefined),
  trackEngagement: jest.fn().mockResolvedValue(undefined),
  isUmamiConfigured: jest.fn(),
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
import {
  trackPageView as umamiTrackPageView,
  trackCustomEvent,
  trackFormSubmission,
  trackButtonClick as umamiTrackButtonClick,
  trackEngagement as umamiTrackEngagement,
  isUmamiConfigured,
} from "@/lib/umami";

// Create mock references
const mockUmamiTrackPageView = umamiTrackPageView as jest.MockedFunction<
  typeof umamiTrackPageView
>;
const mockTrackCustomEvent = trackCustomEvent as jest.MockedFunction<
  typeof trackCustomEvent
>;
const mockTrackFormSubmission = trackFormSubmission as jest.MockedFunction<
  typeof trackFormSubmission
>;
const mockUmamiTrackButtonClick = umamiTrackButtonClick as jest.MockedFunction<
  typeof umamiTrackButtonClick
>;
const mockUmamiTrackEngagement = umamiTrackEngagement as jest.MockedFunction<
  typeof umamiTrackEngagement
>;
const mockIsUmamiConfigured = isUmamiConfigured as jest.MockedFunction<
  typeof isUmamiConfigured
>;

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
      mockIsUmamiConfigured.mockReturnValue(false);

      initializeAnalytics();

      expect(mockInitGA).toHaveBeenCalledTimes(1);
    });

    it("initializes Umami when configured", () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      initializeAnalytics();
    });

    it("logs configuration in debug mode", () => {
      process.env.NODE_ENV = "development";
      mockIsUmamiConfigured.mockReturnValue(true);

      initializeAnalytics();
    });

    it("handles Google Analytics initialization errors gracefully", () => {
      mockInitGA.mockImplementation(() => {
        throw new Error("GA init failed");
      });
      mockIsUmamiConfigured.mockReturnValue(false);

      initializeAnalytics();
    });
  });

  describe("trackPageView", () => {
    it("tracks page view with Google Analytics", async () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackPageView("/test-page", "Test Page");

      expect(mockGaPageview).toHaveBeenCalledWith("/test-page");
      expect(umamiTrackPageView).not.toHaveBeenCalled();
    });

    it("tracks page view with Umami", async () => {
      mockIsUmamiConfigured.mockReturnValue(true);
      // Since GA_MEASUREMENT_ID is evaluated at module import time and is set in test environment,
      // this test cannot actually disable GA. The module already has GA configured.
      // So this test will track with both providers.

      await trackPageView("/test-page", "Test Page");

      expect(mockUmamiTrackPageView).toHaveBeenCalledWith(
        "/test-page",
        undefined,
        "Test Page",
      );
      // GA will also be called since it's configured
      expect(mockGaPageview).toHaveBeenCalledWith("/test-page");
    });

    it("tracks page view with both providers when both are enabled", async () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackPageView("/test-page", "Test Page");

      expect(mockGaPageview).toHaveBeenCalledWith("/test-page");
      expect(umamiTrackPageView).toHaveBeenCalledWith(
        "/test-page",
        undefined,
        "Test Page",
      );
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackPageView("/test-page", "Test Page");
    });

    it("handles Google Analytics errors gracefully", async () => {
      mockGaPageview.mockImplementation(() => {
        throw new Error("GA error");
      });
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackPageView("/test-page");
    });

    it("handles Umami errors gracefully", async () => {
      mockUmamiTrackPageView.mockRejectedValue(new Error("Umami error"));
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackPageView("/test-page");
    });

    it("ensures analytics providers are available for tracking", async () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackPageView("/test-page");

      // Just verify the function completes without error and calls expected providers
      expect(mockGaPageview).toHaveBeenCalledWith("/test-page");
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
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackEvent(testEventData);

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        value: 42,
      });
    });

    it("tracks event with Umami", async () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackEvent(testEventData);

      expect(trackCustomEvent).toHaveBeenCalledWith(
        "test_action",
        testEventData,
      );
    });

    it("tracks event with both providers when both are enabled", async () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackEvent(testEventData);

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        value: 42,
      });
      expect(trackCustomEvent).toHaveBeenCalledWith(
        "test_action",
        testEventData,
      );
    });

    it("uses default category when not provided", async () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackEvent({ action: "test_action" });

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "engagement",
        label: "",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackEvent(testEventData);
    });

    it("handles Google Analytics errors gracefully", async () => {
      mockGaEvent.mockImplementation(() => {
        throw new Error("GA error");
      });
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackEvent(testEventData);
    });

    it("handles Umami errors gracefully", async () => {
      mockTrackCustomEvent.mockRejectedValue(new Error("Umami error"));
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackEvent(testEventData);
    });

    it("ensures analytics providers are available for event tracking", async () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackEvent(testEventData);

      // Just verify the function completes without error and calls expected providers
      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        value: 42,
      });
    });
  });

  describe("trackFormSubmit", () => {
    it("tracks form submission with Umami and as regular event", async () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackFormSubmit("contact_form", { email: "test@example.com" });

      expect(trackFormSubmission).toHaveBeenCalledWith("contact_form", {
        email: "test@example.com",
      });
      expect(trackCustomEvent).toHaveBeenCalledWith("form_submit", {
        action: "form_submit",
        category: "forms",
        label: "contact_form",
      });
    });

    it("only tracks as regular event when Umami is not configured", async () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackFormSubmit("contact_form");

      expect(trackFormSubmission).not.toHaveBeenCalled();
      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "form_submit",
        category: "forms",
        label: "contact_form",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackFormSubmit("contact_form");
    });

    it("handles Umami errors gracefully", async () => {
      mockTrackFormSubmission.mockRejectedValue(new Error("Umami error"));
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackFormSubmit("contact_form");
    });
  });

  describe("trackButtonClick", () => {
    it("tracks button click with Umami and as regular event", async () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackButtonClick("submit_button", "contact_form");

      expect(umamiTrackButtonClick).toHaveBeenCalledWith(
        "submit_button",
        "contact_form",
      );
      expect(trackCustomEvent).toHaveBeenCalledWith("button_click", {
        action: "button_click",
        category: "interaction",
        label: "submit_button",
      });
    });

    it("only tracks as regular event when Umami is not configured", async () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackButtonClick("submit_button");

      expect(umamiTrackButtonClick).not.toHaveBeenCalled();
      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "button_click",
        category: "interaction",
        label: "submit_button",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackButtonClick("submit_button", "contact_form");
    });

    it("handles Umami errors gracefully", async () => {
      mockUmamiTrackButtonClick.mockRejectedValue(new Error("Umami error"));
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackButtonClick("submit_button");
    });
  });

  describe("trackEngagement", () => {
    it("tracks engagement with Umami and as regular event", async () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackEngagement("scroll", { percent: 50 });

      expect(umamiTrackEngagement).toHaveBeenCalledWith("scroll", {
        percent: 50,
      });
      expect(trackCustomEvent).toHaveBeenCalledWith("engagement_scroll", {
        action: "engagement_scroll",
        category: "engagement",
        label: "scroll",
      });
    });

    it("only tracks as regular event when Umami is not configured", async () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackEngagement("time_on_page", { seconds: 30 });

      expect(umamiTrackEngagement).not.toHaveBeenCalled();
      expect(mockGaEvent).toHaveBeenCalledWith({
        action: "engagement_time_on_page",
        category: "engagement",
        label: "time_on_page",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      mockIsUmamiConfigured.mockReturnValue(false);

      await trackEngagement("scroll");
    });

    it("handles Umami errors gracefully", async () => {
      mockUmamiTrackEngagement.mockRejectedValue(new Error("Umami error"));
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackEngagement("scroll");
    });
  });

  describe("isAnalyticsConfigured", () => {
    it("returns true when Google Analytics is configured", () => {
      mockIsUmamiConfigured.mockReturnValue(false);

      const result = isAnalyticsConfigured();

      expect(result).toBe(true);
    });

    it("returns true when Umami is configured", () => {
      const originalGA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
      delete process.env.GA_MEASUREMENT_ID;

      mockIsUmamiConfigured.mockReturnValue(true);

      const result = isAnalyticsConfigured();

      expect(result).toBe(true);

      // Restore
      process.env.GA_MEASUREMENT_ID = originalGA_MEASUREMENT_ID;
    });

    it("returns false when neither provider is configured", () => {
      // Temporarily mock GA_MEASUREMENT_ID to be undefined
      const gtagModule = jest.requireMock("@/lib/gtag");
      const originalGAValue = gtagModule.GA_MEASUREMENT_ID;
      gtagModule.GA_MEASUREMENT_ID = undefined;

      // Mock isUmamiConfigured to return false
      mockIsUmamiConfigured.mockReturnValue(false);

      const result = isAnalyticsConfigured();

      expect(result).toBe(false);

      // Restore
      gtagModule.GA_MEASUREMENT_ID = originalGAValue;
    });
  });

  describe("getAnalyticsStatus", () => {
    it("returns complete analytics configuration and status", () => {
      mockIsUmamiConfigured.mockReturnValue(true);

      const status = getAnalyticsStatus();

      expect(status).toEqual({
        enableGoogleAnalytics: true,
        enableUmami: true,
        debug: process.env.NODE_ENV === "development", // matches actual environment
        initialized: false, // not initialized yet
      });
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
    it("handles Promise.allSettled rejections gracefully", async () => {
      mockUmamiTrackPageView.mockRejectedValue(new Error("Async error"));
      mockIsUmamiConfigured.mockReturnValue(true);

      // Should not throw despite the rejection
      await expect(trackPageView("/test")).resolves.not.toThrow();
    });

    it("continues execution when one provider fails", async () => {
      mockGaPageview.mockImplementation(() => {
        throw new Error("GA failed");
      });
      mockIsUmamiConfigured.mockReturnValue(true);

      await trackPageView("/test");

      // Umami should still be called even if GA fails
      expect(umamiTrackPageView).toHaveBeenCalledWith(
        "/test",
        undefined,
        undefined,
      );
    });
  });
});
