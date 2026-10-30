import type { Ref } from "react";
import RuledGrid from "@/app/components/RuledGrid";
import {
  RISK_TIERS,
  type QuizConfig,
  type QuizResult,
  type QuizSegment,
  type RiskTier,
} from "@/lib/security-assessment/quizTypes";
import DotGridPanel from "./DotGridPanel";
import ScoreRuler from "./ScoreRuler";

/**
 * Tier, score and weak areas: what every audience of a result sees. What comes
 * next (a CTA, or an SDR's next step) is up to the caller.
 */
export default function QuizResultSummary({
  config,
  segment,
  result,
  headingId,
  headingRef,
  headingClassName,
}: {
  config: QuizConfig;
  segment: QuizSegment;
  result: QuizResult;
  headingId: string;
  headingRef: Ref<HTMLHeadingElement>;
  headingClassName: string;
}) {
  const tierCopy = config.tiers[result.tier];
  const weakAreaItems = result.riskCategories.map((categoryKey) => {
    const category = config.categories[categoryKey];
    return {
      kicker: config.sections[category.section]?.label,
      title: category.label,
      body: category.weakCopy,
    };
  });
  const tierLabels = Object.fromEntries(
    RISK_TIERS.map((tier) => [tier, config.tiers[tier].label]),
  ) as Record<RiskTier, string>;

  return (
    <>
      <div className="grid gap-3">
        <p className="m-0 font-mono text-label text-muted">{tierCopy.label}</p>
        <h1
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className={headingClassName}
        >
          {tierCopy.headline}
        </h1>
      </div>
      <DotGridPanel className="px-5 pt-6 pb-5">
        <ScoreRuler
          score={result.score}
          maxScore={result.maxScore}
          thresholds={config.thresholds[segment]}
          tier={result.tier}
          tierLabels={tierLabels}
        />
      </DotGridPanel>
      <p className="m-0 text-body text-muted">{tierCopy.body}</p>

      {weakAreaItems.length > 0 && (
        <div className="mt-4">
          <h2 className="m-0 mb-4 text-h3 font-semibold">Where to focus</h2>
          <RuledGrid items={weakAreaItems} />
        </div>
      )}
    </>
  );
}
