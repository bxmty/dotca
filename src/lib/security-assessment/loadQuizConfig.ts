import "server-only";
import fs from "fs";
import { load } from "js-yaml";
import type { QuizConfig } from "./quizTypes";
import type { SdrContent } from "./sdrTypes";
import { getQuizConfigPath } from "./quizContentPath";
import { validateQuizConfig } from "./validateQuizConfig";
import { validateSdrContent } from "./validateSdrContent";

/** The YAML file's shape: the public config plus the SDR-only block. */
type AssessmentFile = QuizConfig & { sdr: SdrContent };

interface AssessmentContent {
  config: QuizConfig;
  sdr: SdrContent;
}

let cachedContent: AssessmentContent | null = null;

function loadAssessmentContent(): AssessmentContent {
  if (cachedContent) {
    return cachedContent;
  }
  const raw = fs.readFileSync(getQuizConfigPath(), "utf8");
  // Split the SDR block off here so the public config never carries it.
  const { sdr, ...config } = load(raw) as AssessmentFile;
  validateQuizConfig(config);
  validateSdrContent({ config, sdr });
  cachedContent = { config, sdr };
  return cachedContent;
}

/** The public quiz config. Never includes SDR-only content. */
export function loadQuizConfig(): QuizConfig {
  return loadAssessmentContent().config;
}

/**
 * SDR-only content: talk tracks, next steps and discovery questions.
 * Server only. Hand it to a client component only from the token-gated
 * console page.
 */
export function loadSdrContent(): SdrContent {
  return loadAssessmentContent().sdr;
}

/** Test hook: force the next load to re-read the file. */
export function clearQuizConfigCache(): void {
  cachedContent = null;
}
