// tests/onboarding-page.test.tsx
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import OnboardingPage from "@/app/onboarding/page";

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

function fillCompanyStep() {
  fireEvent.change(screen.getByLabelText(/Company Name/i), {
    target: { value: "Test Company" },
  });
  fireEvent.change(screen.getByLabelText(/Industry/i), {
    target: { value: "Technology" },
  });
  fireEvent.change(screen.getByLabelText(/Number of Employees/i), {
    target: { value: "11-25" },
  });
}

function fillContactStep() {
  fireEvent.change(screen.getByLabelText(/Contact Name/i), {
    target: { value: "John Doe" },
  });
  fireEvent.change(screen.getByLabelText(/Email/i), {
    target: { value: "john@example.com" },
  });
  fireEvent.change(
    document.getElementById("contactPhone") as HTMLInputElement,
    { target: { value: "12895550142" } },
  );
  fireEvent.change(screen.getByLabelText(/Address/i), {
    target: { value: "123 Main St" },
  });
  fireEvent.change(screen.getByLabelText(/City/i), {
    target: { value: "Toronto" },
  });
  fireEvent.change(screen.getByLabelText(/Province\/State/i), {
    target: { value: "ON" },
  });
  fireEvent.change(screen.getByLabelText(/Postal Code/i), {
    target: { value: "M5V 1A1" },
  });
}

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /Next/i }));
}

/** Fills the two required steps and lands on step 3. */
function goToItEnvironmentStep() {
  fillCompanyStep();
  clickNext();
  fillContactStep();
  clickNext();
}

function getCurrentProgressStep() {
  return within(screen.getByRole("navigation", { name: /^Step/ }))
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step");
}

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

    fillCompanyStep();
    clickNext();

    // Check if step 2 title is rendered
    expect(screen.getByText("Contact Details")).toBeInTheDocument();

    // Check if step 2 form fields are rendered
    expect(screen.getByLabelText(/Contact Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Province\/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Postal Code/i)).toBeInTheDocument();

    // Check if Back and Next buttons are rendered
    expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });

  it("navigates to step 3 and back", async () => {
    render(<OnboardingPage />);

    goToItEnvironmentStep();

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
      "11-25",
    );

    // Navigate to step 2
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Fill in step 2 form
    await user.type(screen.getByLabelText(/Contact Name/i), "John Doe");
    await user.type(screen.getByLabelText(/Email/i), "john@example.com");
    fireEvent.change(
      document.getElementById("contactPhone") as HTMLInputElement,
      { target: { value: "12345678901" } },
    );
    await user.type(screen.getByLabelText(/Address/i), "123 Main St");
    await user.type(screen.getByLabelText(/City/i), "Toronto");
    await user.type(screen.getByLabelText(/Province\/State/i), "ON");
    await user.type(screen.getByLabelText(/Postal Code/i), "M5V 1A1");

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

  it("submits form data and shows the success screen", async () => {
    render(<OnboardingPage />);

    goToItEnvironmentStep();

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    );

    // Wait for fetch and the success screen
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/onboarding",
        expect.any(Object),
      );
      expect(screen.getByText("Onboarding Complete")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("link", { name: /Return to Home/i }),
    ).toHaveAttribute("href", "/");
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

    goToItEnvironmentStep();

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
        status: 400,
        json: () => Promise.resolve({ error: "Failed to submit" }),
      }),
    );

    render(<OnboardingPage />);

    goToItEnvironmentStep();

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    );

    // The API error is shown to the user and the form stays on step 3
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to submit\. Please try again\./i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("IT Environment")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Complete Onboarding/i }),
    ).not.toBeDisabled();

    // Restore console.error
    console.error = originalConsoleError;
  });

  it("shows the current step on the progress bar", () => {
    render(<OnboardingPage />);

    expect(
      screen.getByRole("navigation", { name: "Step 1 of 3" }),
    ).toBeInTheDocument();
    expect(getCurrentProgressStep()).toHaveTextContent("1 Company");

    fillCompanyStep();
    clickNext();
    expect(
      screen.getByRole("navigation", { name: "Step 2 of 3" }),
    ).toBeInTheDocument();
    expect(getCurrentProgressStep()).toHaveTextContent("2 Contact");

    fillContactStep();
    clickNext();
    expect(getCurrentProgressStep()).toHaveTextContent("3 IT environment");

    fireEvent.click(screen.getByRole("button", { name: /Back/i }));
    expect(getCurrentProgressStep()).toHaveTextContent("2 Contact");
  });

  it("keeps an incomplete step open with an inline error on each empty field", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<OnboardingPage />);

    clickNext();

    expect(screen.getByText("Company Information")).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Name/i)).toHaveAccessibleDescription(
      "Fix: enter your company name",
    );
    expect(screen.getByLabelText(/Industry/i)).toHaveAccessibleDescription(
      "Fix: enter your industry",
    );
    expect(
      screen.getByLabelText(/Number of Employees/i),
    ).toHaveAccessibleDescription("Fix: choose your team size");
    expect(screen.getByLabelText(/Company Name/i)).toHaveFocus();
    expect(alertSpy).not.toHaveBeenCalled();

    // Editing a field clears its error
    fireEvent.change(screen.getByLabelText(/Industry/i), {
      target: { value: "Technology" },
    });
    expect(screen.getByLabelText(/Industry/i)).not.toHaveAttribute(
      "aria-invalid",
    );

    alertSpy.mockRestore();
  });

  it("checks the contact step the way the onboarding API does", () => {
    render(<OnboardingPage />);

    fillCompanyStep();
    clickNext();
    fillContactStep();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@" },
    });
    fireEvent.change(
      document.getElementById("contactPhone") as HTMLInputElement,
      { target: { value: "1289" } },
    );
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: "" },
    });
    clickNext();

    expect(screen.getByText("Contact Details")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toHaveAccessibleDescription(
      "Fix: enter the full address, like dana@company.ca",
    );
    expect(document.getElementById("contactPhone")).toHaveAccessibleDescription(
      "Fix: enter a phone number with at least 10 digits",
    );
    expect(screen.getByLabelText(/City/i)).toHaveAccessibleDescription(
      "Fix: enter your city",
    );
    expect(screen.getByLabelText(/Contact Name/i)).not.toHaveAttribute(
      "aria-invalid",
    );
    expect(screen.getByLabelText(/Email/i)).toHaveFocus();
  });

  it("marks the IT environment questions optional", () => {
    render(<OnboardingPage />);

    goToItEnvironmentStep();

    expect(screen.getAllByText("optional")).toHaveLength(4);
  });
});
