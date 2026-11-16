import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import RuledGrid from "@/app/components/RuledGrid";

describe("RuledGrid", () => {
  it("renders each item as a ruled cell with an h3 and muted body", () => {
    render(
      <RuledGrid
        items={[
          { title: "Security threats", body: "Bad actors are targeting you." },
          { title: "Wasted time", body: "Hours spent troubleshooting." },
        ]}
      />,
    );

    const list = screen.getByRole("list");
    expect(list).toHaveClass("border-t", "border-rule");
    const cells = within(list).getAllByRole("listitem");
    expect(cells).toHaveLength(2);
    expect(
      within(cells[0]).getByRole("heading", {
        level: 3,
        name: "Security threats",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hours spent troubleshooting.")).toHaveClass(
      "text-muted",
    );
  });

  it("shows a muted mono kicker only when one is given", () => {
    render(
      <RuledGrid
        items={[
          { kicker: "Accounting", title: "Month-end", body: "Close faster." },
          { title: "Payroll", body: "Paid on time." },
        ]}
      />,
    );

    expect(screen.getByText("Accounting")).toHaveClass(
      "font-mono",
      "text-label",
      "text-muted",
    );
    const [, second] = screen.getAllByRole("listitem");
    // Heading and body only
    expect(second.children).toHaveLength(2);
  });

  it("uses no card shadows or icon discs", () => {
    const { container } = render(
      <RuledGrid items={[{ title: "A", body: "B" }]} />,
    );

    expect(container.innerHTML).not.toMatch(/shadow|rounded-full|card/);
  });
});
