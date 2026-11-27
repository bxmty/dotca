import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import Steps from "@/app/components/Steps";

describe("Steps", () => {
  it("numbers the steps 01-03 in mono ink on a rule", () => {
    render(
      <Steps
        steps={[
          { title: "Share your team", body: "A contact list." },
          { title: "Review your spend", body: "Last year's spend." },
          { title: "Simple setup", body: "We email instructions." },
        ]}
      />,
    );

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);

    ["01", "02", "03"].forEach((numeral, index) => {
      const marker = within(items[index]).getByText(numeral);
      expect(marker).toHaveClass(
        "font-mono",
        "text-h2",
        "text-ink",
        "border-b",
        "border-rule",
      );
      // The <ol> already announces the position
      expect(marker).toHaveAttribute("aria-hidden", "true");
    });

    expect(
      within(items[2]).getByRole("heading", { level: 3, name: "Simple setup" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last year's spend.")).toHaveClass("text-muted");
  });
});
