// tests/ContactForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ContactForm from "@/app/components/ContactForm";

// Mock router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }),
) as jest.Mock;

describe("ContactForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates input values on change", async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    // Get form fields
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const phoneInput = screen.getByLabelText(/Phone/i);

    // Fill in the form
    await user.type(nameInput, "Test User");
    await user.type(emailInput, "test@example.com");
    await user.type(phoneInput, "123-456-7890");

    // Check input values (phone input is formatted by react-phone-input-2)
    expect(nameInput).toHaveValue("Test User");
    expect(emailInput).toHaveValue("test@example.com");
    // Phone input gets formatted, so we check that it contains the input digits
    expect(phoneInput).toHaveValue("+1 (123) 456-7890");
  });

  it("submits form data and shows success message", async () => {
    render(<ContactForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "123-456-7890" },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId("contact-submit-button"));

    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          phone: "+1234567890",
        }),
      });
    });

    // Check if success message is shown
    await waitFor(() => {
      expect(
        screen.getByText(
          "Thank you! Your consultation request has been submitted successfully.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when submission fails", async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: "Server configuration error - missing API key",
          }),
      }),
    );

    render(<ContactForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "123-456-7890" },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId("contact-submit-button"));

    // Check for specific error message that includes the server error
    await waitFor(() => {
      expect(
        screen.getByText(/Server configuration error - missing API key/),
      ).toBeInTheDocument();
    });
  });

  it("shows success message and does not redirect when API returns a message", async () => {
    // Mock fetch to return success with a message
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message:
              "Your information has already been submitted. We will contact you soon.",
          }),
      }),
    );

    render(<ContactForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "123-456-7890" },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId("contact-submit-button"));

    // Check for success message
    await waitFor(() => {
      expect(
        screen.getByText(
          "Your information has already been submitted. We will contact you soon.",
        ),
      ).toBeInTheDocument();
    });

    // Router.push should not have been called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables the submit button while submitting", async () => {
    // Mock fetch to take some time
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true }),
            });
          }, 100);
        }),
    );

    render(<ContactForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "123-456-7890" },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId("contact-submit-button"));

    // Check if button is disabled and shows loading text
    expect(screen.getByTestId("contact-submit-button")).toBeDisabled();
    expect(screen.getByText("Submitting...")).toBeInTheDocument();
  });
});
