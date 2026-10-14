import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import RuledList from "@/app/components/RuledList";

describe("RuledList", () => {
  it("marks each row with a muted mono letter A, B, C", () => {
    render(
      <RuledList
        items={["A plain reason.", "No surprise line items.", "A free review."]}
      />,
    );

    const list = screen.getByRole("list");
    expect(list).toHaveClass("border-t", "border-rule");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    rows.forEach((row, index) => {
      expect(row).toHaveClass("border-b", "border-rule");
      const letter = within(row).getByText("ABC"[index]);
      expect(letter).toHaveClass("font-mono", "text-label", "text-muted");
    });
    expect(rows[1]).toHaveTextContent("No surprise line items.");
  });
});
