import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import StripePaymentForm from "@/app/components/StripePaymentForm";

// Mock the stripe hooks
const mockConfirmPayment = jest.fn();
const mockUseStripe = jest.fn();
const mockUseElements = jest.fn();

jest.mock("@stripe/react-stripe-js", () => ({
  useStripe: () => mockUseStripe(),
  useElements: () => mockUseElements(),
  PaymentElement: () => (
    <div data-testid="payment-element">Payment Element</div>
  ),
}));

describe("StripePaymentForm", () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseStripe.mockReturnValue({
      confirmPayment: mockConfirmPayment,
    });
    mockUseElements.mockReturnValue({});
    mockConfirmPayment.mockResolvedValue({ error: null });

    // No need to mock location - test uses default localhost
  });

  it("renders the payment form with PaymentElement", () => {
    render(<StripePaymentForm onSuccess={mockOnSuccess} />);

    expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete payment/i }),
    ).toBeInTheDocument();
  });

  it("disables the submit button when Stripe is not loaded", () => {
    mockUseStripe.mockReturnValue(null);

    render(<StripePaymentForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole("button", {
      name: /complete payment/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("shows loading state during payment processing", async () => {
    // Mock confirmPayment to delay response
    mockConfirmPayment.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ error: null }), 100);
        }),
    );

    render(<StripePaymentForm onSuccess={mockOnSuccess} />);

    // Submit the form using the form element directly
    const form = document.querySelector("form.stripe-form") as HTMLFormElement;
    fireEvent.submit(form);

    // Button should show loading state
    expect(
      screen.getByRole("button", { name: /processing/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();

    // Wait for processing to complete
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /complete payment/i }),
      ).toBeInTheDocument();
    });
  });

  it("calls stripe.confirmPayment with correct parameters on form submission", async () => {
    render(<StripePaymentForm onSuccess={mockOnSuccess} />);

    // Submit the form using the form element directly
    const form = document.querySelector("form.stripe-form") as HTMLFormElement;
    fireEvent.submit(form);

    // Check if confirmPayment was called with correct parameters
    expect(mockConfirmPayment).toHaveBeenCalledWith({
      elements: {},
      confirmParams: {
        return_url: "http://localhost/checkout/confirmation",
      },
      redirect: "if_required",
    });
  });

  it("calls onSuccess callback when payment is successful", async () => {
    render(<StripePaymentForm onSuccess={mockOnSuccess} />);

    // Submit the form using the form element directly
    const form = document.querySelector("form.stripe-form") as HTMLFormElement;
    fireEvent.submit(form);

    // Wait for the success callback to be called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("displays error message when payment fails", async () => {
    // Mock payment error
    mockConfirmPayment.mockResolvedValue({
      error: { message: "Your card was declined" },
    });

    render(<StripePaymentForm onSuccess={mockOnSuccess} />);

    // Submit the form using the form element directly
    const form = document.querySelector("form.stripe-form") as HTMLFormElement;
    fireEvent.submit(form);

    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByText("Your card was declined")).toBeInTheDocument();
    });

    // Success callback should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("does nothing when form is submitted but Stripe is not loaded", () => {
    mockUseStripe.mockReturnValue(null);

    render(<StripePaymentForm onSuccess={mockOnSuccess} />);

    // Submit the form using the form element directly
    const form = document.querySelector("form.stripe-form") as HTMLFormElement;
    fireEvent.submit(form);

    // confirmPayment should not be called
    expect(mockConfirmPayment).not.toHaveBeenCalled();
  });
});
