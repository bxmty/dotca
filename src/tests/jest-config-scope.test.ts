import { execFileSync } from "child_process";
import { mkdirSync, readdirSync, rmdirSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";

/**
 * A Next.js standalone build copies `src/` — tests included — into its output
 * directory (`.next/standalone/src/...`). Jest's `testMatch` is unanchored, so
 * without an ignore pattern those stale duplicates are collected and run
 * alongside the real suite. Since #569 made a failing suite genuinely block
 * commits and deploys, a stray local build directory would otherwise be enough
 * to wedge every commit on tests that do not exist in the source tree.
 *
 * Stryker's mutation-testing sandbox (`.stryker-tmp/sandbox-*`) is the same
 * hazard: it copies `src/`, tests included, and an interrupted run leaves the
 * copy behind.
 *
 * This asks jest itself which files it would collect rather than re-deriving
 * its ignore semantics, so the guard cannot pass while real discovery diverges.
 */
describe("jest test discovery scope", () => {
  const repoRoot = join(__dirname, "..", "..");
  const buildOutputDir = join(repoRoot, ".next-discovery-fixture");
  const phantomTestPath = join(
    buildOutputDir,
    "standalone",
    "src",
    "tests",
    "phantom.test.ts",
  );
  // Only the fixture's own sandbox is removed afterwards, so a real Stryker
  // sandbox left in .stryker-tmp/ survives this test.
  const strykerTmpDir = join(repoRoot, ".stryker-tmp");
  const strykerSandboxDir = join(strykerTmpDir, "sandbox-discovery-fixture");
  const strykerPhantomTestPath = join(
    strykerSandboxDir,
    "src",
    "tests",
    "phantom.test.ts",
  );

  let collectedTestPaths: string[];

  beforeAll(() => {
    for (const path of [phantomTestPath, strykerPhantomTestPath]) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, 'it("phantom", () => {});\n');
    }

    collectedTestPaths = execFileSync(
      "npx",
      ["jest", "--listTests", "--coverage=false"],
      { cwd: repoRoot, encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean);
  }, 120_000);

  afterAll(() => {
    rmSync(buildOutputDir, { recursive: true, force: true });
    rmSync(strykerSandboxDir, { recursive: true, force: true });
    if (readdirSync(strykerTmpDir).length === 0) rmdirSync(strykerTmpDir);
  });

  it("does not collect tests copied into a Next.js build directory", () => {
    expect(collectedTestPaths).not.toContain(phantomTestPath);
  });

  it("does not collect tests copied into a Stryker sandbox", () => {
    expect(collectedTestPaths).not.toContain(strykerPhantomTestPath);
  });

  it("still collects the real source tests", () => {
    expect(collectedTestPaths).toContain(
      join(__dirname, "jest-config-scope.test.ts"),
    );
  });
});
