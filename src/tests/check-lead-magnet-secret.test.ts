/**
 * @jest-environment node
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * LEAD_MAGNET_SIGNING_SECRET must not block staging or local deploys (#604),
 * but production must never ship without it: every download link would 503.
 * One script holds that rule for the deploy gate (check-deploy-secrets.sh),
 * `just validate` and local-deploy.sh.
 */
const repoRoot = join(__dirname, "..", "..");
const SCRIPT = join(repoRoot, "scripts", "check-lead-magnet-secret.sh");
const VALID_SECRET = "a".repeat(64);

function runCheck(
  environment: string,
  secret: string | undefined,
  { isGitHubActions = false } = {},
) {
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH };
  if (secret !== undefined) env.LEAD_MAGNET_SIGNING_SECRET = secret;
  if (isGitHubActions) env.GITHUB_ACTIONS = "true";
  const result = spawnSync("bash", [SCRIPT, environment], {
    env,
    encoding: "utf8",
  });
  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

describe("scripts/check-lead-magnet-secret.sh", () => {
  it.each(["staging", "local", "production"])(
    "passes quietly for %s when the secret is set",
    (environment) => {
      const { status, output } = runCheck(environment, VALID_SECRET);

      expect(status).toBe(0);
      expect(output).toBe("");
    },
  );

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["shorter than 32 characters", "too-short"],
  ])("fails production when the secret is %s", (_name, secret) => {
    const { status, output } = runCheck("production", secret);

    expect(status).toBe(1);
    expect(output).toMatch(/LEAD_MAGNET_SIGNING_SECRET/);
  });

  it.each(["staging", "local"])(
    "only warns for %s when the secret is missing",
    (environment) => {
      const { status, output } = runCheck(environment, undefined);

      expect(status).toBe(0);
      expect(output).toMatch(/warning.*LEAD_MAGNET_SIGNING_SECRET/i);
    },
  );

  it("emits GitHub annotations under Actions", () => {
    expect(
      runCheck("production", undefined, { isGitHubActions: true }).output,
    ).toMatch(/^::error::/m);
    expect(
      runCheck("staging", undefined, { isGitHubActions: true }).output,
    ).toMatch(/^::warning::/m);
  });

  it("never prints the secret", () => {
    const { output } = runCheck("production", "short-secret-value");

    expect(output).not.toContain("short-secret-value");
  });

  it.each([
    "scripts/check-deploy-secrets.sh",
    "justfile",
    "scripts/local-deploy.sh",
  ])("is the guard %s uses", (relativePath) => {
    const source = readFileSync(join(repoRoot, relativePath), "utf8");

    expect(source).toContain("check-lead-magnet-secret.sh");
    expect(source).not.toMatch(
      /LEAD_MAGNET_SIGNING_SECRET (environment variable is required|not set in)/,
    );
  });
});
