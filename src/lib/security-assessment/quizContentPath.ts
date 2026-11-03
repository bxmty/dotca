import path from "path";

const DEFAULT_QUIZ_CONTENT_DIR = path.join(process.cwd(), "content", "quiz");

/**
 * Tests point the loader at fixture configs with QUIZ_CONTENT_DIR so no
 * malformed YAML has to live in content/. Honored only under NODE_ENV=test.
 */
export function getQuizContentDir(): string {
  const override = process.env.QUIZ_CONTENT_DIR;
  return process.env.NODE_ENV === "test" && override
    ? override
    : DEFAULT_QUIZ_CONTENT_DIR;
}

export function getQuizConfigPath(): string {
  return path.join(getQuizContentDir(), "security-assessment.yaml");
}
