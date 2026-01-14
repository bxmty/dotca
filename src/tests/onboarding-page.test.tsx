// tests/onboarding-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import OnboardingPage from "@/app/onboarding/page";

// Mock useRouter
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
  }) => {
    return <img {...props} alt={props.alt || ""} />;
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }),
) as jest.Mock;

describe("OnboardingPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the initial step with company information form", () => {
    render(<OnboardingPage />);

    // Check if the page title is rendered
    expect(screen.getByText("Company Information")).toBeInTheDocument();

    // Check if step 1 form fields are rendered
    expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Employees/i)).toBeInTheDocument();

    // Check if Next button is rendered
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });

  it("navigates to step 2 when Next button is clicked", async () => {
    render(<OnboardingPage />);

    // Click the Next button
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Check if step 2 title is rendered
    expect(screen.getByText("Contact Details")).toBeInTheDocument();

    // Check if step 2 form fields are rendered
    expect(screen.getByLabelText(/Contact Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ZIP Code/i)).toBeInTheDocument();

    // Check if Back and Next buttons are rendered
    expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });

  it("navigates to step 3 and back", async () => {
    render(<OnboardingPage />);

    // Navigate to step 2
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Navigate to step 3
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Check if step 3 title is rendered
    expect(screen.getByText("IT Environment")).toBeInTheDocument();

    // Check if step 3 form fields are rendered
    expect(
      screen.getByLabelText(/Current IT Providers\/Services/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Key Software\/Applications Used/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Current IT Pain Points/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/IT Goals for Next 12 Months/i),
    ).toBeInTheDocument();

    // Check if Back and Complete buttons are rendered
    expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    ).toBeInTheDocument();

    // Navigate back to step 2
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));

    // Check if step 2 title is rendered
    expect(screen.getByText("Contact Details")).toBeInTheDocument();
  });

  it("updates form data when fields are changed", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    // Fill in step 1 form
    await user.type(screen.getByLabelText(/Company Name/i), "Test Company");
    await user.type(screen.getByLabelText(/Industry/i), "Technology");
    await user.selectOptions(
      screen.getByLabelText(/Number of Employees/i),
      "11-50",
    );

    // Navigate to step 2
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Fill in step 2 form
    await user.type(screen.getByLabelText(/Contact Name/i), "John Doe");
    await user.type(screen.getByLabelText(/Email/i), "john@example.com");
    await user.type(screen.getByLabelText(/Phone Number/i), "123-456-7890");

    // Navigate to step 3
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Fill in step 3 form
    await user.type(
      screen.getByLabelText(/Current IT Providers\/Services/i),
      "Current provider",
    );
    await user.type(
      screen.getByLabelText(/Key Software\/Applications Used/i),
      "Software 1, Software 2",
    );

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    );

    // Wait for fetch to be called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: expect.stringContaining("Test Company"),
      });
    });
  });

  it("submits form data and redirects on success", async () => {
    render(<OnboardingPage />);

    // Navigate to step 3
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    );

    // Wait for fetch and redirect
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/onboarding",
        expect.any(Object),
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows loading state while submitting", async () => {
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

    render(<OnboardingPage />);

    // Navigate to step 3
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    );

    // Check if button shows submitting state
    expect(screen.getByText("Submitting...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submitting.../i }),
    ).toBeDisabled();
  });

  it("handles submission error", async () => {
    // Mock console.error to avoid polluting test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Failed to submit" }),
      }),
    );

    render(<OnboardingPage />);

    // Navigate to step 3
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    );

    // Wait for error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    // Restore console.error
    console.error = originalConsoleError;
  });
});
