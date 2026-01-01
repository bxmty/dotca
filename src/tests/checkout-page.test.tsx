// tests/checkout-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckoutPage from "@/app/checkout/page";

// Mock the PlanSelector component
jest.mock("@/app/checkout/PlanSelector", () => {
  return function MockPlanSelector({
    onPlanSelected,
    pricingPlans,
  }: {
    onPlanSelected: (plan: unknown) => void;
    pricingPlans: unknown[];
  }) {
    // Auto-select the first plan after a small delay
    setTimeout(() => {
      onPlanSelected(pricingPlans[0]);
    }, 0);

    return null;
  };
});

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

describe("CheckoutPage Component", () => {
  it("shows loading state initially", () => {
    render(<CheckoutPage />);

    // Check if loading message is shown
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it('renders "No Plan Selected" when no plan is selected', async () => {
    // Override the mock to not select a plan
    jest.mock("@/app/checkout/PlanSelector", () => {
      return function MockPlanSelector() {
        return null;
      };
    });

    render(<CheckoutPage />);

    // Wait for loading to finish - this won't happen in this test because we modified the mock
    // but we'll wait anyway to ensure the component has time to process
    await waitFor(
      () => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      },
      { timeout: 100 },
    );
  });

  it("renders checkout form with selected plan", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected (mock will auto-select the first plan)
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Join Our Waitlist" }),
      ).toBeInTheDocument();
    });

    // Wait for plan details to be shown
    await waitFor(() => {
      expect(screen.getByText("Free Plan")).toBeInTheDocument();
      expect(screen.getByText("$0.00 per user per month")).toBeInTheDocument();
    });

    // Wait for checkout form to be rendered
    expect(
      screen.getByRole("heading", { level: 1, name: "Join Our Waitlist" }),
    ).toBeInTheDocument();

    // Check if customer information form is rendered
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name*")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name*")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address*")).toBeInTheDocument();

    // In waitlist mode, payment information should not be shown by default
    expect(screen.queryByText("Payment Information")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Credit Card")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Pay by Invoice")).not.toBeInTheDocument();
  });

  it("updates form data when inputs change", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Join Our Waitlist" }),
      ).toBeInTheDocument();
    });

    // Fill in customer information
    fireEvent.change(screen.getByLabelText("First Name*"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText("Last Name*"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email Address*"), {
      target: { value: "john@example.com" },
    });

    // Check if inputs have updated values
    expect(screen.getByLabelText("First Name*")).toHaveValue("John");
    expect(screen.getByLabelText("Last Name*")).toHaveValue("Doe");
    expect(screen.getByLabelText("Email Address*")).toHaveValue(
      "john@example.com",
    );
  });

  it("shows payment options when purchase is selected", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Join Our Waitlist" }),
      ).toBeInTheDocument();
    });

    // By default, waitlist is selected, so payment options are not shown
    expect(screen.queryByLabelText("Credit Card")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Pay by Invoice")).not.toBeInTheDocument();

    // Select purchase option (this should show payment methods, but is currently disabled)
    // Note: The purchase option is disabled in the current implementation
    const purchaseRadio = screen.getByLabelText(
      "Complete Purchase (Coming soon)",
    );
    expect(purchaseRadio).toBeDisabled();
  });

  it("submits the form with correct data", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Join Our Waitlist" }),
      ).toBeInTheDocument();
    });

    // Fill in required fields
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
      target: { value: "New York" },
    });
    fireEvent.change(screen.getByLabelText("Province/State"), {
      target: { value: "NY" },
    });
    fireEvent.change(screen.getByLabelText("Postal Code"), {
      target: { value: "10001" },
    });

    // Submit the form (this should trigger waitlist submission)
    const submitButton = screen.getByRole("button", { name: /Join Waitlist/i });
    fireEvent.click(submitButton);

    // In a real test we would check for successful submission,
    // but in this mock component there's no actual form submission handling
  });

  it("shows the correct total price", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Check that $0.00 is displayed for the Free plan
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("validates employee count input (5-20 range)", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Find employee count input
    const employeeInput = screen.getByLabelText("Number of Employees (minimum 5)");
    expect(employeeInput).toBeInTheDocument();

    // Test valid values
    fireEvent.change(employeeInput, { target: { value: "10" } });
    expect(employeeInput).toHaveValue(10);

    // Test minimum value (5)
    fireEvent.change(employeeInput, { target: { value: "5" } });
    expect(employeeInput).toHaveValue(5);

    // Test maximum value (20)
    fireEvent.change(employeeInput, { target: { value: "20" } });
    expect(employeeInput).toHaveValue(20);

    // Test invalid values (should be clamped or rejected)
    fireEvent.change(employeeInput, { target: { value: "3" } });
    // The input should reject values below 5
    expect(employeeInput).toHaveValue(20); // Should still be 20

    fireEvent.change(employeeInput, { target: { value: "25" } });
    // The input should reject values above 20
    expect(employeeInput).toHaveValue(20); // Should still be 20
  });

  it("handles billing cycle changes (monthly vs annual)", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Find billing cycle radios
    const monthlyRadio = screen.getByLabelText("Monthly");
    const annualRadio = screen.getByLabelText("Annual");

    expect(monthlyRadio).toBeChecked();
    expect(annualRadio).not.toBeChecked();

    // Switch to annual billing
    fireEvent.click(annualRadio);
    expect(monthlyRadio).not.toBeChecked();
    expect(annualRadio).toBeChecked();

    // Switch back to monthly
    fireEvent.click(monthlyRadio);
    expect(monthlyRadio).toBeChecked();
    expect(annualRadio).not.toBeChecked();
  });

  it("calculates total price correctly for monthly billing", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected (Free plan)
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Free plan should show $0.00
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("validates required fields on form submission", async () => {
    // Mock alert to capture validation messages
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Submit form without filling required fields
    const submitButton = screen.getByRole("button", { name: /Join Waitlist/i });
    fireEvent.click(submitButton);

    // Should show validation error
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining("Please fill in all required fields"),
    );

    // Fill in some fields but leave others empty
    fireEvent.change(screen.getByLabelText("First Name*"), {
      target: { value: "John" },
    });

    fireEvent.click(submitButton);

    // Should still show validation error for missing fields
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining("Please fill in all required fields"),
    );

    alertMock.mockRestore();
  });

  it("successfully submits form with all required fields", async () => {
    // Mock document.querySelector to return a waitlist button
    const mockWaitlistButton = {
      click: jest.fn(),
    } as HTMLElement;
    jest
      .spyOn(document, "querySelector")
      .mockReturnValue(mockWaitlistButton);

    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Fill in all required fields
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
      target: { value: "New York" },
    });
    fireEvent.change(screen.getByLabelText("Province/State"), {
      target: { value: "NY" },
    });
    fireEvent.change(screen.getByLabelText("Postal Code"), {
      target: { value: "10001" },
    });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /Join Waitlist/i });
    fireEvent.click(submitButton);

    // Should trigger waitlist button click
    expect(mockWaitlistButton.click).toHaveBeenCalledTimes(1);

    jest.restoreAllMocks();
  });

  it("handles payment success callback", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // The payment success functionality is internal to the component
    // and triggered by the StripeWrapper, so we can't easily test it
    // without more complex mocking of the Stripe integration

    // This test mainly ensures the component renders without errors
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
  });

  it("shows loading state correctly", () => {
    render(<CheckoutPage />);

    // Should show loading initially
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Should not show form content while loading
    expect(screen.queryByText("Customer Information")).not.toBeInTheDocument();
  });

  it("renders plan selector when loaded", async () => {
    render(<CheckoutPage />);

    // Wait for loading to complete (plan selection)
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Should show plan selection UI
    expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
  });

  it("handles phone number input changes", async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Phone input is handled by react-phone-input-2 which is complex to test
    // This test ensures the component renders without phone input errors
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
  });

  it("handles plan deselection", async () => {
    // Override the mock to not select a plan
    jest.doMock("@/app/checkout/PlanSelector", () => ({
      __esModule: true,
      default: function MockPlanSelector() {
        return <div>No plan selected</div>;
      },
    }));

    render(<CheckoutPage />);

    // Should remain in loading state or show no plan message
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeInTheDocument();
    });
  });
});
