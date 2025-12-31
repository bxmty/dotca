import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WaitlistForm from "../app/components/WaitlistForm";
import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe("WaitlistForm Component", () => {
  const mockCustomerInfo = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    company: "Test Company",
    phone: "555-123-4567",
    address: "123 Test St",
    city: "Testville",
    state: "TS",
    zip: "12345",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it("renders the waitlist form correctly", () => {
    render(
      <WaitlistForm
        planName="Basic"
        billingCycle="monthly"
        employeeCount={5}
        customerInfo={mockCustomerInfo}
      />,
    );

    expect(screen.getByText("Join Our Waitlist")).toBeInTheDocument();
    expect(screen.getByText(/Selected plan:/)).toBeInTheDocument();
    expect(screen.getByText(/Basic/)).toBeInTheDocument();
    expect(screen.getByText(/Billing cycle:/)).toBeInTheDocument();
    expect(screen.getByText(/Team size:/)).toBeInTheDocument();
    expect(screen.getByTestId("waitlist-button")).toBeInTheDocument();

    // Check for dark styling elements
    const bgDarkElement = document.querySelector(".bg-dark");
    expect(bgDarkElement).toBeInTheDocument();
  });

  it("submits the form and shows success message", async () => {
    render(
      <WaitlistForm
        planName="Basic"
        billingCycle="monthly"
        employeeCount={5}
        customerInfo={mockCustomerInfo}
      />,
    );

    // Submit by clicking the button
    fireEvent.click(screen.getByTestId("waitlist-button"));

    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          phone: "555-123-4567",
          company: "Test Company",
          address: "123 Test St",
          city: "Testville",
          state: "TS",
          zip: "12345",
          planName: "Basic",
          billingCycle: "monthly",
          employeeCount: 5,
          isWaitlist: true,
        }),
      });
    });

    // Check for success message
    await waitFor(() => {
      expect(
        screen.getByText(/Thank you! You have been added to our waitlist/),
      ).toBeInTheDocument();
    });
  });

  it("handles API errors correctly", async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Test error" }),
    });

    render(
      <WaitlistForm
        planName="Basic"
        billingCycle="monthly"
        employeeCount={5}
        customerInfo={mockCustomerInfo}
      />,
    );

    // Submit the form
    fireEvent.click(screen.getByTestId("waitlist-button"));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
    });
  });
});
