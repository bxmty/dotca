import { execFileSync } from "child_process";
import { join } from "path";

/**
 * The image tag is the name a deploy, a re-deploy, and a rollback all use.
 * It has to identify one build: the same commit rebuilt later (a new secret,
 * a rotated key, a changed build arg) must not reuse it.
 *
 * The public interface is the CLI the workflow shells out to. Expected tags
 * below are literals, not recomputed by the script.
 */
const scriptPath = join(
  __dirname,
  "..",
  "..",
  "scripts",
  "build-image-tag.cjs",
);

const COMMIT_SHA = "03f064a1b2c3d4e5f678901234567890abcdef01";

function buildImageTag(commandArguments: string[]): string {
  return execFileSync("node", [scriptPath, ...commandArguments], {
    encoding: "utf8",
  }).trim();
}

describe("build-image-tag", () => {
  it("names a build by branch, full commit, workflow run, and attempt", () => {
    const imageTag = buildImageTag([
      "--branch",
      "staging",
      "--commit-sha",
      COMMIT_SHA,
      "--run-id",
      "18473920123",
      "--run-attempt",
      "2",
    ]);

    expect(imageTag).toBe(
      "staging-03f064a1b2c3d4e5f678901234567890abcdef01-18473920123-2",
    );
  });

  it("gives a later rebuild of the same commit a different tag", () => {
    const firstBuild = buildImageTag([
      "--branch",
      "main",
      "--commit-sha",
      COMMIT_SHA,
      "--run-id",
      "100",
      "--run-attempt",
      "1",
    ]);
    const rebuild = buildImageTag([
      "--branch",
      "main",
      "--commit-sha",
      COMMIT_SHA,
      "--run-id",
      "200",
      "--run-attempt",
      "1",
    ]);
    const rerunOfSameWorkflow = buildImageTag([
      "--branch",
      "main",
      "--commit-sha",
      COMMIT_SHA,
      "--run-id",
      "100",
      "--run-attempt",
      "2",
    ]);

    expect(firstBuild).toBe(
      "main-03f064a1b2c3d4e5f678901234567890abcdef01-100-1",
    );
    expect(rebuild).not.toBe(firstBuild);
    expect(rerunOfSameWorkflow).not.toBe(firstBuild);
  });

  it("replaces characters a Docker tag cannot contain", () => {
    const imageTag = buildImageTag([
      "--branch",
      "feature/auth",
      "--commit-sha",
      COMMIT_SHA,
      "--run-id",
      "100",
      "--run-attempt",
      "1",
    ]);

    expect(imageTag).toBe(
      "feature-auth-03f064a1b2c3d4e5f678901234567890abcdef01-100-1",
    );
  });

  it("rejects a commit SHA that is not the full 40-character revision", () => {
    let failure: { stderr?: Buffer } | undefined;
    try {
      buildImageTag([
        "--branch",
        "staging",
        "--commit-sha",
        "03f064a",
        "--run-id",
        "100",
        "--run-attempt",
        "1",
      ]);
    } catch (error) {
      failure = error as { stderr?: Buffer };
    }

    expect(failure?.stderr?.toString()).toMatch(/commit sha/i);
  });
});
