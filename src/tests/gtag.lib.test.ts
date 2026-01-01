// Mock window and document for browser environment testing
const mockGtag = jest.fn();
const mockDataLayer: Array<IArguments | unknown[]> = [];

// Extend window interface for testing
declare global {
  interface Window {
    gtag: typeof mockGtag;
    dataLayer: Array<IArguments | unknown[]>;
  }
}

Object.defineProperty(window, "gtag", {
  writable: true,
  value: mockGtag,
});

Object.defineProperty(window, "dataLayer", {
  writable: true,
  value: mockDataLayer,
});

// Mock setTimeout
jest.useFakeTimers();

describe("gtag.ts Google Analytics utilities", () => {
  const originalEnv = process.env;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockGtag.mockClear();
    mockDataLayer.length = 0;

    // Mock window.gtag
    window.gtag = mockGtag;
    window.dataLayer = mockDataLayer;

    // Mock console methods to avoid noise in tests
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore original environment and console
    process.env = originalEnv;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("GA_MEASUREMENT_ID", () => {
    it("returns production GA ID when environment is production", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA-PRODUCTION-ID";

      jest.resetModules();
      const { GA_MEASUREMENT_ID: newGAId } = require("@/lib/gtag");

      expect(newGAId).toBe("GA-PRODUCTION-ID");
    });

    it("returns staging GA ID when environment is staging", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";
      process.env.NEXT_PUBLIC_STAGING_GA_ID = "GA-STAGING-ID";

      jest.resetModules();
      const { GA_MEASUREMENT_ID: newGAId } = require("@/lib/gtag");

      expect(newGAId).toBe("GA-STAGING-ID");
    });

    it("returns dev GA ID for development environment", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      process.env.NEXT_PUBLIC_DEV_GA_ID = "GA-DEV-ID";

      jest.resetModules();
      const { GA_MEASUREMENT_ID: newGAId } = require("@/lib/gtag");

      expect(newGAId).toBe("GA-DEV-ID");
    });

    it("returns dev GA ID when no matching environment (fallback)", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "unknown";
      process.env.NEXT_PUBLIC_DEV_GA_ID = "GA-DEV-ID";

      jest.resetModules();
      const { GA_MEASUREMENT_ID: newGAId } = require("@/lib/gtag");

      expect(newGAId).toBe("GA-DEV-ID");
    });

    it("returns undefined when no environment variables are set", () => {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT;
      delete process.env.NEXT_PUBLIC_PRODUCTION_GA_ID;
      delete process.env.NEXT_PUBLIC_STAGING_GA_ID;
      delete process.env.NEXT_PUBLIC_DEV_GA_ID;

      jest.resetModules();
      const { GA_MEASUREMENT_ID: newGAId } = require("@/lib/gtag");

      expect(newGAId).toBeUndefined();
    });
  });

  describe("initGA", () => {
    it("does not initialize when GA_MEASUREMENT_ID is not available", () => {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT;
      delete process.env.NEXT_PUBLIC_PRODUCTION_GA_ID;
      delete process.env.NEXT_PUBLIC_STAGING_GA_ID;
      delete process.env.NEXT_PUBLIC_DEV_GA_ID;

      jest.resetModules();
      const { initGA: newInitGA } = require("@/lib/gtag");

      newInitGA();

      // Should not set up gtag function when no GA ID is available
      expect(window.gtag).toBeUndefined();
    });

    it("configures GA immediately if gtag is already available", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA-PRODUCTION-ID";

      // Pre-set gtag function
      window.gtag = mockGtag;

      jest.resetModules();
      const { initGA: newInitGA } = require("@/lib/gtag");

      newInitGA();

      expect(console.log).toHaveBeenCalledWith(
        "GA script already loaded, configuring directly...",
      );
      expect(mockGtag).toHaveBeenCalledWith("js", expect.any(Date));
    });

    it("initializes GA script and sets up gtag function", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA-PRODUCTION-ID";

      // Remove gtag initially
      delete window.gtag;

      jest.resetModules();
      const { initGA: newInitGA } = require("@/lib/gtag");

      newInitGA();

      // Should set up dataLayer
      expect(window.dataLayer).toEqual([]);

      // Should define gtag function
      expect(typeof window.gtag).toBe("function");

      // Fast-forward setTimeout
      jest.runOnlyPendingTimers();

      // Should configure GA
      expect(mockGtag).toHaveBeenCalledWith("js", expect.any(Date));
    });

    it("configures GA with production settings", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA-PRODUCTION-ID";

      window.gtag = mockGtag;

      jest.resetModules();
      const { initGA: newInitGA } = require("@/lib/gtag");

      newInitGA();

      expect(mockGtag).toHaveBeenCalledWith("config", "GA-PRODUCTION-ID", {
        send_page_view: true,
        transport_type: "beacon",
      });
    });

    it("configures GA with staging settings", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";
      process.env.NEXT_PUBLIC_STAGING_GA_ID = "GA-STAGING-ID";

      window.gtag = mockGtag;

      jest.resetModules();
      const { initGA: newInitGA } = require("@/lib/gtag");

      newInitGA();

      expect(mockGtag).toHaveBeenCalledWith("config", "GA-STAGING-ID", {
        send_page_view: true,
      });
    });

    it("configures GA with development settings", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      process.env.NEXT_PUBLIC_DEV_GA_ID = "GA-DEV-ID";

      window.gtag = mockGtag;

      jest.resetModules();
      const { initGA: newInitGA } = require("@/lib/gtag");

      newInitGA();

      expect(mockGtag).toHaveBeenCalledWith("config", "GA-DEV-ID", {
        debug_mode: true,
        send_page_view: false,
      });
    });
  });

  describe("pageview", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA-PRODUCTION-ID";
      window.gtag = mockGtag;
    });

    it("does not track pageview when GA_MEASUREMENT_ID is missing", () => {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT;
      delete process.env.NEXT_PUBLIC_PRODUCTION_GA_ID;

      jest.resetModules();
      const { pageview: newPageview } = require("@/lib/gtag");

      newPageview("/test-page");

      expect(mockGtag).not.toHaveBeenCalled();
    });

    it("warns when gtag is not available", () => {
      delete window.gtag;

      jest.resetModules();
      const { pageview: newPageview } = require("@/lib/gtag");

      newPageview("/test-page");

      // Should not call gtag when it's not available
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it("tracks pageview successfully", () => {
      jest.resetModules();
      const { pageview: newPageview } = require("@/lib/gtag");

      newPageview("/test-page");

      expect(mockGtag).toHaveBeenCalledWith("config", "GA-PRODUCTION-ID", {
        page_path: "/test-page",
      });
      expect(console.log).toHaveBeenCalledWith(
        "Tracked pageview in production: /test-page",
      );
    });

    it("logs debug info in development", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      process.env.NEXT_PUBLIC_DEV_GA_ID = "GA-DEV-ID";

      jest.resetModules();
      const { pageview: newPageview } = require("@/lib/gtag");

      newPageview("/test-page");

      expect(console.log).toHaveBeenCalledWith(
        "[DEV] Tracking pageview: /test-page",
      );
    });

    it("handles errors gracefully", () => {
      mockGtag.mockImplementation(() => {
        throw new Error("GA error");
      });

      jest.resetModules();
      const { pageview: newPageview } = require("@/lib/gtag");

      newPageview("/test-page");

      expect(console.error).toHaveBeenCalledWith(
        "Error tracking pageview:",
        expect.any(Error),
      );
    });
  });

  describe("event", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA-PRODUCTION-ID";
      window.gtag = mockGtag;
    });

    it("does not track event when GA_MEASUREMENT_ID is missing", () => {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT;
      delete process.env.NEXT_PUBLIC_PRODUCTION_GA_ID;

      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
      });

      expect(mockGtag).not.toHaveBeenCalled();
    });

    it("warns when gtag is not available", () => {
      delete window.gtag;

      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
      });

      expect(mockGtag).not.toHaveBeenCalled();
    });

    it("tracks event successfully in production", () => {
      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        value: 42,
      });

      expect(mockGtag).toHaveBeenCalledWith("event", "test_action", {
        event_category: "test_category",
        event_label: "test_label",
        value: 42,
        environment: "production",
      });
    });

    it("tracks event in staging environment", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";
      process.env.NEXT_PUBLIC_STAGING_GA_ID = "GA-STAGING-ID";

      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
      });

      expect(mockGtag).toHaveBeenCalledWith("event", "test_action", {
        event_category: "test_category",
        event_label: "test_label",
        value: undefined,
        environment: "staging",
      });
    });

    it("tracks event in development environment", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      process.env.NEXT_PUBLIC_DEV_GA_ID = "GA-DEV-ID";

      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
      });

      expect(mockGtag).toHaveBeenCalledWith("event", "test_action", {
        event_category: "test_category",
        event_label: "test_label",
        value: undefined,
        environment: "development",
      });
    });

    it("logs debug info in development", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      process.env.NEXT_PUBLIC_DEV_GA_ID = "GA-DEV-ID";

      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
      });

      expect(console.log).toHaveBeenCalledWith(
        "[DEV] Tracking event: test_action in category test_category",
      );
    });

    it("handles errors gracefully", () => {
      mockGtag.mockImplementation(() => {
        throw new Error("GA error");
      });

      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
      });

      expect(console.error).toHaveBeenCalledWith(
        "Error tracking event:",
        expect.any(Error),
      );
    });

    it("handles missing optional parameters", () => {
      jest.resetModules();
      const { event: newEvent } = require("@/lib/gtag");

      newEvent({
        action: "test_action",
        category: "test_category",
        label: "test_label",
        // value is optional and not provided
      });

      expect(mockGtag).toHaveBeenCalledWith("event", "test_action", {
        event_category: "test_category",
        event_label: "test_label",
        value: undefined,
        environment: "production",
      });
    });
  });

  describe("environment detection and logging", () => {
    it("correctly identifies production environment", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";

      jest.resetModules();
      require("@/lib/gtag");

      expect(console.log).toHaveBeenCalledWith("GA Environment: production");
    });

    it("correctly identifies staging environment", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";

      jest.resetModules();
      require("@/lib/gtag");

      expect(console.log).toHaveBeenCalledWith("GA Environment: staging");
    });

    it("correctly identifies development environment", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

      jest.resetModules();
      require("@/lib/gtag");

      expect(console.log).toHaveBeenCalledWith("GA Environment: development");
    });

    it("masks GA IDs in logging", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA1.2.123456789";
      process.env.NEXT_PUBLIC_STAGING_GA_ID = "GA1.2.987654321";

      jest.resetModules();
      require("@/lib/gtag");

      expect(console.log).toHaveBeenCalledWith(
        "GA Measurement ID: SET (masked)",
      );
      expect(console.log).toHaveBeenCalledWith(
        "NEXT_PUBLIC_STAGING_GA_ID: GA1.****4321",
      );
    });

    it("shows masked GA IDs appropriately", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA1.2.123456789";
      process.env.NEXT_PUBLIC_STAGING_GA_ID = "GA1.2.987654321";

      jest.resetModules();
      require("@/lib/gtag");

      // Should mask GA IDs in production
      expect(console.log).toHaveBeenCalledWith(
        "GA Measurement ID: SET (masked)",
      );
    });
  });

  describe("window.gtag function", () => {
    it("pushes data to dataLayer", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "GA-PRODUCTION-ID";

      // Remove gtag initially
      delete window.gtag;

      jest.resetModules();
      const { initGA: newInitGA } = require("@/lib/gtag");

      newInitGA();

      // Call the gtag function
      window.gtag("test_command", "test_target", { key: "value" });

      expect(window.dataLayer).toEqual([
        ["test_command", "test_target", { key: "value" }],
      ]);
    });
  });
});
