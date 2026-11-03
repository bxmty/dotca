import type { Ref } from "react";
import RuledGrid from "@/app/components/RuledGrid";
import DotGridPanel from "./DotGridPanel";
import type { QuizResultView } from "./quizResultView";
import ScoreRuler from "./ScoreRuler";

/**
 * Tier, score and weak areas: what every audience of a result sees. What comes
 * next (a CTA, or an SDR's next step) is up to the caller.
 */
export default function QuizResultSummary({
  view,
  headingId,
  headingRef,
  headingClassName,
}: {
  view: QuizResultView;
  headingId: string;
  headingRef: Ref<HTMLHeadingElement>;
  headingClassName: string;
}) {
  return (
    <>
      <div className="grid gap-3">
        <p className="m-0 font-mono text-label text-muted">{view.tierLabel}</p>
        <h1
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className={headingClassName}
        >
          {view.headline}
        </h1>
      </div>
      <DotGridPanel className="px-5 pt-6 pb-5">
        <ScoreRuler
          score={view.score}
          maxScore={view.maxScore}
          thresholds={view.thresholds}
          tier={view.tier}
          tierLabels={view.tierLabels}
        />
      </DotGridPanel>
      <p className="m-0 text-body text-muted">{view.summary}</p>

      {view.weakAreas.length > 0 && (
        <div className="mt-4">
          <h2 className="m-0 mb-4 text-h3 font-semibold">Where to focus</h2>
          <RuledGrid
            items={view.weakAreas.map(({ sectionLabel, label, weakCopy }) => ({
              kicker: sectionLabel,
              title: label,
              body: weakCopy,
            }))}
          />
        </div>
      )}
    </>
  );
}
