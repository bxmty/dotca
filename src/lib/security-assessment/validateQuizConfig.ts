import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  type QuizConfig,
  type QuizQuestion,
  type QuizSegment,
} from "./quizTypes";
import { getQuizConfigPath } from "./quizContentPath";

export function getQuestionsForSegment(
  config: QuizConfig,
  segment: QuizSegment,
): QuizConfig["questions"] {
  return config.questions.filter((question) =>
    question.segments.includes(segment),
  );
}

/**
 * A segment's questions, each with its label on a lead: the category's label,
 * with " (2)" and so on when the category repeats within the segment.
 */
export function getQuestionsWithFieldLabels(
  config: QuizConfig,
  segment: QuizSegment,
): { question: QuizQuestion; fieldLabel: string }[] {
  const categoryOccurrence = new Map<string, number>();
  return getQuestionsForSegment(config, segment).map((question) => {
    const categoryLabel = config.categories[question.category].label;
    const occurrence = (categoryOccurrence.get(categoryLabel) ?? 0) + 1;
    categoryOccurrence.set(categoryLabel, occurrence);
    return {
      question,
      fieldLabel:
        occurrence > 1 ? `${categoryLabel} (${occurrence})` : categoryLabel,
    };
  });
}

/** Ordered section keys that have at least one question in this segment. */
export function getSectionKeysForSegment(
  config: QuizConfig,
  segment: QuizSegment,
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const question of getQuestionsForSegment(config, segment)) {
    const sectionKey = config.categories[question.category]?.section;
    if (sectionKey && !seen.has(sectionKey)) {
      seen.add(sectionKey);
      ordered.push(sectionKey);
    }
  }
  return ordered;
}

/** How far through its section a question is, counting itself: 0 to 1. */
export function getSectionFraction(
  config: QuizConfig,
  segment: QuizSegment,
  question: QuizQuestion,
): number {
  const { section } = config.categories[question.category];
  const sectionQuestions = getQuestionsForSegment(config, segment).filter(
    ({ category }) => config.categories[category].section === section,
  );
  return (sectionQuestions.indexOf(question) + 1) / sectionQuestions.length;
}

/** Throws with a list of problems when the config is structurally invalid. */
export function validateQuizConfig(config: QuizConfig): void {
  const problems: string[] = [];
  const configPath = getQuizConfigPath();

  if (!config.sections || Object.keys(config.sections).length === 0) {
    problems.push("missing sections map");
  }

  for (const segment of QUIZ_SEGMENTS) {
    if (!config.segments?.[segment]) {
      problems.push(`missing segments.${segment}`);
    }
    const thresholds = config.thresholds?.[segment];
    if (!thresholds) {
      problems.push(`missing thresholds.${segment}`);
    } else if (
      !(thresholds.reactive < thresholds.managed) ||
      !(thresholds.managed < thresholds.resilient)
    ) {
      problems.push(
        `thresholds.${segment} must increase: reactive < managed < resilient`,
      );
    }
    for (const tier of RISK_TIERS) {
      const cta = config.ctas?.[segment]?.[tier];
      if (!cta?.heading || !cta?.buttonLabel || !cta?.buttonHref) {
        problems.push(`incomplete ctas.${segment}.${tier}`);
      }
    }

    const segmentQuestions = getQuestionsForSegment(config, segment);
    if (segmentQuestions.length === 0) {
      problems.push(`segment "${segment}" resolves to no questions`);
    }
    const segmentSections = getSectionKeysForSegment(config, segment);
    if (segmentSections.length === 0 && segmentQuestions.length > 0) {
      problems.push(`segment "${segment}" resolves to no sections`);
    }
  }

  for (const tier of RISK_TIERS) {
    if (!config.tiers?.[tier]?.headline || !config.tiers?.[tier]?.body) {
      problems.push(`incomplete tiers.${tier}`);
    }
  }

  for (const [categoryKey, category] of Object.entries(
    config.categories ?? {},
  )) {
    if (!category?.weakCopy) {
      problems.push(`category "${categoryKey}" has no weakCopy`);
    }
    if (category?.section && !config.sections?.[category.section]) {
      problems.push(
        `category "${categoryKey}" points at unknown section "${category.section}"`,
      );
    }
  }

  const seenIds = new Set<string>();
  for (const question of config.questions ?? []) {
    if (seenIds.has(question.id)) {
      problems.push(`duplicate question id "${question.id}"`);
    }
    seenIds.add(question.id);
    const category = config.categories?.[question.category];
    if (!category?.weakCopy) {
      problems.push(
        `question "${question.id}" references unknown category "${question.category}"`,
      );
    } else if (!category.section) {
      problems.push(
        `question "${question.id}" category "${question.category}" has no section`,
      );
    } else if (!config.sections?.[category.section]) {
      problems.push(
        `question "${question.id}" category "${question.category}" points at unknown section "${category.section}"`,
      );
    }
    if (!Array.isArray(question.answers) || question.answers.length < 2) {
      problems.push(`question "${question.id}" needs at least 2 answers`);
    }
    const invalidSegments = (question.segments ?? []).filter(
      (segment) => !QUIZ_SEGMENTS.includes(segment),
    );
    if (invalidSegments.length > 0 || (question.segments ?? []).length === 0) {
      problems.push(`question "${question.id}" has invalid segments`);
    }
  }

  if ((config.questions ?? []).length === 0) {
    problems.push("no questions defined");
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid quiz config (${configPath}):\n- ${problems.join("\n- ")}`,
    );
  }
}
