import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import StripeWrapper from "@/app/components/StripeWrapper";
import StripePaymentForm from "@/app/components/StripePaymentForm";

// Mock the required modules
jest.mock("@/lib/stripe", () => ({
  getStripe: jest.fn().mockReturnValue({}),
}));

jest.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
  PaymentElement: () => (
    <div data-testid="payment-element">Payment Element</div>
  ),
  useStripe: jest.fn(),
  useElements: jest.fn(),
}));

// Import the mocked modules for direct manipulation in tests
import { useStripe, useElements } from "@stripe/react-stripe-js";

describe("Stripe Integration", () => {
  const originalFetch = global.fetch;
  let mockConfirmPayment: jest.Mock;
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mocks for the payment flow
    mockConfirmPayment = jest.fn().mockResolvedValue({ error: null });
    (useStripe as jest.Mock).mockReturnValue({
      confirmPayment: mockConfirmPayment,
    });
    (useElements as jest.Mock).mockReturnValue({});

    // Mock fetch for API calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ clientSecret: "test_client_secret" }),
    } as unknown as Response);

    // Mock window.location.origin
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: { origin: string } }).location = {
      origin: "https://test.example.com",
    };
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("integrates StripeWrapper with StripePaymentForm", async () => {
    render(
      <StripeWrapper amount={1000}>
        <StripePaymentForm onSuccess={mockOnSuccess} />
      </StripeWrapper>,
    );

    // Initially shows loading state
    expect(screen.getByText("Loading payment form...")).toBeInTheDocument();

    // Wait for payment intent to be created
    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Submit the payment using the form element directly
    const form = document.querySelector("form.stripe-form") as HTMLFormElement;
    fireEvent.submit(form);

    // Check if confirmPayment was called
    expect(mockConfirmPayment).toHaveBeenCalledWith({
      elements: {},
      confirmParams: {
        return_url: "http://localhost/checkout/confirmation",
      },
      redirect: "if_required",
    });

    // Wait for success callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("handles failed payment in the integration flow", async () => {
    // Set up for payment failure
    mockConfirmPayment.mockResolvedValue({
      error: { message: "Your card was declined" },
    });

    render(
      <StripeWrapper amount={1000}>
        <StripePaymentForm onSuccess={mockOnSuccess} />
      </StripeWrapper>,
    );

    // Wait for payment form to load
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Submit the payment using the form element directly
    const form = document.querySelector("form.stripe-form") as HTMLFormElement;
    fireEvent.submit(form);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText("Your card was declined")).toBeInTheDocument();
    });

    // Success callback should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("handles API errors when creating payment intent", async () => {
    // Mock fetch to simulate API error
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Unable to create payment intent" }),
    } as unknown as Response);

    render(
      <StripeWrapper amount={1000}>
        <StripePaymentForm onSuccess={mockOnSuccess} />
      </StripeWrapper>,
    );

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
      expect(
        screen.getByText("Unable to create payment intent"),
      ).toBeInTheDocument();
    });

    // Payment form should not be visible
    expect(screen.queryByTestId("payment-element")).not.toBeInTheDocument();
  });

  it("includes metadata in the payment intent request", async () => {
    const testMetadata = {
      plan: "premium",
      customerEmail: "test@example.com",
      employeeCount: "10",
    };

    render(
      <StripeWrapper amount={1000} metadata={testMetadata}>
        <StripePaymentForm onSuccess={mockOnSuccess} />
      </StripeWrapper>,
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Verify API call included metadata
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stripe/create-payment-intent",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: 1000,
          metadata: testMetadata,
        }),
      }),
    );
  });
});
