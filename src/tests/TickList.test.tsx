import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import TickList from "@/app/components/TickList";

describe("TickList", () => {
  it("lists items with a drawn muted tick and an optional detail line", () => {
    render(
      <TickList
        items={[
          { label: "Business email", detail: "Communicate professionally" },
          { label: "Web hosting" },
        ]}
      />,
    );

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item).toHaveClass("before:border-muted");
    });
    expect(screen.getByText("Communicate professionally")).toHaveClass(
      "text-small",
      "text-muted",
    );
    // No detail line for the second item
    expect(items[1]).toHaveTextContent(/^Web hosting$/);
  });

  it("uses no green success ticks", () => {
    const { container } = render(<TickList items={[{ label: "A" }]} />);

    expect(container.innerHTML).not.toMatch(/success/);
  });
});
