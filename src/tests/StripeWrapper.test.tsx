import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import StripeWrapper, {
  type CheckoutCustomer,
} from "@/app/components/StripeWrapper";
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
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const customer: CheckoutCustomer = {
    name: "Test User",
    email: "test@example.com",
    phone: "+11234567890",
    company: "Test Co",
    address: "123 Test St",
    city: "Toronto",
    state: "ON",
    zip: "M5V 1A1",
  };

  const orderProps = {
    plan: "Basic",
    employeeCount: 5,
    billingCycle: "monthly",
    customer,
  };

  function lastFetchBody(): Record<string, unknown> {
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    return JSON.parse(init.body);
  }

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

  it("renders children inside Stripe Elements when the subscription is created successfully", async () => {
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
      "/api/stripe/create-subscription",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(lastFetchBody()).toEqual({
      plan: "Basic",
      employeeCount: 5,
      billingCycle: "monthly",
      customer,
      idempotencyKey: expect.any(String),
    });

    // Verify getStripe was called
    expect(getStripe).toHaveBeenCalled();
  });

  it("includes ga_client_id and ga_session_id when both GA cookies are present", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_DEV_GA_ID;
    process.env.NEXT_PUBLIC_DEV_GA_ID = "G-TESTID";
    document.cookie = "_ga=GA1.1.111111111.222222222";
    document.cookie = "_ga_TESTID=GS1.1.333333333.4.1.444444444.0.0.0";

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "test_secret" }),
    } as unknown as Response);

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    });

    expect(lastFetchBody()).toEqual(
      expect.objectContaining({
        ga_client_id: "111111111.222222222",
        ga_session_id: "333333333",
      }),
    );

    process.env.NEXT_PUBLIC_DEV_GA_ID = originalEnv;
  });

  it("omits ga_client_id and ga_session_id from the request when both GA cookies are absent", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "test_secret" }),
    } as unknown as Response);

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    });

    const body = lastFetchBody();
    expect(body).not.toHaveProperty("ga_client_id");
    expect(body).not.toHaveProperty("ga_session_id");
  });

  it("includes only ga_client_id when the session cookie is absent", async () => {
    document.cookie = "_ga=GA1.1.111111111.222222222";

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "test_secret" }),
    } as unknown as Response);

    render(<StripeWrapper {...orderProps}>{mockChildComponent}</StripeWrapper>);

    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    });

    const body = lastFetchBody();
    expect(body).toEqual(
      expect.objectContaining({ ga_client_id: "111111111.222222222" }),
    );
    expect(body).not.toHaveProperty("ga_session_id");
  });

  it("sends the order details for a different plan and billing cycle", async () => {
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "test_secret" }),
    } as unknown as Response);

    render(
      <StripeWrapper
        plan="Premium"
        employeeCount={12}
        billingCycle="annual"
        customer={customer}
      >
        {mockChildComponent}
      </StripeWrapper>,
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    });

    expect(lastFetchBody()).toEqual(
      expect.objectContaining({
        plan: "Premium",
        employeeCount: 12,
        billingCycle: "annual",
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
