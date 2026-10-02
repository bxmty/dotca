#!/usr/bin/env node
/**
 * Names one image build so a tag never covers two artifacts.
 *
 * A commit SHA is not enough: rebuilding that commit with a different secret
 * or build arg produces different image content. The workflow run id and
 * attempt change on every rebuild, including "Re-run failed jobs", so the tag
 * `<branch>-<full commit sha>-<run id>-<run attempt>` identifies one build.
 *
 * Prints the tag on stdout. The deploy workflow is the caller.
 */

const FULL_COMMIT_SHA = /^[0-9a-f]{40}$/;
const NUMERIC_ID = /^[0-9]+$/;
const DOCKER_TAG = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;
const MAX_TAG_LENGTH = 128;

function readFlag(argv, flagName) {
  const index = argv.indexOf(flagName);
  if (index === -1 || index === argv.length - 1) {
    return "";
  }
  return argv[index + 1];
}

function buildImageTag({ branchName, commitSha, runId, runAttempt }) {
  if (!branchName) {
    throw new Error("branch name is required");
  }
  if (!FULL_COMMIT_SHA.test(commitSha)) {
    throw new Error(
      `commit sha must be the full 40-character revision, got "${commitSha}"`,
    );
  }
  if (!NUMERIC_ID.test(runId)) {
    throw new Error(`run id must be a positive integer, got "${runId}"`);
  }
  if (!NUMERIC_ID.test(runAttempt)) {
    throw new Error(
      `run attempt must be a positive integer, got "${runAttempt}"`,
    );
  }

  const sanitizedBranch = branchName.replace(/[^A-Za-z0-9_.-]/g, "-");
  const imageTag = `${sanitizedBranch}-${commitSha}-${runId}-${runAttempt}`;

  if (imageTag.length > MAX_TAG_LENGTH || !DOCKER_TAG.test(imageTag)) {
    throw new Error(
      `image tag is not a valid Docker tag (${imageTag.length} characters): ${imageTag}`,
    );
  }

  return imageTag;
}

function main() {
  try {
    const imageTag = buildImageTag({
      branchName: readFlag(process.argv, "--branch"),
      commitSha: readFlag(process.argv, "--commit-sha"),
      runId: readFlag(process.argv, "--run-id"),
      runAttempt: readFlag(process.argv, "--run-attempt"),
    });
    process.stdout.write(`${imageTag}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

main();
