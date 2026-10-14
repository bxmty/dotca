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

    const copy = Array.from(
      container.querySelector("section")?.children ?? [],
    ).filter((child) => child.getAttribute("aria-hidden") !== "true");
    expect(copy).toHaveLength(2);
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
      // Decision 7: the H1 is still the first thing in the hero.
      expect(section?.firstElementChild?.tagName).toBe("H1");
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
});
