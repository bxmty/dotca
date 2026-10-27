// Progress bar from the Component Spec: one segment per step under a 3 px
// top rule, ink for done steps and the accent for the current one. The
// segments are mono labels; "(done)" is spoken, not drawn, since the rule's
// colour carries it on screen.

type StepState = "done" | "now" | "todo";

function getStepState(step: number, currentStep: number): StepState {
  if (step < currentStep) return "done";
  return step === currentStep ? "now" : "todo";
}

type StepProgressProps = {
  steps: readonly string[];
  /** 1-based. */
  currentStep: number;
  /** When set, done and current steps become buttons so the visitor can jump. */
  onStepSelect?: (step: number) => void;
};

export default function StepProgress({
  steps,
  currentStep,
  onStepSelect,
}: StepProgressProps) {
  return (
    <nav aria-label={`Step ${currentStep} of ${steps.length}`}>
      <ol className="m-0 grid list-none auto-cols-fr grid-flow-col gap-1 p-0">
        {steps.map((title, index) => {
          const step = index + 1;
          const state = getStepState(step, currentStep);
          const canSelect =
            onStepSelect && state !== "todo" && step !== currentStep;
          const label = (
            <>
              {step} {title}
              {state === "done" && <span className="sr-only"> (done)</span>}
            </>
          );
          return (
            <li
              key={title}
              data-state={state}
              aria-current={state === "now" ? "step" : undefined}
              className="border-t-3 border-rule pt-1.5 font-mono text-label text-muted data-[state=done]:border-ink data-[state=done]:text-ink data-[state=now]:border-cta data-[state=now]:text-ink"
            >
              {canSelect ? (
                <button
                  type="button"
                  onClick={() => onStepSelect(step)}
                  className="m-0 cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit"
                >
                  {label}
                </button>
              ) : (
                label
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
