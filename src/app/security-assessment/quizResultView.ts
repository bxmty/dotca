import {
  RISK_TIERS,
  type QuizConfig,
  type QuizResult,
  type QuizSegment,
  type RiskTier,
} from "@/lib/security-assessment/quizTypes";

/**
 * A result as display text and numbers, cut from the quiz config. It's all
 * QuizResultSummary needs, so the presenter tab can show a result without ever
 * holding the config (and its CTAs).
 */
export type QuizResultView = {
  tier: RiskTier;
  tierLabel: string;
  headline: string;
  summary: string;
  score: number;
  maxScore: number;
  thresholds: QuizConfig["thresholds"][QuizSegment];
  tierLabels: Record<RiskTier, string>;
  weakAreas: { sectionLabel?: string; label: string; weakCopy: string }[];
};

export function buildQuizResultView(
  config: QuizConfig,
  segment: QuizSegment,
  result: QuizResult,
): QuizResultView {
  const tierCopy = config.tiers[result.tier];
  return {
    tier: result.tier,
    tierLabel: tierCopy.label,
    headline: tierCopy.headline,
    summary: tierCopy.body,
    score: result.score,
    maxScore: result.maxScore,
    thresholds: config.thresholds[segment],
    tierLabels: Object.fromEntries(
      RISK_TIERS.map((tier) => [tier, config.tiers[tier].label]),
    ) as Record<RiskTier, string>,
    weakAreas: result.riskCategories.map((categoryKey) => {
      const category = config.categories[categoryKey];
      return {
        sectionLabel: config.sections[category.section]?.label,
        label: category.label,
        weakCopy: category.weakCopy,
      };
    }),
  };
}
