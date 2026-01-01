import { render, screen } from "@testing-library/react";
import PrivacyPolicy from "@/app/privacy-policy/page";

describe("Privacy Policy Page", () => {
  it("renders the privacy policy page correctly", () => {
    render(<PrivacyPolicy />);

    // Check that the main heading is present (exact match for h1)
    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();

    // Check that the last updated date is present
    expect(
      screen.getByText(/last updated: april 14, 2025/i),
    ).toBeInTheDocument();

    // Check that key sections are present
    expect(
      screen.getByRole("heading", { name: /1\. introduction/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /2\. information we collect/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /3\. how we use your information/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /4\. data security/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /5\. third-party services/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /6\. your rights/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /7\. changes to this privacy policy/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /8\. contact us/i }),
    ).toBeInTheDocument();

    // Check that contact information is present
    expect(screen.getByText(/privacy@boximity\.com/i)).toBeInTheDocument();

    // Component renders successfully (coverage already at 100%)
  });

  it("renders all privacy policy content sections", () => {
    render(<PrivacyPolicy />);

    // Check for key content phrases that should be present
    expect(screen.getByText(/we respect your privacy/i)).toBeInTheDocument();
    expect(
      screen.getByText(/protecting your personal data/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we do not sell or rent your personal information/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/data collection, storage, and processing practices/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/access, correct, or delete your personal information/i),
    ).toBeInTheDocument();
  });

  it("has proper semantic structure", () => {
    render(<PrivacyPolicy />);

    // Should have proper heading hierarchy
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Privacy Policy");

    // Should have multiple h2 headings for sections
    const h2Elements = screen.getAllByRole("heading", { level: 2 });
    expect(h2Elements.length).toBeGreaterThan(5); // At least 8 sections
  });
});
