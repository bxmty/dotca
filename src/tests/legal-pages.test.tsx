import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PrivacyPolicy from "@/app/privacy-policy/page";
import TermsOfService from "@/app/terms-of-service/page";

// The legal pages use the post typography without the dek or the end CTA.

describe.each([
  ["privacy policy", PrivacyPolicy, "Privacy Policy"],
  ["terms of service", TermsOfService, /Terms and Conditions/],
] as const)("%s", (_name, Page, title) => {
  it("renders inside the .prose scope", () => {
    render(<Page />);

    const heading = screen.getByRole("heading", { level: 1, name: title });
    expect(heading.closest(".prose")).not.toBeNull();
  });

  it("has no dek and no end CTA", () => {
    const { container } = render(<Page />);

    expect(container.querySelector(".dek")).toBeNull();
    expect(
      screen.queryByRole("link", { name: /assessment/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/book"]')).toBeNull();
  });

  it("carries no Bootstrap classes", () => {
    const { container } = render(<Page />);

    const classNames = Array.from(
      container.querySelectorAll("[class]"),
    ).flatMap((element) => Array.from(element.classList));
    const bootstrapClasses = classNames.filter((name) =>
      /^(container|row|col(-.*)?|mb-\d|h[1-6]|small|alert(-.*)?)$/.test(name),
    );

    expect(bootstrapClasses).toEqual([]);
  });
});

describe("terms of service notice", () => {
  it("renders the B2B notice as a pale-purple callout", () => {
    render(<TermsOfService />);

    const notice = screen.getByText(/IMPORTANT NOTICE:/).closest(".callout");
    expect(notice).toHaveClass("hl");
  });
});
