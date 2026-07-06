import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import StripeWrapper from "@/app/components/StripeWrapper";
import { getStripe } from "@/lib/stripe";

// Mock the stripe module
jest.mock("@/lib/stripe", () => ({
  getStripe: jest.fn().mockReturnValue({}),
}));

// Mock the Elements component from @stripe/react-stripe-js
jest.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
}));

describe("StripeWrapper", () => {
  const originalFetch = global.fetch;
  const mockChildComponent = (
    <div data-testid="child-component">Test Child</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const orderProps = {
    plan: "Basic",
    employeeCount: 5,
    billingCycle: "monthly",
  };

  it("renders loading state initially", async () => {
    // Mock fetch to delay response
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ clientSecret: "test_secret" }),
            } as Response);
          }, 100),
        ),
    );

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    // Should show loading state
    expect(screen.getByText("Loading payment form...")).toBeInTheDocument();
  });

  it("renders children inside Stripe Elements when payment intent is created successfully", async () => {
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "test_secret" }),
    } as unknown as Response);

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
      expect(screen.getByTestId("child-component")).toBeInTheDocument();
    });

    // Verify API call was made with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stripe/create-payment-intent",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "Basic",
          employeeCount: 5,
          billingCycle: "monthly",
        }),
      }),
    );

    // Verify getStripe was called
    expect(getStripe).toHaveBeenCalled();
  });

  it("sends the order details for a different plan and billing cycle", async () => {
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "test_secret" }),
    } as unknown as Response);

    render(
      <StripeWrapper plan="Premium" employeeCount={12} billingCycle="annual">
        {mockChildComponent}
      </StripeWrapper>,
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    });

    // Verify API call was made with the order details
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stripe/create-payment-intent",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          plan: "Premium",
          employeeCount: 12,
          billingCycle: "annual",
        }),
      }),
    );
  });

  it("displays error when API call fails", async () => {
    // Mock failed API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "API error occurred" }),
    } as unknown as Response);

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
      expect(screen.getByText("API error occurred")).toBeInTheDocument();
    });
  });

  it("displays error when API response contains error", async () => {
    // Mock API response with error field
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ error: "Payment initialization failed" }),
    } as unknown as Response);

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
      expect(
        screen.getByText("Payment initialization failed"),
      ).toBeInTheDocument();
    });
  });

  it("displays generic error when fetch throws an error", async () => {
    // Mock fetch to throw error
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("displays fallback error message for non-Error objects", async () => {
    // Mock fetch to reject with non-Error object
    global.fetch = jest.fn().mockRejectedValueOnce("Unknown error");

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to initialize payment. Please try again."),
      ).toBeInTheDocument();
    });
  });
});
