// tests/page.test.tsx
import { render, screen } from "@testing-library/react";
// userEvent not used in this file
// import userEvent from '@testing-library/user-event';
import "@testing-library/jest-dom";
import Home from "@/app/page";

// Mock the Next.js components and hooks
jest.mock("next/link", () => {
  return function NextLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <a href={href} data-testid="next-link">
        {children}
      </a>
    );
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    fill?: boolean;
    style?: React.CSSProperties;
    quality?: number;
  }) => {
    // Convert boolean props to string
    const imgProps = { ...props };

    // Convert all boolean attributes to strings
    for (const [key, value] of Object.entries(imgProps)) {
      if (typeof value === "boolean") {
        imgProps[key] = value.toString();
      }
    }

    // eslint-disable-next-line @next/next/no-img-element
    return <img data-testid="next-image" {...imgProps} alt={props.alt || ""} />;
  },
}));

// Mock the ContactForm component
jest.mock("@/app/components/ContactForm", () => {
  return function MockContactForm({ className }: { className?: string }) {
    return (
      <div data-testid="contact-form" className={className}>
        Contact Form Mock
      </div>
    );
  };
});

describe("Boximity Landing Page", () => {
  // Test 1: Verify that the page renders critical elements
  it("renders essential landing page components", () => {
    render(<Home />);

    // Check for main heading
    expect(
      screen.getByText("Make Your Whole Team Tech-Savvy Without the Headache"),
    ).toBeInTheDocument();
  });

  // Test 2: Test navigation to pricing page
  it("has pricing link with correct href", () => {
    render(<Home />);

    // Check for "See Pricing Options" link
    const pricingLink = screen.getByRole("link", {
      name: "See Pricing Options",
    });
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  // Test 3: Test key component presence
  it("displays contact form and key sections", () => {
    render(<Home />);

    // Check for main heading
    expect(
      screen.getByText("Make Your Whole Team Tech-Savvy Without the Headache"),
    ).toBeInTheDocument();
  });
});
