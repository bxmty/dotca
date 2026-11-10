import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

/**
 * Enforces the suppression format from the `stryker.config.mjs` header:
 *
 *   // Stryker disable next-line <Mutator>[,<Mutator>]: <reason>
 *
 * Anything wider hides mutants nobody decided to hide: a block-level
 * `disable`/`restore`, `disable all`, or a `next-line` with no mutator named
 * silences every mutant in its range, and a suppression with no reason cannot
 * be reviewed. Whether the reason really describes an equivalent mutant is a
 * review judgement; this only guards the shape.
 */
const SUPPRESSION =
  /^\s*\/\/ Stryker disable next-line [A-Z][A-Za-z]+(?:,[A-Z][A-Za-z]+)*: \S.*$/;
const DIRECTIVE = /Stryker\s+(?:disable|restore)\b/;
const SOURCE_FILE = /\.[jt]sx?$/;
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;
const SKIPPED_DIRS = new Set(["tests", "__tests__", "__snapshots__"]);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name) ? [] : listSourceFiles(path);
    }
    return SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name)
      ? [path]
      : [];
  });
}

describe("Stryker suppression comments", () => {
  const srcDir = join(__dirname, "..");
  const repoRoot = join(srcDir, "..");
  const directives = listSourceFiles(srcDir).flatMap((path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .map((text, index) => ({
        location: `${relative(repoRoot, path)}:${index + 1}`,
        text,
      }))
      .filter(({ text }) => DIRECTIVE.test(text)),
  );

  it("finds suppression comments in the source tree", () => {
    // Guards the guard: if discovery broke, the check below would pass
    // vacuously.
    expect(directives).not.toHaveLength(0);
  });

  it("names its mutators and gives a reason on every suppression", () => {
    const malformed = directives
      .filter(({ text }) => !SUPPRESSION.test(text))
      .map(({ location, text }) => `${location} ${text.trim()}`);

    expect(malformed).toEqual([]);
  });

  it.each([
    "// Stryker disable all",
    "// Stryker disable next-line all: everything here is equivalent",
    "// Stryker disable StringLiteral: block-level",
    "// Stryker restore StringLiteral",
    "// Stryker disable next-line StringLiteral",
    "// Stryker disable next-line StringLiteral:",
    "// Stryker disable next-line: no mutator named",
    "const x = 1; // Stryker disable next-line StringLiteral: trailing",
  ])("rejects %s", (comment) => {
    expect(DIRECTIVE.test(comment) && !SUPPRESSION.test(comment)).toBe(true);
  });

  it.each([
    "// Stryker disable next-line StringLiteral: not read under jest",
    "    // Stryker disable next-line ConditionalExpression,EqualityOperator: the halves meet",
  ])("accepts %s", (comment) => {
    expect(SUPPRESSION.test(comment)).toBe(true);
  });
});
