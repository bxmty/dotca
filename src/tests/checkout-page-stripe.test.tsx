import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckoutPage from "@/app/checkout/page";

// Mock next/navigation
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

// Mock the components
jest.mock("@/app/checkout/PlanSelector", () => ({
  __esModule: true,
  default: function MockPlanSelector({
    onPlanSelected,
    pricingPlans,
  }: {
    onPlanSelected: (plan: Record<string, unknown>) => void;
    pricingPlans: Array<{ name: string }>;
  }) {
    // Simulate selecting the Basic plan after render
    React.useEffect(() => {
      const basic = pricingPlans.find((plan) => plan.name === "Basic");
      if (basic) {
        onPlanSelected(basic);
      }
    }, [onPlanSelected, pricingPlans]);

    return <div data-testid="plan-selector">Plan Selector Mock</div>;
  },
}));

jest.mock("@/app/components/StripeWrapper", () => ({
  __esModule: true,
  default: ({
    children,
    plan,
    employeeCount,
    billingCycle,
  }: {
    children: React.ReactNode;
    plan: string;
    employeeCount: number;
    billingCycle: string;
  }) => (
    <div
      data-testid="stripe-wrapper"
      data-plan={plan}
      data-employee-count={employeeCount}
      data-billing-cycle={billingCycle}
    >
      {children}
    </div>
  ),
}));

jest.mock("@/app/components/StripePaymentForm", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="stripe-payment-form">
      <button data-testid="mock-payment-button" onClick={onSuccess}>
        Complete Payment
      </button>
    </div>
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

async function continueToPayment() {
  await waitFor(() => {
    expect(screen.getByLabelText("First Name*")).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText("First Name*"), {
    target: { value: "John" },
  });
  fireEvent.change(screen.getByLabelText("Last Name*"), {
    target: { value: "Doe" },
  });
  fireEvent.change(screen.getByLabelText("Email Address*"), {
    target: { value: "john@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Company Name"), {
    target: { value: "ACME Inc" },
  });
  fireEvent.change(screen.getByLabelText("Address"), {
    target: { value: "123 Main St" },
  });
  fireEvent.change(screen.getByLabelText("City"), {
    target: { value: "Toronto" },
  });
  fireEvent.change(screen.getByLabelText("Province/State"), {
    target: { value: "ON" },
  });
  fireEvent.change(screen.getByLabelText("Postal Code"), {
    target: { value: "M5V 1A1" },
  });

  await waitFor(() => {
    expect(document.getElementById("phone")).toBeInTheDocument();
  });
  fireEvent.change(document.getElementById("phone") as HTMLInputElement, {
    target: { value: "1234567890" },
  });

  const form = screen
    .getByLabelText("First Name*")
    .closest("form") as HTMLFormElement;
  fireEvent.submit(form);

  await waitFor(() => {
    expect(screen.getByTestId("stripe-wrapper")).toBeInTheDocument();
  });
}

// Tests that focus on Stripe integration in the checkout page
describe("Checkout Page with Stripe Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes the selected order to the Stripe wrapper", async () => {
    render(<CheckoutPage />);

    await continueToPayment();

    const wrapper = screen.getByTestId("stripe-wrapper");
    expect(wrapper).toHaveAttribute("data-plan", "Basic");
    expect(wrapper).toHaveAttribute("data-employee-count", "5");
    expect(wrapper).toHaveAttribute("data-billing-cycle", "monthly");
  });

  it("updates the order details when employee count changes", async () => {
    render(<CheckoutPage />);

    await continueToPayment();

    fireEvent.change(screen.getByLabelText("Number of Employees (minimum 5)"), {
      target: { value: "12" },
    });

    expect(screen.getByTestId("stripe-wrapper")).toHaveAttribute(
      "data-employee-count",
      "12",
    );
  });

  it("passes the annual billing cycle through to Stripe", async () => {
    render(<CheckoutPage />);

    await continueToPayment();

    fireEvent.click(screen.getByLabelText(/^Annual/));

    expect(screen.getByTestId("stripe-wrapper")).toHaveAttribute(
      "data-billing-cycle",
      "annual",
    );
  });

  it("redirects to the confirmation page on successful payment", async () => {
    render(<CheckoutPage />);

    await continueToPayment();

    fireEvent.click(screen.getByTestId("mock-payment-button"));

    expect(mockPush).toHaveBeenCalledWith(
      "/checkout/confirmation?redirect_status=succeeded",
    );
  });
});
