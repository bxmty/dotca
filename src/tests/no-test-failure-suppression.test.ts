import { readFileSync } from "fs";
import { join } from "path";

/**
 * `--testFailureExitCode=0` makes jest exit 0 no matter what, which silently
 * disables every layer that is supposed to stop a broken test: the local run,
 * the pre-commit hook, and the deploy workflow's fail-on-test-failures gate.
 * It was removed in #569; these guards stop it from coming back.
 */
describe("jest exit code suppression", () => {
  const SUPPRESSION_FLAG = "--testFailureExitCode";
  const repoRoot = join(__dirname, "..", "..");

  const readRepoFile = (relativePath: string): string =>
    readFileSync(join(repoRoot, relativePath), "utf8");

  it("is absent from every package.json script", () => {
    const scripts: Record<string, string> = JSON.parse(
      readRepoFile("package.json"),
    ).scripts;

    const suppressingScriptNames = Object.entries(scripts)
      .filter(([, command]) => command.includes(SUPPRESSION_FLAG))
      .map(([name]) => name);

    expect(suppressingScriptNames).toEqual([]);
  });

  it("is absent from the pre-commit hooks", () => {
    expect(readRepoFile(".pre-commit-config.yaml")).not.toContain(
      SUPPRESSION_FLAG,
    );
  });
});
