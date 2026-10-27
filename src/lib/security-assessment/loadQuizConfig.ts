import "server-only";
import fs from "fs";
import { load } from "js-yaml";
import type { QuizConfig } from "./quizTypes";
import { getQuizConfigPath } from "./quizContentPath";
import { validateQuizConfig } from "./validateQuizConfig";

let cachedConfig: QuizConfig | null = null;

export function loadQuizConfig(): QuizConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const configPath = getQuizConfigPath();
  const raw = fs.readFileSync(configPath, "utf8");
  const config = load(raw) as QuizConfig;
  validateQuizConfig(config);
  cachedConfig = config;
  return config;
}

/** Test hook: force the next loadQuizConfig() to re-read the file. */
export function clearQuizConfigCache(): void {
  cachedConfig = null;
}
