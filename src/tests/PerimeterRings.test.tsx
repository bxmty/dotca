import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import PerimeterRings from "@/app/security-assessment/PerimeterRings";

describe("PerimeterRings", () => {
  it("is decorative, hidden from assistive tech", () => {
    const { container } = render(<PerimeterRings />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("draws the four defence layers", () => {
    const { container } = render(<PerimeterRings />);

    const labels = Array.from(container.querySelectorAll("text")).map(
      (text) => text.textContent,
    );
    expect(labels).toEqual(["Devices", "Accounts", "Network", "People"]);
  });

  it("lights covered checkpoints in the order the sweep reaches them", () => {
    const { container } = render(<PerimeterRings />);

    const covered = Array.from(
      container.querySelectorAll<SVGRectElement>('rect[data-covered="true"]'),
    );
    const open = container.querySelectorAll('rect[data-covered="false"]');
    expect(covered.length).toBeGreaterThan(0);
    expect(open.length).toBeGreaterThan(0);

    const delays = covered.map((rect) => parseFloat(rect.style.animationDelay));
    delays.forEach((delay) => {
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(1.8);
    });
    open.forEach((rect) => {
      expect((rect as SVGRectElement).style.animationDelay).toBe("");
    });
  });
});
