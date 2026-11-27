import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import StepProgress from "@/app/components/StepProgress";

const STEPS = ["Company", "Contact", "IT environment"];

function getItems() {
  return within(screen.getByRole("list")).getAllByRole("listitem");
}

describe("StepProgress", () => {
  it("draws one numbered segment per step", () => {
    render(<StepProgress steps={STEPS} currentStep={1} />);

    expect(getItems().map((item) => item.textContent)).toEqual([
      expect.stringContaining("1 Company"),
      expect.stringContaining("2 Contact"),
      expect.stringContaining("3 IT environment"),
    ]);
  });

  it.each([1, 2, 3])("marks step %i as the current one", (currentStep) => {
    render(<StepProgress steps={STEPS} currentStep={currentStep} />);

    const items = getItems();
    items.forEach((item, index) => {
      const step = index + 1;
      if (step === currentStep) {
        expect(item).toHaveAttribute("aria-current", "step");
      } else {
        expect(item).not.toHaveAttribute("aria-current");
      }
      expect(item).toHaveAttribute(
        "data-state",
        step < currentStep ? "done" : step === currentStep ? "now" : "todo",
      );
    });
  });

  it("tells assistive tech which steps are done", () => {
    render(<StepProgress steps={STEPS} currentStep={3} />);

    const [first, second, third] = getItems();
    expect(first).toHaveTextContent("1 Company (done)");
    expect(second).toHaveTextContent("2 Contact (done)");
    expect(third).not.toHaveTextContent("(done)");
  });

  it("fills the current segment partway when given a fraction", () => {
    render(
      <StepProgress steps={STEPS} currentStep={2} currentStepFraction={0.5} />,
    );

    const fills = screen.getAllByTestId("step-fill");
    expect(fills).toHaveLength(1);
    expect(getItems()[1]).toContainElement(fills[0]);
    expect(fills[0]).toHaveStyle({ width: "50%" });
  });

  it("clamps the fill to the segment", () => {
    render(
      <StepProgress steps={STEPS} currentStep={1} currentStepFraction={1.4} />,
    );

    expect(screen.getByTestId("step-fill")).toHaveStyle({ width: "100%" });
  });

  it("draws no partial fill without a fraction", () => {
    render(<StepProgress steps={STEPS} currentStep={2} />);

    expect(screen.queryByTestId("step-fill")).not.toBeInTheDocument();
  });

  it("names the progress for the current step", () => {
    render(<StepProgress steps={STEPS} currentStep={2} />);

    expect(
      screen.getByRole("navigation", { name: "Step 2 of 3" }),
    ).toBeInTheDocument();
  });
});
