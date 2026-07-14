// tests/checkout-page.test.tsx
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

// Mock the PlanSelector component
let mockOnPlanSelected: ((plan: unknown) => void) | null = null;
let mockPricingPlans: { name: string }[] = [];

jest.mock("@/app/checkout/PlanSelector", () => {
  return function MockPlanSelector({
    onPlanSelected,
    pricingPlans,
  }: {
    onPlanSelected: (plan: unknown) => void;
    pricingPlans: { name: string }[];
  }) {
    mockOnPlanSelected = onPlanSelected;
    mockPricingPlans = pricingPlans;

    return null;
  };
});

// Mock the Stripe components; their internals are covered by their own suites
jest.mock("@/app/components/StripeWrapper", () => ({
  __esModule: true,
  default: ({
    children,
    plan,
    employeeCount,
    billingCycle,
    customer,
  }: {
    children: React.ReactNode;
    plan: string;
    employeeCount: number;
    billingCycle: string;
    customer: { name: string; email: string };
  }) => (
    <div
      data-testid="stripe-wrapper"
      data-plan={plan}
      data-employee-count={employeeCount}
      data-billing-cycle={billingCycle}
      data-customer-name={customer.name}
      data-customer-email={customer.email}
    >
      {children}
    </div>
  ),
}));
jest.mock("@/app/components/StripePaymentForm", () => ({
  __esModule: true,
  default: () => <div data-testid="stripe-payment-form" />,
}));

// Mock the Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

function selectBasicPlan() {
  const basic = mockPricingPlans.find((plan) => plan.name === "Basic");
  mockOnPlanSelected!(basic);
}

async function fillCustomerInformation() {
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
}

describe("CheckoutPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    render(<CheckoutPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects the Free plan to onboarding", async () => {
    render(<CheckoutPage />);

    const free = mockPricingPlans.find((plan) => plan.name === "Free");
    mockOnPlanSelected!(free);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("renders checkout form with selected plan", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Complete Your Purchase",
        }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Basic Plan")).toBeInTheDocument();
    expect(screen.getByText("$99.00 per user per month")).toBeInTheDocument();

    // Customer information form
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name*")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name*")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address*")).toBeInTheDocument();

    // The waitlist is gone
    expect(screen.queryByText(/waitlist/i)).not.toBeInTheDocument();

    // Payment column with the gated continue button and the contact link
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByTestId("continue-to-payment")).toBeInTheDocument();
    expect(
      screen.getByText(/Need invoicing or a custom plan\?/),
    ).toBeInTheDocument();
  });

  it("updates form data when inputs change", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

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

    expect(screen.getByLabelText("First Name*")).toHaveValue("John");
    expect(screen.getByLabelText("Last Name*")).toHaveValue("Doe");
    expect(screen.getByLabelText("Email Address*")).toHaveValue(
      "john@example.com",
    );
  });

  it("blocks continuing to payment until required fields are filled", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(screen.getByTestId("continue-to-payment")).toBeInTheDocument();
    });

    const form = screen
      .getByLabelText("First Name*")
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Please fill in all required fields"),
    );
    expect(screen.queryByTestId("stripe-wrapper")).not.toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it("mounts the payment form with the confirmed customer snapshot", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(screen.getByLabelText("First Name*")).toBeInTheDocument();
    });

    await fillCustomerInformation();

    const form = screen
      .getByLabelText("First Name*")
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId("stripe-wrapper")).toBeInTheDocument();
    });

    const wrapper = screen.getByTestId("stripe-wrapper");
    expect(wrapper).toHaveAttribute("data-plan", "Basic");
    expect(wrapper).toHaveAttribute("data-employee-count", "5");
    expect(wrapper).toHaveAttribute("data-billing-cycle", "monthly");
    expect(wrapper).toHaveAttribute("data-customer-name", "John Doe");
    expect(wrapper).toHaveAttribute("data-customer-email", "john@example.com");
    expect(screen.getByTestId("stripe-payment-form")).toBeInTheDocument();
    expect(screen.queryByTestId("continue-to-payment")).not.toBeInTheDocument();
  });

  it("unmounts the payment form when customer information changes", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(screen.getByLabelText("First Name*")).toBeInTheDocument();
    });

    await fillCustomerInformation();
    const form = screen
      .getByLabelText("First Name*")
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId("stripe-wrapper")).toBeInTheDocument();
    });

    // Editing any field invalidates the confirmed snapshot
    fireEvent.change(screen.getByLabelText("Email Address*"), {
      target: { value: "different@example.com" },
    });

    await waitFor(() => {
      expect(screen.queryByTestId("stripe-wrapper")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("continue-to-payment")).toBeInTheDocument();
  });

  it("shows the correct total price", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Basic at $99.00 × 5 employees = $495.00 monthly
    const priceElements = screen.getAllByText("$495.00");
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("validates employee count input (5-20 range)", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    const employeeInput = screen.getByLabelText(
      "Number of Employees (minimum 5)",
    );

    fireEvent.change(employeeInput, { target: { value: "10" } });
    expect(employeeInput).toHaveValue(10);

    fireEvent.change(employeeInput, { target: { value: "5" } });
    expect(employeeInput).toHaveValue(5);

    fireEvent.change(employeeInput, { target: { value: "20" } });
    expect(employeeInput).toHaveValue(20);

    fireEvent.change(employeeInput, { target: { value: "3" } });
    expect(employeeInput).toHaveValue(20); // Should still be 20

    fireEvent.change(employeeInput, { target: { value: "25" } });
    expect(employeeInput).toHaveValue(20); // Should still be 20
  });

  it("handles billing cycle changes (monthly vs annual)", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    const monthlyRadio = screen.getByLabelText("Monthly");
    const annualRadio = screen.getByLabelText(/^Annual/);

    expect(monthlyRadio).toBeChecked();
    expect(annualRadio).not.toBeChecked();

    fireEvent.click(annualRadio);
    expect(monthlyRadio).not.toBeChecked();
    expect(annualRadio).toBeChecked();

    // Annual total: 99.00 × 5 × 12 × 0.9 = $5,346.00
    expect(screen.getAllByText("$5,346.00").length).toBeGreaterThan(0);

    fireEvent.click(monthlyRadio);
    expect(monthlyRadio).toBeChecked();
    expect(annualRadio).not.toBeChecked();
  });

  it("shows purchase terms instead of waitlist terms", async () => {
    render(<CheckoutPage />);

    selectBasicPlan();

    await waitFor(() => {
      expect(
        screen.getByText(/By completing your purchase, you agree to our/),
      ).toBeInTheDocument();
    });
  });

  it("shows loading state correctly", async () => {
    render(<CheckoutPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Customer Information")).not.toBeInTheDocument();

    selectBasicPlan();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Customer Information")).toBeInTheDocument();
  });

  it("handles plan deselection", async () => {
    render(<CheckoutPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    mockOnPlanSelected!(null);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No Plan Selected")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Please select a plan from our pricing page to proceed with checkout.",
      ),
    ).toBeInTheDocument();
  });
});
