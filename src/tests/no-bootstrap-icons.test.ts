/**
 * @jest-environment node
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// Bootstrap Icons were dropped with the blog restyle (#621): no dependency,
// no import and no `bi bi-*` markup may come back.

const ROOT = process.cwd();

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    return /\.(tsx?|jsx?|css)$/.test(entry.name) ? [entryPath] : [];
  });
}

describe("Bootstrap Icons", () => {
  it("is not a dependency", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(ROOT, "package.json"), "utf8"),
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(deps).not.toHaveProperty("bootstrap-icons");
  });

  it("is neither imported nor used in src", () => {
    const offenders = listSourceFiles(path.join(ROOT, "src"))
      .filter((file) => !file.includes(`${path.sep}tests${path.sep}`))
      .filter((file) =>
        /bootstrap-icons|\bbi bi-/.test(readFileSync(file, "utf8")),
      );

    expect(offenders).toEqual([]);
  });
});
