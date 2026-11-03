/**
 * @jest-environment node
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..");
const SCRIPT = join(repoRoot, "scripts", "check-sdr-link-secret.sh");

function runCheck(environment: string, secret: string | undefined) {
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH };
  if (secret !== undefined) env.SDR_LINK_SIGNING_SECRET = secret;
  const result = spawnSync("bash", [SCRIPT, environment], {
    env,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe("scripts/check-sdr-link-secret.sh", () => {
  it.each(["staging", "production", "local"])(
    "passes quietly for %s when the secret is set",
    (environment) => {
      expect(runCheck(environment, "a".repeat(64))).toEqual({
        status: 0,
        output: "",
      });
    },
  );

  it.each(["staging", "production"])(
    "fails %s when the secret is missing or too short",
    (environment) => {
      for (const secret of [undefined, "", "too-short"]) {
        const { status, output } = runCheck(environment, secret);

        expect(status).toBe(1);
        expect(output).toMatch(/SDR_LINK_SIGNING_SECRET/);
      }
    },
  );

  it("only warns for an environment that isn't deployed", () => {
    const { status, output } = runCheck("local", undefined);

    expect(status).toBe(0);
    expect(output).toMatch(/warning.*SDR_LINK_SIGNING_SECRET/i);
  });

  it("never prints the secret", () => {
    expect(runCheck("production", "short-secret-value").output).not.toContain(
      "short-secret-value",
    );
  });
});

describe("SDR secret wiring", () => {
  const read = (relativePath: string) =>
    readFileSync(join(repoRoot, relativePath), "utf8");

  it.each([
    ".github/actions/deploy/action.yml",
    "justfile",
    "scripts/local-deploy.sh",
  ])("%s runs the gate", (relativePath) => {
    expect(read(relativePath)).toContain("check-sdr-link-secret.sh");
  });

  it.each([
    [
      ".github/workflows/deploy.yml",
      "SDR_LINK_SIGNING_SECRET: ${{ secrets.SDR_LINK_SIGNING_SECRET }}",
    ],
    [
      ".github/actions/deploy/action.yml",
      "SDR_LINK_SIGNING_SECRET=${SDR_LINK_SIGNING_SECRET:-}",
    ],
    [
      "ansible/staging-deploy.yml",
      `sdr_link_signing_secret: "{{ SDR_LINK_SIGNING_SECRET | default('') }}"`,
    ],
    [
      "ansible/production-deploy.yml",
      `sdr_link_signing_secret: "{{ SDR_LINK_SIGNING_SECRET | default('') }}"`,
    ],
    [
      "ansible/templates/docker-compose.yml.j2",
      "- SDR_LINK_SIGNING_SECRET={{ sdr_link_signing_secret }}",
    ],
    [".github/workflows/environments/staging.yml", "- SDR_LINK_SIGNING_SECRET"],
    [
      ".github/workflows/environments/production.yml",
      "- SDR_LINK_SIGNING_SECRET",
    ],
    [
      "scripts/local-deploy.sh",
      "SDR_LINK_SIGNING_SECRET=${SDR_LINK_SIGNING_SECRET:-}",
    ],
  ])("%s carries the secret", (relativePath, expected) => {
    expect(read(relativePath)).toContain(expected);
  });
});
