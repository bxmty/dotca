import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SectionHead from "@/app/components/SectionHead";

describe("SectionHead", () => {
  it("is an h2 under a 2 px ink rule with an optional muted lede", () => {
    render(<SectionHead title="The Reactive IT Trap" lede="Too often." />);

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "The Reactive IT Trap",
    });
    expect(heading).toHaveClass("font-light", "text-h2", "md:text-section");
    expect(heading.parentElement).toHaveClass("border-t-2", "border-ink");
    expect(screen.getByText("Too often.")).toHaveClass(
      "text-prose",
      "text-muted",
    );
  });

  it("renders no lede element without a lede", () => {
    render(<SectionHead title="Our Guarantees" />);

    expect(
      screen.getByRole("heading", { name: "Our Guarantees" }).parentElement
        ?.children,
    ).toHaveLength(1);
  });
});
