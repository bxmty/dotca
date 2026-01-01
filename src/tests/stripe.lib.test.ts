import type { Stripe as StripeClient } from "@stripe/stripe-js";
import type Stripe from "stripe";

// Mock the Stripe modules
const mockLoadStripe = jest.fn();

// Define proper types for the Stripe constructor
interface StripeConstructorOptions {
  apiVersion?: string;
  timeout?: number;
  maxNetworkRetries?: number;
  [key: string]: unknown;
}

// Mock Stripe instance type for testing
interface MockStripeInstance {
  id: string;
  secretKey: string;
  options?: StripeConstructorOptions;
}

// Create a proper constructor mock for Stripe
const MockStripeConstructor = jest.fn().mockImplementation(function (
  this: MockStripeInstance,
  secretKey: string,
  options?: StripeConstructorOptions,
) {
  this.id = "mock-stripe-instance";
  this.secretKey = secretKey;
  this.options = options;
  return this;
});

// Alias for backward compatibility
const mockStripeConstructor = MockStripeConstructor;

jest.mock("@stripe/stripe-js", () => ({
  loadStripe: mockLoadStripe,
}));

// Mock the stripe module for dynamic imports
jest.doMock("stripe", () => ({
  __esModule: true,
  default: MockStripeConstructor,
}));

describe("stripe.ts utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset the stripePromise singleton between tests
    // We need to do this by re-importing the module or clearing the internal state
    jest.resetModules();

    // Setup environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
      STRIPE_SECRET_KEY: "sk_test_456",
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("getStripe", () => {
    it("returns a function", () => {
      const { getStripe } = require("@/lib/stripe");
      expect(typeof getStripe).toBe("function");
    });

    it("loads Stripe with publishable key on first call", () => {
      const { getStripe } = require("@/lib/stripe");
      const mockStripeInstance = { id: "stripe-instance" } as StripeClient;
      mockLoadStripe.mockResolvedValue(mockStripeInstance);

      const result = getStripe();

      expect(mockLoadStripe).toHaveBeenCalledWith("pk_test_123");
      expect(mockLoadStripe).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns the same promise on subsequent calls (singleton)", () => {
      const { getStripe } = require("@/lib/stripe");
      const mockStripeInstance = { id: "stripe-instance" } as StripeClient;
      mockLoadStripe.mockResolvedValue(mockStripeInstance);

      const result1 = getStripe();
      const result2 = getStripe();

      expect(result1).toBe(result2);
      expect(mockLoadStripe).toHaveBeenCalledTimes(1);
    });

    it("throws error when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set", () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const { getStripe } = require("@/lib/stripe");

      expect(() => getStripe()).toThrow(
        "Payment processing is temporarily unavailable",
      );
    });

    it("throws error when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is empty", () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "";
      const { getStripe } = require("@/lib/stripe");

      expect(() => getStripe()).toThrow(
        "Payment processing is temporarily unavailable",
      );
    });

    it("handles loadStripe promise resolution", async () => {
      const { getStripe } = require("@/lib/stripe");
      const mockStripeInstance = { id: "stripe-instance" } as StripeClient;
      mockLoadStripe.mockResolvedValue(mockStripeInstance);

      const result = await getStripe();

      expect(result).toBe(mockStripeInstance);
    });

    it("handles loadStripe promise rejection", async () => {
      const { getStripe } = require("@/lib/stripe");
      const error = new Error("Stripe loading failed");
      mockLoadStripe.mockRejectedValue(error);

      await expect(getStripe()).rejects.toThrow("Stripe loading failed");
    });
  });

  describe("getServerStripe", () => {
    it("returns a function", () => {
      const { getServerStripe } = require("@/lib/stripe");
      expect(typeof getServerStripe).toBe("function");
    });

    it("returns a Stripe instance with correct configuration", async () => {
      const { getServerStripe } = require("@/lib/stripe");
      const mockStripeInstance = { id: "server-stripe-instance" } as Stripe;
      mockStripeConstructor.mockImplementation(() => mockStripeInstance);

      const result = await getServerStripe();

      expect(mockStripeConstructor).toHaveBeenCalledWith("sk_test_456", {
        apiVersion: "2025-08-27.basil",
      });
      expect(result).toBe(mockStripeInstance);
    });

    it("throws error when STRIPE_SECRET_KEY is not set", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const { getServerStripe } = require("@/lib/stripe");

      await expect(getServerStripe()).rejects.toThrow(
        "STRIPE_SECRET_KEY is not set in environment variables",
      );
    });

    it("throws error when STRIPE_SECRET_KEY is empty", async () => {
      process.env.STRIPE_SECRET_KEY = "";
      const { getServerStripe } = require("@/lib/stripe");

      await expect(getServerStripe()).rejects.toThrow(
        "STRIPE_SECRET_KEY is not set in environment variables",
      );
    });

    it("handles Stripe constructor errors", async () => {
      const { getServerStripe } = require("@/lib/stripe");
      // Mock the stripe constructor to throw an error
      const originalMock = MockStripeConstructor.getMockImplementation();
      MockStripeConstructor.mockImplementationOnce(() => {
        throw new Error("Stripe constructor error");
      });

      await expect(getServerStripe()).rejects.toThrow();

      // Restore original mock
      if (originalMock) {
        MockStripeConstructor.mockImplementation(originalMock);
      }
    });

    it("uses dynamic import for Stripe module", async () => {
      const { getServerStripe } = require("@/lib/stripe");
      const mockStripeInstance = { id: "dynamic-import-stripe" } as Stripe;
      mockStripeConstructor.mockImplementation(() => mockStripeInstance);

      const result = await getServerStripe();

      // Verify that the dynamic import was used (mocked)
      expect(result).toBe(mockStripeInstance);
    });
  });

  describe("error handling and environment variables", () => {
    it("handles missing environment variables gracefully", () => {
      // Remove all Stripe environment variables
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const { getStripe, getServerStripe } = require("@/lib/stripe");

      // getStripe should throw with user-friendly message
      expect(() => getStripe()).toThrow(
        "Payment processing is temporarily unavailable",
      );

      // getServerStripe should throw with technical message (async)
      expect(getServerStripe()).rejects.toThrow(
        "STRIPE_SECRET_KEY is not set in environment variables",
      );
    });

    it("handles undefined environment variables", () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = undefined as
        | string
        | undefined;
      process.env.STRIPE_SECRET_KEY = undefined as string | undefined;

      const { getStripe } = require("@/lib/stripe");

      expect(() => getStripe()).toThrow(
        "Payment processing is temporarily unavailable",
      );
    });
  });
});
