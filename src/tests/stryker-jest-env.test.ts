import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

/**
 * Stryker runs with `coverageAnalysis: "perTest"`, which learns which tests
 * cover each mutant through its own Jest environment wrapper. The config-wide
 * default environment is wrapped automatically, but a test file that picks its
 * own environment with a `@jest-environment` docblock bypasses that: a plain
 * `node` (or `jest-environment-node`, `jsdom`, `jest-environment-jsdom`)
 * docblock makes the file invisible to perTest coverage. Stryker then never
 * runs it against any mutant, so mutants it would kill are reported as
 * survivors and the score is silently wrong.
 *
 * Every docblock environment must therefore be one of Stryker's wrappers:
 * `@stryker-mutator/jest-runner/jest-env/node` or `.../jest-env/jsdom`. They
 * behave exactly like the plain environments outside a Stryker run.
 *
 * Only the leading docblock is read, matching how Jest itself picks the
 * environment, so a mention in a later comment (like this one) is ignored.
 */
const STRYKER_ENV_PREFIX = "@stryker-mutator/jest-runner/jest-env/";
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;
const LEADING_DOCBLOCK = /^(?:#![^\n]*\n)?\s*(\/\*\*[\s\S]*?\*\/)/;
const ENV_PRAGMA = /@jest-environment\s+(\S+)/;

function listTestFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listTestFiles(path);
    const isInTestsDir = path.split(/[\\/]/).includes("__tests__");
    return TEST_FILE.test(entry.name) || isInTestsDir ? [path] : [];
  });
}

function readDocblockEnvironment(path: string): string | undefined {
  const docblock = LEADING_DOCBLOCK.exec(readFileSync(path, "utf8"))?.[1];
  return docblock ? ENV_PRAGMA.exec(docblock)?.[1] : undefined;
}

describe("Stryker-compatible jest environments", () => {
  const srcDir = join(__dirname, "..");
  const repoRoot = join(srcDir, "..");
  const environments = listTestFiles(srcDir).map((path) => ({
    file: relative(repoRoot, path),
    environment: readDocblockEnvironment(path),
  }));

  it("finds test files that set a docblock environment", () => {
    // Guards the guard: if discovery or parsing broke, the check below would
    // pass vacuously.
    expect(
      environments.filter(({ environment }) => environment !== undefined),
    ).not.toHaveLength(0);
  });

  it("uses Stryker's environment wrapper in every docblock", () => {
    const unwrapped = environments.filter(
      ({ environment }) =>
        environment !== undefined &&
        !environment.startsWith(STRYKER_ENV_PREFIX),
    );

    expect(unwrapped).toEqual([]);
  });
});
