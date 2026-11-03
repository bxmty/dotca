import type { ReactNode, Ref } from "react";
import DotGridPanel from "./DotGridPanel";

// Questions run to two or three lines; a step down on phones keeps the
// answers in the first screen
const QUESTION_HEADING_CLASS_NAME =
  "m-0 text-h3 leading-snug font-semibold outline-none md:text-h2 md:leading-tight";

/** Which category a question is in, and how far through the questions it is. */
export function QuestionProgressPanel({
  categoryLabel,
  position,
  total,
}: {
  categoryLabel: string;
  position: number;
  total: number;
}) {
  return (
    <DotGridPanel className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 px-4 pt-3.5 pb-3 font-mono text-label tracking-[.06em] text-muted uppercase">
      <span>{categoryLabel}</span>
      <span className="text-ink tabular-nums">
        {`Question ${position} of ${total}`}
      </span>
    </DotGridPanel>
  );
}

/** The question as a prospect sees it, in the public quiz and the presenter. */
export default function QuestionHeader({
  categoryLabel,
  position,
  total,
  headingId,
  headingRef,
  children,
}: {
  categoryLabel: string;
  position: number;
  total: number;
  headingId: string;
  headingRef: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4">
      <QuestionProgressPanel
        categoryLabel={categoryLabel}
        position={position}
        total={total}
      />
      <h1
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className={QUESTION_HEADING_CLASS_NAME}
      >
        {children}
      </h1>
    </div>
  );
}
