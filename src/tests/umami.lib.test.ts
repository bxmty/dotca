import {
  trackPageView,
  trackCustomEvent,
  trackFormSubmission,
  trackButtonClick,
  trackEngagement,
  isUmamiConfigured,
  initializeUmamiTracking,
  getUmamiConfig,
  transformEventData,
} from "@/lib/umami";

// Mock the @umami/node module
const mockTrack = jest.fn().mockResolvedValue(undefined);

jest.mock("@umami/node", () => ({
  Umami: jest.fn().mockImplementation(() => ({
    track: mockTrack,
  })),
}));

// Get reference to the mocked Umami constructor for tests
const MockUmami = require("@umami/node").Umami;

describe("umami.ts server-side analytics", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockTrack.mockClear();

    // Setup default environment for tests
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: "test-website-id",
      NEXT_PUBLIC_UMAMI_HOST_URL: "https://umami.example.com",
      UMAMI_SESSION_ID: "test-session-id",
      USER_AGENT: "test-user-agent",
      CLIENT_IP: "127.0.0.1",
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("transformEventData", () => {
    it("returns undefined when no data is provided", () => {
      const result = transformEventData();
      expect(result).toBeUndefined();
    });

    it("returns undefined when empty object is provided", () => {
      const result = transformEventData({});
      expect(result).toBeUndefined();
    });

    it("transforms string values correctly", () => {
      const data = { name: "John", category: "user" };
      const result = transformEventData(data);

      expect(result).toEqual({
        name: "John",
        category: "user",
      });
    });

    it("transforms number values correctly", () => {
      const data = { count: 42, price: 19.99 };
      const result = transformEventData(data);

      expect(result).toEqual({
        count: 42,
        price: 19.99,
      });
    });

    it("transforms Date objects correctly", () => {
      const date = new Date("2023-01-01");
      const data = { timestamp: date };
      const result = transformEventData(data);

      expect(result).toEqual({
        timestamp: date,
      });
    });

    it("converts non-string/number/Date values to strings", () => {
      const data = {
        boolean: true,
        object: { nested: "value" },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      };
      const result = transformEventData(data);

      expect(result).toEqual({
        boolean: "true",
        object: "[object Object]",
        array: "1,2,3",
        // null and undefined should be excluded
      });
    });

    it("excludes null and undefined values", () => {
      const data = {
        valid: "value",
        nullValue: null,
        undefinedValue: undefined,
      };
      const result = transformEventData(data);

      expect(result).toEqual({
        valid: "value",
      });
    });

    it("handles mixed data types correctly", () => {
      const data = {
        string: "test",
        number: 123,
        date: new Date(),
        boolean: false,
        nullValue: null,
        validObject: { key: "value" },
      };
      const result = transformEventData(data);

      expect(result).toEqual({
        string: "test",
        number: 123,
        date: expect.any(Date),
        boolean: "false",
        validObject: "[object Object]",
      });
    });
  });

  describe("getUmamiConfig", () => {
    it("returns null when website ID is missing", () => {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

      const config = getUmamiConfig();

      expect(config).toBeNull();
    });

    it("returns null when host URL is missing", () => {
      delete process.env.NEXT_PUBLIC_UMAMI_HOST_URL;

      const config = getUmamiConfig();

      expect(config).toBeNull();
    });

    it("returns complete config when all environment variables are set", () => {
      const config = getUmamiConfig();

      expect(config).toEqual({
        websiteId: "test-website-id",
        hostUrl: "https://umami.example.com",
        sessionId: "test-session-id",
        userAgent: "test-user-agent",
        ip: "127.0.0.1",
      });
    });

    it("returns config with undefined optional fields when not set", () => {
      delete process.env.UMAMI_SESSION_ID;
      delete process.env.USER_AGENT;
      delete process.env.CLIENT_IP;

      const config = getUmamiConfig();

      expect(config).toEqual({
        websiteId: "test-website-id",
        hostUrl: "https://umami.example.com",
        sessionId: undefined,
        userAgent: undefined,
        ip: undefined,
      });
    });
  });

  describe("isUmamiConfigured", () => {
    it("returns true when both required environment variables are set", () => {
      const result = isUmamiConfigured();
      expect(result).toBe(true);
    });

    it("returns false when website ID is missing", () => {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

      const result = isUmamiConfigured();
      expect(result).toBe(false);
    });

    it("returns false when host URL is missing", () => {
      delete process.env.NEXT_PUBLIC_UMAMI_HOST_URL;

      const result = isUmamiConfigured();
      expect(result).toBe(false);
    });

    it("returns false when both environment variables are missing", () => {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
      delete process.env.NEXT_PUBLIC_UMAMI_HOST_URL;

      const result = isUmamiConfigured();
      expect(result).toBe(false);
    });
  });

  describe("trackPageView", () => {
    it("does nothing when Umami is not configured", async () => {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

      await trackPageView("/test-page");

      expect(MockUmami).not.toHaveBeenCalled();
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("tracks pageview with basic parameters", async () => {
      await trackPageView("/test-page");

      expect(MockUmami).toHaveBeenCalledWith({
        websiteId: "test-website-id",
        hostUrl: "https://umami.example.com",
      });
      expect(mockTrack).toHaveBeenCalledWith("pageview", {
        url: "/test-page",
        referrer: "",
        title: "Unknown Page",
      });
    });

    it("tracks pageview with referrer and title", async () => {
      await trackPageView(
        "/test-page",
        "https://referrer.com",
        "Test Page Title",
      );

      expect(mockTrack).toHaveBeenCalledWith("pageview", {
        url: "/test-page",
        referrer: "https://referrer.com",
        title: "Test Page Title",
      });
    });

    it("handles tracking errors gracefully", async () => {
      mockTrack.mockRejectedValueOnce(new Error("Tracking failed"));

      await expect(trackPageView("/test-page")).resolves.not.toThrow();

      expect(mockTrack).toHaveBeenCalledTimes(1);
    });
  });

  describe("trackCustomEvent", () => {
    it("does nothing when Umami is not configured", async () => {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

      await trackCustomEvent("test_event");

      expect(MockUmami).not.toHaveBeenCalled();
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("tracks custom event without data", async () => {
      await trackCustomEvent("test_event");

      expect(MockUmami).toHaveBeenCalledWith({
        websiteId: "test-website-id",
        hostUrl: "https://umami.example.com",
      });
      expect(mockTrack).toHaveBeenCalledWith("test_event", undefined);
    });

    it("tracks custom event with transformed data", async () => {
      const eventData = {
        category: "test",
        value: 123,
        metadata: { nested: "data" },
      };

      await trackCustomEvent("test_event", eventData);

      expect(mockTrack).toHaveBeenCalledWith("test_event", {
        category: "test",
        value: 123,
        metadata: "[object Object]",
      });
    });

    it("handles tracking errors gracefully", async () => {
      mockTrack.mockRejectedValueOnce(new Error("Tracking failed"));

      await expect(trackCustomEvent("test_event")).resolves.not.toThrow();

      expect(mockTrack).toHaveBeenCalledTimes(1);
    });
  });

  describe("trackFormSubmission", () => {
    it("tracks form submission with basic form name", async () => {
      await trackFormSubmission("contact_form");

      expect(mockTrack).toHaveBeenCalledWith("form_submission_contact_form", {
        form_name: "contact_form",
        field_count: 0,
      });
    });

    it("sanitizes and tracks form data", async () => {
      const formData = {
        name: "John Doe",
        message: "Test message",
        email: "john@example.com", // Should be excluded
        password: "secret123", // Should be excluded
        age: 30,
        interests: ["coding", "testing"],
      };

      await trackFormSubmission("contact_form", formData);

      expect(mockTrack).toHaveBeenCalledWith("form_submission_contact_form", {
        form_name: "contact_form",
        field_count: 4, // name, message, age, interests
        name: "John Doe",
        message: "Test message",
        age: 30,
        interests: "coding,testing", // Array converted to string
      });
    });

    it("truncates long text fields", async () => {
      const longMessage = "a".repeat(150);
      const formData = {
        name: "John",
        message: longMessage,
      };

      await trackFormSubmission("contact_form", formData);

      expect(mockTrack).toHaveBeenCalledWith("form_submission_contact_form", {
        form_name: "contact_form",
        field_count: 2,
        name: "John",
        message: "a".repeat(100) + "...",
      });
    });

    it("excludes sensitive fields", async () => {
      const formData = {
        name: "John",
        email: "john@example.com",
        phone: "+1234567890",
        credit_card: "4111111111111111",
        ssn: "123-45-6789",
        password: "secret",
        safe_field: "this is safe",
      };

      await trackFormSubmission("contact_form", formData);

      expect(mockTrack).toHaveBeenCalledWith("form_submission_contact_form", {
        form_name: "contact_form",
        field_count: 2, // name and safe_field should be included (others are sensitive)
        name: "John",
        safe_field: "this is safe",
      });
    });

    it("handles empty form data", async () => {
      await trackFormSubmission("contact_form", {});

      expect(mockTrack).toHaveBeenCalledWith("form_submission_contact_form", {
        form_name: "contact_form",
        field_count: 0,
      });
    });
  });

  describe("trackButtonClick", () => {
    it("tracks button click with name only", async () => {
      await trackButtonClick("submit_button");

      expect(mockTrack).toHaveBeenCalledWith("button_click", {
        button_name: "submit_button",
        context: "unknown",
      });
    });

    it("tracks button click with context", async () => {
      await trackButtonClick("submit_button", "contact_form");

      expect(mockTrack).toHaveBeenCalledWith("button_click", {
        button_name: "submit_button",
        context: "contact_form",
      });
    });
  });

  describe("trackEngagement", () => {
    it("tracks engagement event without details", async () => {
      await trackEngagement("scroll");

      expect(mockTrack).toHaveBeenCalledWith("engagement_scroll", undefined);
    });

    it("tracks engagement event with details", async () => {
      const details = { percent: 75, duration: 120 };

      await trackEngagement("scroll", details);

      expect(mockTrack).toHaveBeenCalledWith("engagement_scroll", details);
    });
  });

  describe("initializeUmamiTracking", () => {
    it("logs success message when configured", () => {
      // Mock console.log to avoid output during tests
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      initializeUmamiTracking();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Umami tracking initialized successfully",
      );

      consoleLogSpy.mockRestore();
    });

    it("logs warning when not configured", () => {
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      initializeUmamiTracking();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Umami tracking is not configured. Skipping initialization.",
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("handles Umami constructor errors gracefully", async () => {
      MockUmami.mockImplementationOnce(() => {
        throw new Error("Constructor failed");
      });

      await expect(trackPageView("/test")).resolves.not.toThrow();
    });

    it("handles undefined environment variables gracefully", () => {
      // Remove all environment variables
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
      delete process.env.NEXT_PUBLIC_UMAMI_HOST_URL;
      delete process.env.UMAMI_SESSION_ID;
      delete process.env.USER_AGENT;
      delete process.env.CLIENT_IP;

      const config = getUmamiConfig();
      expect(config).toBeNull();

      // Functions should not throw when config is null
      expect(() => isUmamiConfigured()).not.toThrow();
    });
  });
});
