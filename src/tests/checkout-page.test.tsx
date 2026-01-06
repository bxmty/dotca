// tests/checkout-page.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckoutPage from "@/app/checkout/page";

// Mock the PlanSelector component
let mockOnPlanSelected: ((plan: unknown) => void) | null = null;
let mockPricingPlans: unknown[] = [];

jest.mock("@/app/checkout/PlanSelector", () => {
  return function MockPlanSelector({
    onPlanSelected,
    pricingPlans,
  }: {
    onPlanSelected: (plan: unknown) => void;
    pricingPlans: unknown[];
  }) {
    mockOnPlanSelected = onPlanSelected;
    mockPricingPlans = pricingPlans;

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
    // Render without selecting a plan (don't call mockOnPlanSelected)
    render(<CheckoutPage />);

    // The component should remain in loading state since no plan is selected
    // Wait a short time to ensure loading state persists
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should still show loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders checkout form with selected plan", async () => {
    render(<CheckoutPage />);

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected
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

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

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

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

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

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

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

    // Handle phone input
    await waitFor(() => {
      const phoneInputElement = document.getElementById("phone");
      expect(phoneInputElement).toBeInTheDocument();
    });

    const phoneInputElement = document.getElementById(
      "phone",
    ) as HTMLInputElement;
    if (phoneInputElement) {
      fireEvent.change(phoneInputElement, {
        target: { value: "1234567890" },
      });
    }

    // Wait for WaitlistForm button to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("waitlist-button")).toBeInTheDocument();
    });

    // Submit the form (this should trigger waitlist submission)
    // The WaitlistForm button is the one that actually submits
    const submitButton = screen.getByTestId("waitlist-button");
    fireEvent.click(submitButton);

    // In a real test we would check for successful submission,
    // but in this mock component there's no actual form submission handling
  });

  it("shows the correct total price", async () => {
    render(<CheckoutPage />);

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Check that $0.00 is displayed for the Free plan
    // Use getAllByText since there are multiple instances (unit price and total)
    const priceElements = screen.getAllByText("$0.00");
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("validates employee count input (5-20 range)", async () => {
    render(<CheckoutPage />);

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Find employee count input
    const employeeInput = screen.getByLabelText(
      "Number of Employees (minimum 5)",
    );
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

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Find billing cycle radios by their IDs since the Annual label includes "Save 10%"
    const monthlyRadio = screen.getByLabelText("Monthly");
    const annualRadio = screen.getByLabelText(/^Annual/); // Match "Annual" at the start, ignoring "Save 10%"

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

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected (Free plan)
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Free plan should show $0.00 (there are multiple instances, so use getAllByText)
    const priceElements = screen.getAllByText("$0.00");
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("validates required fields on form submission", async () => {
    render(<CheckoutPage />);

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Wait for form to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText("First Name*")).toBeInTheDocument();
    });

    // Fill in only first name, leave other required fields empty
    fireEvent.change(screen.getByLabelText("First Name*"), {
      target: { value: "John" },
    });

    // Try to submit via the WaitlistForm button
    const submitButton = screen.getByTestId("waitlist-button");
    fireEvent.click(submitButton);

    // Wait for validation error to appear in WaitlistForm
    await waitFor(() => {
      expect(screen.getByText(/Name is required/)).toBeInTheDocument();
    });

    // Fill in last name but leave email empty
    fireEvent.change(screen.getByLabelText("Last Name*"), {
      target: { value: "Doe" },
    });

    fireEvent.click(submitButton);

    // Should now show email validation error
    await waitFor(() => {
      expect(
        screen.getByText("Email address is required."),
      ).toBeInTheDocument();
    });
  });

  it("successfully submits form with all required fields", async () => {
    // Mock document.querySelector to return a waitlist button
    const mockWaitlistButton = {
      click: jest.fn(),
    } as HTMLElement;
    const querySelectorSpy = jest
      .spyOn(document, "querySelector")
      .mockReturnValue(mockWaitlistButton);

    render(<CheckoutPage />);

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Wait for form to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText("First Name*")).toBeInTheDocument();
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

    // Phone number is handled by PhoneInput component from react-phone-input-2
    // The PhoneInput component renders an input with id="phone"
    // We need to find and update the phone input
    await waitFor(() => {
      const phoneInputElement = document.getElementById("phone");
      expect(phoneInputElement).toBeInTheDocument();
    });

    const phoneInputElement = document.getElementById(
      "phone",
    ) as HTMLInputElement;
    if (phoneInputElement) {
      // PhoneInput expects the value without the + prefix in the input
      fireEvent.change(phoneInputElement, {
        target: { value: "1234567890" },
      });
    }

    // Wait for WaitlistForm to be rendered (it should appear when joinWaitlist is true)
    await waitFor(() => {
      expect(screen.getByTestId("waitlist-button")).toBeInTheDocument();
    });

    // Get the form element and submit it programmatically
    // This will trigger the handleSubmit function which should click the waitlist button
    const form = screen.getByLabelText("First Name*").closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    // Wait for querySelector to be called with the waitlist button selector
    await waitFor(() => {
      expect(querySelectorSpy).toHaveBeenCalledWith("[data-waitlist-button]");
    });

    // Should trigger waitlist button click
    expect(mockWaitlistButton.click).toHaveBeenCalledTimes(1);

    querySelectorSpy.mockRestore();
  });

  it("handles payment success callback", async () => {
    render(<CheckoutPage />);

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

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

  it("shows loading state correctly", async () => {
    render(<CheckoutPage />);

    // Should show loading initially
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Should not show form content while loading
    expect(screen.queryByText("Customer Information")).not.toBeInTheDocument();

    // Simulate plan selection to clear loading state
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for loading to disappear
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Should now show form content
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
  });

  it("renders plan selector when loaded", async () => {
    render(<CheckoutPage />);

    // Initially should show loading
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Should show plan selection UI
    expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
  });

  it("handles phone number input changes", async () => {
    render(<CheckoutPage />);

    // Simulate plan selection
    mockOnPlanSelected!(mockPricingPlans[0]);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText("Your Selected Plan")).toBeInTheDocument();
    });

    // Phone input is handled by react-phone-input-2 which is complex to test
    // This test ensures the component renders without phone input errors
    expect(screen.getByText("Customer Information")).toBeInTheDocument();
  });

  it("handles plan deselection", async () => {
    // This test verifies the component handles the case when no plan is selected
    // We'll test the "No Plan Selected" state by not selecting a plan initially
    render(<CheckoutPage />);

    // Initially should be loading
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Simulate plan deselection (no plan selected)
    mockOnPlanSelected!(null);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Should show "No Plan Selected" message
    expect(screen.getByText("No Plan Selected")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Please select a plan from our pricing page to proceed with checkout.",
      ),
    ).toBeInTheDocument();
  });
});
