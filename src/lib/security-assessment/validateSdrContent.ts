import { QUIZ_SEGMENTS, RISK_TIERS, type QuizConfig } from "./quizTypes";
import {
  DISCOVERY_GROUPS,
  DISCOVERY_KINDS,
  SDR_COPY_STATUSES,
  type DiscoveryQuestion,
  type SdrContent,
} from "./sdrTypes";
import { getQuizConfigPath } from "./quizContentPath";

function findTalkTrackProblems(
  config: QuizConfig,
  talkTracks: SdrContent["talkTracks"] | undefined,
): string[] {
  const problems: string[] = [];
  const questionIds = new Set(config.questions.map((question) => question.id));
  for (const questionId of questionIds) {
    const track = talkTracks?.[questionId];
    if (!track?.whyItMatters || !track?.probe) {
      problems.push(`incomplete sdr.talkTracks.${questionId}`);
    }
  }
  for (const trackId of Object.keys(talkTracks ?? {})) {
    if (!questionIds.has(trackId)) {
      problems.push(`talk track for unknown question "${trackId}"`);
    }
  }
  return problems;
}

function findNextStepProblems(
  nextSteps: SdrContent["nextSteps"] | undefined,
): string[] {
  const problems: string[] = [];
  for (const segment of QUIZ_SEGMENTS) {
    for (const tier of RISK_TIERS) {
      const step = nextSteps?.[segment]?.[tier];
      if (!step?.propose || !step?.service) {
        problems.push(`incomplete sdr.nextSteps.${segment}.${tier}`);
      }
    }
  }
  return problems;
}

/** Problems with one question's shape: group, text, and kind vs choices. */
function findDiscoveryShapeProblems(question: DiscoveryQuestion): string[] {
  const problems: string[] = [];
  const label = `discovery question "${question.id}"`;
  if (!DISCOVERY_GROUPS.includes(question.group)) {
    problems.push(`${label} needs group opening or closing`);
  }
  if (!question.text) {
    problems.push(`${label} has no text`);
  }
  const choices = (question as { choices?: unknown }).choices;
  if (!DISCOVERY_KINDS.includes(question.kind)) {
    problems.push(`${label} needs kind choice or text`);
  } else if (question.kind === "text" && choices !== undefined) {
    problems.push(`${label} is free text but has choices`);
  } else if (
    question.kind === "choice" &&
    !(
      Array.isArray(choices) &&
      choices.length >= 2 &&
      choices.every((choice) => typeof choice === "string" && choice)
    )
  ) {
    problems.push(`${label} needs at least 2 choices`);
  }
  return problems;
}

function findDiscoveryProblems(
  config: QuizConfig,
  discovery: DiscoveryQuestion[] | undefined,
): string[] {
  const problems: string[] = [];
  const questionIds = new Set(config.questions.map((question) => question.id));
  const seenIds = new Set<string>();
  for (const [index, question] of (discovery ?? []).entries()) {
    if (!question.id) {
      problems.push(`discovery question at position ${index + 1} has no id`);
      continue;
    }
    if (seenIds.has(question.id)) {
      problems.push(`duplicate discovery question id "${question.id}"`);
    }
    seenIds.add(question.id);
    if (questionIds.has(question.id)) {
      problems.push(
        `discovery question "${question.id}" clashes with a posture question id`,
      );
    }
    problems.push(...findDiscoveryShapeProblems(question));
  }
  for (const group of DISCOVERY_GROUPS) {
    if (!(discovery ?? []).some((question) => question.group === group)) {
      problems.push(`no ${group} discovery questions`);
    }
  }
  return problems;
}

/** Throws with a list of problems when the SDR block is invalid. */
export function validateSdrContent({
  config,
  sdr,
}: {
  config: QuizConfig;
  sdr: SdrContent | undefined;
}): void {
  const problems: string[] = [];

  if (!sdr || !SDR_COPY_STATUSES.includes(sdr.status)) {
    problems.push("sdr.status must be draft or approved");
  }
  problems.push(
    ...findTalkTrackProblems(config, sdr?.talkTracks),
    ...findNextStepProblems(sdr?.nextSteps),
    ...findDiscoveryProblems(config, sdr?.discovery),
  );

  if (problems.length > 0) {
    throw new Error(
      `Invalid SDR content (${getQuizConfigPath()}):\n- ${problems.join("\n- ")}`,
    );
  }
}
