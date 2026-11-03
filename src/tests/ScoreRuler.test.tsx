import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScoreRuler from "@/app/security-assessment/ScoreRuler";

const TIER_LABELS = {
  exposed: "Exposed",
  reactive: "Reactive",
  managed: "Managed",
  resilient: "Resilient",
};

const SMALL_TEAM_THRESHOLDS = { reactive: 12, managed: 22, resilient: 29 };

function renderManagedScore() {
  return render(
    <ScoreRuler
      score={24}
      maxScore={33}
      thresholds={SMALL_TEAM_THRESHOLDS}
      tier="managed"
      tierLabels={TIER_LABELS}
    />,
  );
}

function mockReducedMotion(isReduced: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: isReduced && query.includes("reduce"),
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

describe("ScoreRuler", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it("exposes the score as one meter with its tier", () => {
    renderManagedScore();

    const meter = screen.getByRole("meter", { name: "Score" });
    expect(meter).toHaveAttribute("aria-valuenow", "24");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "33");
    expect(meter).toHaveAttribute("aria-valuetext", "24 of 33, Managed");
  });

  it("lights one tick per point scored", () => {
    const { container } = renderManagedScore();

    expect(container.querySelectorAll('line[data-lit="true"]')).toHaveLength(
      24,
    );
    expect(container.querySelectorAll('line[data-lit="false"]')).toHaveLength(
      10,
    );
  });

  it("highlights the band of the tier reached", () => {
    renderManagedScore();

    const band = screen.getByTestId("hit-band");
    expect(band.style.left).toMatch(/^66\.66/);
    expect(band.style.width).toMatch(/^21\.21/);
    expect(screen.getByText("Managed")).toHaveClass("text-ink");
    expect(screen.getByText("Exposed")).not.toHaveClass("text-ink");
  });

  it("labels the major ticks every 5 points on short scales", () => {
    // The counting figure would otherwise also read "0"
    mockReducedMotion(true);
    renderManagedScore();

    ["0", "5", "10", "15", "20", "25", "30"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.queryByText("35")).not.toBeInTheDocument();
  });

  it("labels every 10 points on the long growing scale", () => {
    render(
      <ScoreRuler
        score={40}
        maxScore={54}
        thresholds={{ reactive: 20, managed: 36, resilient: 48 }}
        tier="managed"
        tierLabels={TIER_LABELS}
      />,
    );

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.queryByText("45")).not.toBeInTheDocument();
  });

  it("counts the figure up to the score", () => {
    mockReducedMotion(false);
    renderManagedScore();

    const figure = screen.getByText("/ 33 points").previousElementSibling;
    expect(figure).toHaveTextContent("0");

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(figure).toHaveTextContent("24");
  });

  it("shows the final score straight away under reduced motion", () => {
    mockReducedMotion(true);
    renderManagedScore();

    const figure = screen.getByText("/ 33 points").previousElementSibling;
    expect(figure).toHaveTextContent("24");
  });
});
