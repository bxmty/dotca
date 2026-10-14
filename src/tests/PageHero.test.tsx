import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PageHero from "@/app/components/PageHero";

describe("PageHero", () => {
  it("leads with the page's h1, then the muted lead", () => {
    const { container } = render(
      <PageHero
        heading="Technology Solutions That Fit Your Budget"
        lead="Enterprise-grade technology solutions."
      />,
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Technology Solutions That Fit Your Budget",
    });
    // Decision 7: the H1 is the first text in the hero (the LCP element).
    expect(container.querySelector("section")?.firstElementChild).toBe(heading);
    expect(heading).toHaveClass(
      "font-light",
      "text-section",
      "md:text-display",
    );
    expect(
      screen.getByText("Enterprise-grade technology solutions."),
    ).toHaveClass("text-h3", "text-muted");
  });

  it("renders the actions and the fact line when given", () => {
    render(
      <PageHero
        heading="IT that just works"
        lead="One flat price."
        actions={<a href="/pricing">See Pricing Options</a>}
        facts={
          <>
            <span>$99 per month</span>
            <span>Toronto Ontario, Canada</span>
          </>
        }
      />,
    );

    expect(
      screen.getByRole("link", { name: "See Pricing Options" }),
    ).toBeInTheDocument();
    const factLine = screen.getByText("$99 per month").parentElement;
    expect(factLine).toHaveClass("font-mono", "border-t", "border-rule");
    expect(factLine).toHaveTextContent("Toronto Ontario, Canada");
  });

  it("renders only the heading and lead when actions and facts are omitted", () => {
    const { container } = render(
      <PageHero heading="Pricing" lead="Choose a package." />,
    );

    expect(container.querySelector("section")?.children).toHaveLength(2);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
