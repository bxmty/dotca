import { execFileSync } from "child_process";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * A Next.js standalone build copies `src/` — tests included — into its output
 * directory (`.next/standalone/src/...`). Jest's `testMatch` is unanchored, so
 * without an ignore pattern those stale duplicates are collected and run
 * alongside the real suite. Since #569 made a failing suite genuinely block
 * commits and deploys, a stray local build directory would otherwise be enough
 * to wedge every commit on tests that do not exist in the source tree.
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

  let collectedTestPaths: string[];

  beforeAll(() => {
    mkdirSync(join(buildOutputDir, "standalone", "src", "tests"), {
      recursive: true,
    });
    writeFileSync(phantomTestPath, 'it("phantom", () => {});\n');

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
  });

  it("does not collect tests copied into a Next.js build directory", () => {
    expect(collectedTestPaths).not.toContain(phantomTestPath);
  });

  it("still collects the real source tests", () => {
    expect(collectedTestPaths).toContain(
      join(__dirname, "jest-config-scope.test.ts"),
    );
  });
});
