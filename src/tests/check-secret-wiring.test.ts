/**
 * @jest-environment node
 */
import { spawnSync } from "child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";

/**
 * A runtime secret crosses deploy.yml, the deploy action, both playbooks and
 * the compose template; a missed hop deploys an empty value. The wiring check
 * fails on any missed hop, so each case removes one hop from a copy of the
 * real deploy files.
 */
const repoRoot = join(__dirname, "..", "..");
const SCRIPT = join(repoRoot, "scripts", "check-secret-wiring.sh");
const WIRING_FILES = [
  ".github/workflows/deploy.yml",
  ".github/actions/deploy/action.yml",
  ".github/workflows/environments/staging.yml",
  ".github/workflows/environments/production.yml",
  "ansible/staging-deploy.yml",
  "ansible/production-deploy.yml",
  "ansible/templates/docker-compose.yml.j2",
  "scripts/check-deploy-secrets.sh",
];

let fixtureRoot: string;

function runWiringCheck(root: string) {
  const result = spawnSync("bash", [SCRIPT, root], { encoding: "utf8" });
  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

function editFixture(
  relativePath: string,
  edit: (source: string) => string,
): void {
  const path = join(fixtureRoot, relativePath);
  const source = readFileSync(path, "utf8");
  const edited = edit(source);
  if (edited === source) throw new Error(`edit changed nothing in ${path}`);
  writeFileSync(path, edited);
}

const dropLine = (pattern: RegExp) => (source: string) =>
  source
    .split("\n")
    .filter((line) => !pattern.test(line))
    .join("\n");

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "secret-wiring-"));
  for (const relativePath of WIRING_FILES) {
    const target = join(fixtureRoot, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(repoRoot, relativePath), target);
  }
  symlinkSync(join(repoRoot, "src"), join(fixtureRoot, "src"));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("scripts/check-secret-wiring.sh", () => {
  it("passes on the repo as committed", () => {
    const { status, output } = runWiringCheck(repoRoot);

    expect(output).toBe("");
    expect(status).toBe(0);
  });

  it("passes on an unedited copy", () => {
    expect(runWiringCheck(fixtureRoot).status).toBe(0);
  });

  it.each([
    [
      "the Deploy step does not pass it",
      ".github/workflows/deploy.yml",
      /^\s+SYNCRO_API_KEY: \$\{\{ secrets\.SYNCRO_API_KEY \}\}/,
      /SYNCRO_API_KEY: .*not passed by the Deploy step/,
    ],
    [
      "a playbook never reads it",
      "ansible/staging-deploy.yml",
      /\{\{ SYNCRO_API_KEY \| default/,
      /SYNCRO_API_KEY: .*ansible\/staging-deploy\.yml never reads it/,
    ],
    [
      "the container never receives it",
      "ansible/templates/docker-compose.yml.j2",
      /^\s+- SYNCRO_API_KEY=/,
      /SYNCRO_API_KEY: read by the app but not passed to the container/,
    ],
    [
      "an environment file does not list it",
      ".github/workflows/environments/production.yml",
      /^ {2}- SYNCRO_API_KEY$/,
      /SYNCRO_API_KEY: .*missing from environments\/production\.yml/,
    ],
    [
      "the gate gives it no tier",
      "scripts/check-deploy-secrets.sh",
      /^require SYNCRO_API_KEY/,
      /SYNCRO_API_KEY: read by the app but has no tier/,
    ],
  ])("fails when %s", (_case, relativePath, lineToDrop, expectedProblem) => {
    editFixture(relativePath, dropLine(lineToDrop));

    const { status, output } = runWiringCheck(fixtureRoot);

    expect(status).toBe(1);
    expect(output).toMatch(expectedProblem);
    expect(output).toMatch(/Adding a Secret/);
  });

  it("fails when an environment file lists a secret deploy.yml never reads", () => {
    editFixture(".github/workflows/environments/staging.yml", (source) =>
      source.replace(
        "  - SYNCRO_API_KEY\n",
        "  - SYNCRO_API_KEY\n  - NEW_KEY\n",
      ),
    );

    expect(runWiringCheck(fixtureRoot).output).toMatch(
      /NEW_KEY: listed in environments\/staging\.yml but .* never reads secrets\.NEW_KEY/,
    );
  });

  it("fails when the gate checks a secret the Deploy step does not pass", () => {
    editFixture("scripts/check-deploy-secrets.sh", (source) =>
      source.replace(
        "require DO_TOKEN\n",
        "require DO_TOKEN\nrequire NEW_KEY\n",
      ),
    );

    expect(runWiringCheck(fixtureRoot).output).toMatch(
      /NEW_KEY: checked by .* but not passed by the Deploy step/,
    );
  });
});
