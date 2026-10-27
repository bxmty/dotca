import {
  QUIZ_SEGMENTS,
  type QuizConfig,
  type QuizResult,
  type QuizSegment,
  type RiskTier,
} from "./quizTypes";
import { getQuestionsForSegment } from "./validateQuizConfig";

export function isQuizSegment(value: unknown): value is QuizSegment {
  return QUIZ_SEGMENTS.includes(value as QuizSegment);
}

/**
 * Score a completed response set. `answers` maps question id → index of
 * the selected answer. Throws on missing or out-of-range answers so API
 * callers can reject malformed submissions with a 400.
 */
export function scoreQuizAnswers({
  config,
  segment,
  answers,
}: {
  config: QuizConfig;
  segment: QuizSegment;
  answers: Record<string, number>;
}): QuizResult {
  const questions = getQuestionsForSegment(config, segment);

  let score = 0;
  let maxScore = 0;
  const riskCategories: string[] = [];

  for (const question of questions) {
    const answerIndex = answers[question.id];
    const answer =
      typeof answerIndex === "number"
        ? question.answers[answerIndex]
        : undefined;
    if (!answer) {
      throw new Error(
        `Missing or invalid answer for question "${question.id}"`,
      );
    }
    score += answer.points;
    maxScore += Math.max(...question.answers.map((option) => option.points));
    if (answer.risk && !riskCategories.includes(question.category)) {
      riskCategories.push(question.category);
    }
  }

  const thresholds = config.thresholds[segment];
  let tier: RiskTier = "exposed";
  if (score >= thresholds.resilient) {
    tier = "resilient";
  } else if (score >= thresholds.managed) {
    tier = "managed";
  } else if (score >= thresholds.reactive) {
    tier = "reactive";
  }

  return { score, maxScore, tier, riskCategories };
}
