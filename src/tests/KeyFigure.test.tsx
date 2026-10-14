import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import KeyFigure, { KeyFigureGrid } from "@/app/components/KeyFigure";

describe("KeyFigure", () => {
  it("renders the source line when a source is given", () => {
    render(
      <KeyFigure
        value="22%"
        label="productivity lost to technology issues"
        source="Example Survey 2025"
      />,
    );

    expect(screen.getByText("Source: Example Survey 2025")).toHaveClass(
      "font-mono",
      "text-label",
    );
  });

  it("omits the source line, with no empty element, when there is none", () => {
    const { container } = render(
      <KeyFigure value="$108,000" label="average small-business breach cost" />,
    );

    expect(screen.queryByText(/Source/)).not.toBeInTheDocument();
    // The value and the label, nothing else
    expect(container.firstElementChild?.children).toHaveLength(2);
  });

  it("sets the number in mono accent, with qualifier and unit words in sans", () => {
    render(
      <KeyFigure
        prefix="Up to"
        value="2"
        unit="weeks"
        label="of downtime after a cyber incident"
      />,
    );

    const number = screen.getByText("2");
    expect(number).toHaveClass("font-mono", "text-h2", "text-fig");
    expect(screen.getByText("Up to")).toHaveClass("font-sans", "text-muted");
    expect(screen.getByText("weeks")).toHaveClass("font-sans", "text-muted");
    expect(screen.getByText("of downtime after a cyber incident")).toHaveClass(
      "text-muted",
    );
  });
});

describe("KeyFigureGrid", () => {
  it("renders every figure as a cell of one ruled grid", () => {
    render(
      <KeyFigureGrid
        figures={[
          { value: "2", unit: "weeks", label: "of downtime" },
          { value: "22%", label: "productivity lost", source: "A survey" },
          { value: "$108,000", label: "breach cost" },
        ]}
      />,
    );

    const list = screen.getByRole("list");
    expect(list).toHaveClass("border", "border-rule", "bg-cell");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getAllByText(/^Source:/)).toHaveLength(1);
  });
});
