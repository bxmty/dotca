import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogCta from "@/app/components/BlogCta";

const ASSESSMENT_LABEL = "Get a Business-First IT Assessment";

describe("BlogCta", () => {
  it("links an omitted cta to the assessment booking page", () => {
    render(<BlogCta />);

    const link = screen.getByRole("link", { name: ASSESSMENT_LABEL });
    expect(link).toHaveAttribute("href", "/book");
  });

  it("links an assessment cta to the assessment booking page", () => {
    render(<BlogCta cta={{ type: "assessment" }} />);

    const link = screen.getByRole("link", { name: ASSESSMENT_LABEL });
    expect(link).toHaveAttribute("href", "/book");
  });

  it("renders a rule-topped end block with a heading", () => {
    render(<BlogCta />);

    const block = screen.getByRole("complementary", { name: "Next step" });
    expect(block).toHaveClass("border-t-2", "border-ink");
    expect(
      within(block).getByRole("heading", {
        name: "Want a second pair of eyes on your setup?",
      }),
    ).toBeInTheDocument();
  });

  it("renders nothing when the cta is suppressed", () => {
    const { container } = render(<BlogCta cta={{ type: "none" }} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("links a lead magnet cta to its resource page", () => {
    render(
      <BlogCta
        cta={{
          type: "lead-magnet",
          slug: "cyber-insurance-readiness-checklist",
        }}
      />,
    );

    const link = screen.getByRole("link", { name: "Download the guide" });
    expect(link).toHaveAttribute(
      "href",
      "/resources/cyber-insurance-readiness-checklist",
    );
  });
});
