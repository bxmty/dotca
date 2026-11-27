import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FaqList from "@/app/components/FaqList";

const items = [
  { question: "Q1", answer: "A1" },
  { question: "Q2", answer: "A2" },
  { question: "Q3", answer: "A3" },
];

describe("FaqList", () => {
  it("renders each item as details/summary, all starting closed", () => {
    const { container } = render(<FaqList items={items} />);
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(3);
    details.forEach((item) => expect(item).not.toHaveAttribute("open"));
    expect(screen.getByText("Q2").closest("summary")).not.toBeNull();
    expect(screen.getByText("A2")).toHaveClass("text-muted");
  });

  it("opens items independently of each other", () => {
    const { container } = render(<FaqList items={items} />);
    const details = container.querySelectorAll("details");
    details[0].open = true;
    details[1].open = true;
    expect(details[0].open).toBe(true);
    expect(details[1].open).toBe(true);
    expect(details[2].open).toBe(false);
    expect(details[0]).not.toHaveAttribute("name");
  });
});
