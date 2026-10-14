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
    const section = container.querySelector("section");
    expect(section?.querySelector("h1, p, a, span")).toBe(heading);
    expect(section?.textContent).toMatch(
      /^Technology Solutions That Fit Your Budget/,
    );
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
    render(<PageHero heading="Pricing" lead="Choose a package." />);

    const copy = screen.getByRole("heading", { level: 1 }).parentElement;
    expect(copy?.children).toHaveLength(2);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  describe("contour ground", () => {
    const renderGround = () => {
      const { container } = render(
        <PageHero heading="Pricing" lead="Choose a package." />,
      );
      const section = container.querySelector("section");
      const ground = section?.querySelector("svg");
      return { section, ground };
    };

    it("sits behind the copy as decoration hidden from assistive tech", () => {
      const { section, ground } = renderGround();

      expect(ground).toHaveAttribute("aria-hidden", "true");
      expect(ground).toHaveClass("absolute", "inset-0", "-z-10");
      expect(section).toHaveClass("relative", "isolate", "overflow-hidden");
      // Decision 7: the H1 is still the first text in the hero.
      expect(section?.textContent).toMatch(/^Pricing/);
    });

    it("is inline SVG cropped to cover the hero, with no image request", () => {
      const { section, ground } = renderGround();

      expect(ground).toHaveAttribute("viewBox", "0 0 1600 700");
      expect(ground).toHaveAttribute("preserveAspectRatio", "xMaxYMid slice");
      expect(section?.querySelector("img, image, use")).toBeNull();
    });

    it("draws index contours in the accent and the rest in the rule colour", () => {
      const { ground } = renderGround();
      const rings = Array.from(ground?.querySelectorAll("path") ?? []);
      const index = rings.filter((ring) => ring.classList.contains("text-fig"));
      const minor = rings.filter((ring) =>
        ring.classList.contains("text-rule"),
      );

      // 16 + 12 + 9 rings; index every fifth: 3 + 2 + 1.
      expect(rings).toHaveLength(37);
      expect(index).toHaveLength(6);
      expect(minor).toHaveLength(31);
      expect(index[0]).toHaveAttribute("stroke-width", "1.4");
      expect(minor[0]).toHaveAttribute("stroke-width", "0.8");
      for (const ring of rings) {
        expect(ring).toHaveAttribute("stroke", "currentColor");
        expect(ring).toHaveAttribute("fill", "none");
      }
    });

    it("fades out behind the copy and toward the bottom, dimmed below md", () => {
      const { ground } = renderGround();

      expect(ground).toHaveClass("max-md:opacity-35");
      expect(ground?.getAttribute("style")).toContain(
        "linear-gradient(to right, transparent 10%, black 60%), linear-gradient(to bottom, black 60%, transparent)",
      );
    });
  });

  describe("aside", () => {
    it("gives the hero no right half when there is no aside", () => {
      const { container } = render(
        <PageHero heading="Pricing" lead="Choose a package." />,
      );

      const section = container.querySelector("section");
      expect(section?.className).not.toMatch(/lg:grid-cols|lg:min-h/);
    });

    it("puts the aside in a right half from lg, after the copy", () => {
      const { container } = render(
        <PageHero
          heading="IT that just works"
          lead="One flat price."
          aside={<div data-testid="aside">Waypoints</div>}
        />,
      );

      const section = container.querySelector("section")!;
      const aside = screen.getByTestId("aside");
      const copy = screen.getByRole("heading", { level: 1 }).parentElement!;
      expect(section).toHaveClass(
        "lg:min-h-[640px]",
        "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
      );
      expect(copy.parentElement).toBe(section);
      expect(aside.parentElement?.parentElement).toBe(section);
      expect(
        copy.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      // Decision 7: the H1 is still the first text in the hero.
      expect(section.textContent).toMatch(/^IT that just works/);
    });

    it("hides the aside below lg, so callers needn't", () => {
      render(
        <PageHero
          heading="IT that just works"
          lead="One flat price."
          aside={<div data-testid="aside">Waypoints</div>}
        />,
      );

      // The wrapper is a grid from lg, so the aside fills the whole half.
      expect(screen.getByTestId("aside").parentElement).toHaveClass(
        "hidden",
        "lg:grid",
      );
    });
  });
});
