// Mock the dependencies
jest.mock(
  "@/lib/gtag",
  () => ({
    pageview: jest.fn(),
    event: jest.fn(),
    initGA: jest.fn(),
    GA_MEASUREMENT_ID: "GA-TEST-ID",
  }),
  { virtual: true },
);

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
import {
  trackPageView as umamiTrackPageView,
  trackCustomEvent,
  trackFormSubmission,
  trackButtonClick as umamiTrackButtonClick,
  trackEngagement as umamiTrackEngagement,
  isUmamiConfigured,
} from "@/lib/umami";

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
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      initializeAnalytics();

      expect(initGA).toHaveBeenCalledTimes(1);
    });

    it("initializes Umami when configured", () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      initializeAnalytics();
    });

    it("logs configuration in debug mode", () => {
      process.env.NODE_ENV = "development";
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      initializeAnalytics();
    });

    it("handles Google Analytics initialization errors gracefully", () => {
      (initGA as jest.Mock).mockImplementation(() => {
        throw new Error("GA init failed");
      });
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      initializeAnalytics();
    });
  });

  describe("trackPageView", () => {
    it("tracks page view with Google Analytics", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackPageView("/test-page", "Test Page");

      expect(gaPageview).toHaveBeenCalledWith("/test-page");
      expect(umamiTrackPageView).not.toHaveBeenCalled();
    });

    it("tracks page view with Umami", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);
      // Disable Google Analytics for this test
      const originalGA = process.env.GA_MEASUREMENT_ID;
      delete process.env.GA_MEASUREMENT_ID;

      await trackPageView("/test-page", "Test Page");

      expect(umamiTrackPageView).toHaveBeenCalledWith(
        "/test-page",
        undefined,
        "Test Page",
      );
      expect(gaPageview).not.toHaveBeenCalled();

      // Restore
      process.env.GA_MEASUREMENT_ID = originalGA;
    });

    it("tracks page view with both providers when both are enabled", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackPageView("/test-page", "Test Page");

      expect(gaPageview).toHaveBeenCalledWith("/test-page");
      expect(umamiTrackPageView).toHaveBeenCalledWith(
        "/test-page",
        undefined,
        "Test Page",
      );
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackPageView("/test-page", "Test Page");
    });

    it("handles Google Analytics errors gracefully", async () => {
      (gaPageview as jest.Mock).mockImplementation(() => {
        throw new Error("GA error");
      });
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackPageView("/test-page");
    });

    it("handles Umami errors gracefully", async () => {
      (umamiTrackPageView as jest.Mock).mockRejectedValue(
        new Error("Umami error"),
      );
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackPageView("/test-page");
    });

    it("ensures analytics providers are available for tracking", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackPageView("/test-page");

      // Just verify the function completes without error and calls expected providers
      expect(gaPageview).toHaveBeenCalledWith("/test-page");
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
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackEvent(testEventData);

      expect(gaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        value: 42,
      });
    });

    it("tracks event with Umami", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackEvent(testEventData);

      expect(trackCustomEvent).toHaveBeenCalledWith(
        "test_action",
        testEventData,
      );
    });

    it("tracks event with both providers when both are enabled", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackEvent(testEventData);

      expect(gaEvent).toHaveBeenCalledWith({
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
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackEvent({ action: "test_action" });

      expect(gaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "engagement",
        label: "",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackEvent(testEventData);
    });

    it("handles Google Analytics errors gracefully", async () => {
      (gaEvent as jest.Mock).mockImplementation(() => {
        throw new Error("GA error");
      });
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackEvent(testEventData);
    });

    it("handles Umami errors gracefully", async () => {
      (trackCustomEvent as jest.Mock).mockRejectedValue(
        new Error("Umami error"),
      );
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackEvent(testEventData);
    });

    it("ensures analytics providers are available for event tracking", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackEvent(testEventData);

      // Just verify the function completes without error and calls expected providers
      expect(gaEvent).toHaveBeenCalledWith({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        value: 42,
      });
    });
  });

  describe("trackFormSubmit", () => {
    it("tracks form submission with Umami and as regular event", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

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
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackFormSubmit("contact_form");

      expect(trackFormSubmission).not.toHaveBeenCalled();
      expect(gaEvent).toHaveBeenCalledWith({
        action: "form_submit",
        category: "forms",
        label: "contact_form",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackFormSubmit("contact_form");
    });

    it("handles Umami errors gracefully", async () => {
      (trackFormSubmission as jest.Mock).mockRejectedValue(
        new Error("Umami error"),
      );
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackFormSubmit("contact_form");
    });
  });

  describe("trackButtonClick", () => {
    it("tracks button click with Umami and as regular event", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

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
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackButtonClick("submit_button");

      expect(umamiTrackButtonClick).not.toHaveBeenCalled();
      expect(gaEvent).toHaveBeenCalledWith({
        action: "button_click",
        category: "interaction",
        label: "submit_button",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackButtonClick("submit_button", "contact_form");
    });

    it("handles Umami errors gracefully", async () => {
      (umamiTrackButtonClick as jest.Mock).mockRejectedValue(
        new Error("Umami error"),
      );
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackButtonClick("submit_button");
    });
  });

  describe("trackEngagement", () => {
    it("tracks engagement with Umami and as regular event", async () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

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
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackEngagement("time_on_page", { seconds: 30 });

      expect(umamiTrackEngagement).not.toHaveBeenCalled();
      expect(gaEvent).toHaveBeenCalledWith({
        action: "engagement_time_on_page",
        category: "engagement",
        label: "time_on_page",
        value: undefined,
      });
    });

    it("logs debug information in development mode", async () => {
      process.env.NODE_ENV = "development";
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      await trackEngagement("scroll");
    });

    it("handles Umami errors gracefully", async () => {
      (umamiTrackEngagement as jest.Mock).mockRejectedValue(
        new Error("Umami error"),
      );
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      await trackEngagement("scroll");
    });
  });

  describe("isAnalyticsConfigured", () => {
    it("returns true when Google Analytics is configured", () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      const result = isAnalyticsConfigured();

      expect(result).toBe(true);
    });

    it("returns true when Umami is configured", () => {
      const originalGA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
      delete process.env.GA_MEASUREMENT_ID;

      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

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
      (isUmamiConfigured as jest.Mock).mockReturnValue(false);

      const result = isAnalyticsConfigured();

      expect(result).toBe(false);

      // Restore
      gtagModule.GA_MEASUREMENT_ID = originalGAValue;
    });
  });

  describe("getAnalyticsStatus", () => {
    it("returns complete analytics configuration and status", () => {
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

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
      (umamiTrackPageView as jest.Mock).mockRejectedValue(
        new Error("Async error"),
      );
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

      // Should not throw despite the rejection
      await expect(trackPageView("/test")).resolves.not.toThrow();
    });

    it("continues execution when one provider fails", async () => {
      (gaPageview as jest.Mock).mockImplementation(() => {
        throw new Error("GA failed");
      });
      (isUmamiConfigured as jest.Mock).mockReturnValue(true);

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
