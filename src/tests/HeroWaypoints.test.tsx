import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroWaypoints from "@/app/components/HeroWaypoints";

describe("HeroWaypoints", () => {
  it("lists one working day's four stops in order, with time and place", () => {
    render(<HeroWaypoints />);

    const stops = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(stops.map((stop) => stop.textContent)).toEqual([
      "06:40Job site",
      "09:15On the road",
      "13:30Client's office",
      "21:05Home",
    ]);
    expect(within(stops[0]).getByText("06:40")).toHaveClass(
      "font-mono",
      "text-h3",
      "text-ink",
    );
    expect(within(stops[0]).getByText("Job site")).toHaveClass(
      "font-mono",
      "uppercase",
      "text-muted",
    );
  });

  it("captions the day in the bottom-right corner", () => {
    render(<HeroWaypoints />);

    const caption = screen.getByText(
      "One working day · four offices · one IT team",
    );
    expect(caption).toHaveClass("absolute", "right-0", "bottom-0", "uppercase");
  });

  it("draws the route as a dashed accent line hidden from assistive tech", () => {
    const { container } = render(<HeroWaypoints />);

    const route = container.querySelector("svg");
    expect(route).toHaveAttribute("aria-hidden", "true");
    expect(route).toHaveClass("text-fig");
    const line = route?.querySelector("polyline");
    expect(line).toHaveAttribute("points", "18,16 72,30 34,60 82,80");
    expect(line).toHaveAttribute("stroke-dasharray", "6 6");
    expect(line).toHaveAttribute("vector-effect", "non-scaling-stroke");
  });
});
