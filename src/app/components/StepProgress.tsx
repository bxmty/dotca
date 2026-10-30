// Progress bar from the Component Spec: one segment per step under a 3 px
// top rule, ink for done steps and the accent for the current one. The
// segments are mono labels; "(done)" is spoken, not drawn, since the rule's
// colour carries it on screen. With `currentStepFraction`, the current
// segment's rule fills partway in the accent and grows as the visitor moves
// through the step (350 ms, none under reduced motion).

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
  /**
   * How far through the current step the visitor is, 0 to 1. When set, the
   * current segment's rule fills to that width instead of all at once.
   */
  currentStepFraction?: number;
};

export default function StepProgress({
  steps,
  currentStep,
  onStepSelect,
  currentStepFraction,
}: StepProgressProps) {
  const hasPartialFill = currentStepFraction !== undefined;
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
              className={`relative border-t-3 border-rule pt-1.5 font-mono text-label text-muted data-[state=done]:border-ink data-[state=done]:text-ink data-[state=now]:text-ink${hasPartialFill ? "" : " data-[state=now]:border-cta"}`}
            >
              {hasPartialFill && state === "now" && (
                <span
                  aria-hidden="true"
                  data-testid="step-fill"
                  className="absolute -top-[3px] left-0 h-[3px] bg-cta transition-[width] duration-350 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${Math.min(1, Math.max(0, currentStepFraction)) * 100}%`,
                  }}
                />
              )}
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
