import { execFileSync, spawnSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Reproduces the failure behind #586 and the fix.
 *
 * A host that already has `staging-<commit>` and uses Compose `pull_policy:
 * missing` does not ask the registry again. Rebuilding that commit (new
 * secret, same SHA) moves the registry tag and leaves the host on the old
 * image. A tag that includes the workflow run is absent locally, so the same
 * policy pulls it and the new artifact is what runs.
 *
 * Expected build inputs are literals (`dsn-from-first-build`,
 * `dsn-from-second-build`), not derived from the images under test.
 */

const COMMIT_SHA = "03f064a1b2c3d4e5f678901234567890abcdef01";
const REGISTRY_PORT = "5599";
const REGISTRY_CONTAINER = "dotca-image-identity-test";
const REPOSITORY = `localhost:${REGISTRY_PORT}/dotca`;
const SHA_TAG = `staging-${COMMIT_SHA}`;
const LABEL = "com.boximity.build-input";
const FIRST_BUILD_INPUT = "dsn-from-first-build";
const SECOND_BUILD_INPUT = "dsn-from-second-build";

const scriptPath = join(
  __dirname,
  "..",
  "..",
  "scripts",
  "build-image-tag.cjs",
);

function runProcess(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status})\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

function buildImageTagForRun(runId: string): string {
  return execFileSync(
    "node",
    [
      scriptPath,
      "--branch",
      "staging",
      "--commit-sha",
      COMMIT_SHA,
      "--run-id",
      runId,
      "--run-attempt",
      "1",
    ],
    { encoding: "utf8" },
  ).trim();
}

function buildAndPush(tag: string, buildInput: string): void {
  const contextDir = mkdtempSync(join(tmpdir(), "dotca-image-"));
  try {
    writeFileSync(
      join(contextDir, "Dockerfile"),
      `FROM busybox:1.36.1\nARG BUILD_INPUT\nLABEL ${LABEL}=$BUILD_INPUT\n`,
    );
    runProcess("docker", [
      "build",
      "--build-arg",
      `BUILD_INPUT=${buildInput}`,
      "-t",
      `${REPOSITORY}:${tag}`,
      contextDir,
    ]);
    runProcess("docker", ["push", `${REPOSITORY}:${tag}`]);
  } finally {
    rmSync(contextDir, { recursive: true, force: true });
  }
}

function readLocalBuildInput(tag: string): string | undefined {
  const result = spawnSync(
    "docker",
    [
      "image",
      "inspect",
      "--format",
      `{{ index .Config.Labels "${LABEL}" }}`,
      `${REPOSITORY}:${tag}`,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    return undefined;
  }
  const value = result.stdout.trim();
  return value === "" || value === "<no value>" ? undefined : value;
}

/**
 * Compose `pull_policy: missing`: a tag already on the host is not pulled.
 */
function deployWithMissingPullPolicy(tag: string): string {
  const alreadyPresent = readLocalBuildInput(tag);
  if (alreadyPresent !== undefined) {
    return alreadyPresent;
  }
  runProcess("docker", ["pull", `${REPOSITORY}:${tag}`]);
  const pulled = readLocalBuildInput(tag);
  if (pulled === undefined) {
    throw new Error(`pull succeeded but ${tag} has no local image`);
  }
  return pulled;
}

function copyRegistryTag(sourceTag: string, destinationTag: string): void {
  // Docker BuildKit pushes an OCI index (image + attestation). Copying that
  // index moves the registry tag without retagging the image the host already
  // has, which is what a second CI runner does when it pushes the same tag.
  const manifestPath = "/tmp/dotca-image-identity-manifest";
  const listed = spawnSync(
    "curl",
    [
      "-sS",
      "-D",
      "-",
      "-o",
      manifestPath,
      "-H",
      "Accept: application/vnd.oci.image.index.v1+json",
      `http://127.0.0.1:${REGISTRY_PORT}/v2/dotca/manifests/${sourceTag}`,
    ],
    { encoding: "utf8" },
  );
  if (listed.status !== 0) {
    throw new Error(
      `failed to read manifest for ${sourceTag}\n${listed.stderr}`,
    );
  }
  const statusLine = listed.stdout.split("\n")[0] ?? "";
  if (!statusLine.includes("200")) {
    throw new Error(
      `registry did not return the manifest for ${sourceTag}:\n${listed.stdout}`,
    );
  }
  const contentType = listed.stdout
    .match(/^content-type:\s*([^;\r]+)/im)?.[1]
    ?.trim();
  if (!contentType) {
    throw new Error(`registry response had no content-type:\n${listed.stdout}`);
  }
  runProcess("curl", [
    "-sS",
    "-f",
    "-X",
    "PUT",
    "-H",
    `Content-Type: ${contentType}`,
    "--data-binary",
    `@${manifestPath}`,
    `http://127.0.0.1:${REGISTRY_PORT}/v2/dotca/manifests/${destinationTag}`,
  ]);
}

describe("deploying a rebuild of the same commit", () => {
  const firstBuildTag = buildImageTagForRun("100");
  const secondBuildTag = buildImageTagForRun("200");

  beforeAll(async () => {
    spawnSync("docker", ["rm", "-f", REGISTRY_CONTAINER], { encoding: "utf8" });
    runProcess("docker", [
      "run",
      "-d",
      "--name",
      REGISTRY_CONTAINER,
      "-p",
      `${REGISTRY_PORT}:5000`,
      "registry:2.8.3",
    ]);

    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const ready = spawnSync(
        "curl",
        ["-sf", `http://127.0.0.1:${REGISTRY_PORT}/v2/`],
        { encoding: "utf8" },
      );
      if (ready.status === 0) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("local registry did not become ready");
  }, 120_000);

  afterAll(() => {
    spawnSync("docker", ["rm", "-f", REGISTRY_CONTAINER], { encoding: "utf8" });
    for (const tag of [SHA_TAG, firstBuildTag, secondBuildTag, "build-new"]) {
      spawnSync("docker", ["rmi", "-f", `${REPOSITORY}:${tag}`], {
        encoding: "utf8",
      });
    }
    rmSync("/tmp/dotca-image-identity-manifest", { force: true });
  });

  it("keeps the previous artifact when the tag is only the commit SHA", () => {
    buildAndPush(SHA_TAG, FIRST_BUILD_INPUT);
    buildAndPush("build-new", SECOND_BUILD_INPUT);
    copyRegistryTag("build-new", SHA_TAG);
    runProcess("docker", ["rmi", "-f", `${REPOSITORY}:build-new`]);

    // The registry tag now names the second build. The host still has the
    // first, and missing-pull does not refresh it.
    expect(deployWithMissingPullPolicy(SHA_TAG)).toBe(FIRST_BUILD_INPUT);
  }, 180_000);

  it("runs the new artifact when the tag names the workflow run", () => {
    buildAndPush(firstBuildTag, FIRST_BUILD_INPUT);
    buildAndPush("build-new", SECOND_BUILD_INPUT);
    copyRegistryTag("build-new", secondBuildTag);
    runProcess("docker", ["rmi", "-f", `${REPOSITORY}:build-new`]);

    expect(secondBuildTag).not.toBe(SHA_TAG);
    expect(readLocalBuildInput(secondBuildTag)).toBeUndefined();
    expect(deployWithMissingPullPolicy(secondBuildTag)).toBe(
      SECOND_BUILD_INPUT,
    );
  }, 180_000);
});
