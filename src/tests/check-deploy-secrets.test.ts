/**
 * @jest-environment node
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * The deploy gate: one script decides which secrets fail a deploy and which
 * only warn, so the deploy action holds no per-secret checks of its own.
 */
const repoRoot = join(__dirname, "..", "..");
const SCRIPT = join(repoRoot, "scripts", "check-deploy-secrets.sh");

const REQUIRED = [
  "DO_TOKEN",
  "SSH_PRIVATE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GA4_MP_API_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "WEBMASTER_EMAIL",
  "SYNCRO_SUBDOMAIN",
  "SYNCRO_API_KEY",
];
const WARN_ONLY = [
  "SYNCRO_FREE_INSTALLER_URL",
  "RESEND_MONTHLY_BRIEF_SEGMENT_ID",
  "RESEND_MONTHLY_BRIEF_TOPIC_ID",
  "RESEND_OPTIN_EVENT",
  "RESEND_TEMPLATE_CONTACT_CONFIRMATION",
  "RESEND_TEMPLATE_ONBOARDING_CONFIRMATION",
];
const SECRET_VALUE = "secret-value-never-printed";

function allSet(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    LEAD_MAGNET_SIGNING_SECRET: "a".repeat(64),
  };
  for (const name of [...REQUIRED, ...WARN_ONLY]) env[name] = SECRET_VALUE;
  return env;
}

function runGate(
  environment: string,
  { unset = [] as string[], isGitHubActions = false } = {},
) {
  const env = allSet();
  for (const name of unset) delete env[name];
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

describe("scripts/check-deploy-secrets.sh", () => {
  it.each(["staging", "production"])(
    "passes quietly for %s when every secret is set",
    (environment) => {
      const { status, output } = runGate(environment);

      expect(status).toBe(0);
      expect(output).toBe("");
    },
  );

  it.each(REQUIRED)("fails the deploy when %s is missing", (name) => {
    const { status, output } = runGate("staging", { unset: [name] });

    expect(status).toBe(1);
    expect(output).toMatch(
      new RegExp(`error: ${name} environment variable is required`, "i"),
    );
  });

  it.each(WARN_ONLY)("only warns when %s is missing", (name) => {
    const { status, output } = runGate("production", { unset: [name] });

    expect(status).toBe(0);
    expect(output).toMatch(new RegExp(`warning: ${name} is not set`, "i"));
  });

  it("reports every missing required secret before failing", () => {
    const { status, output } = runGate("staging", {
      unset: ["DO_TOKEN", "SYNCRO_API_KEY"],
    });

    expect(status).toBe(1);
    expect(output).toContain("DO_TOKEN");
    expect(output).toContain("SYNCRO_API_KEY");
  });

  it("applies the lead-magnet rule: production fails, staging warns", () => {
    const unset = ["LEAD_MAGNET_SIGNING_SECRET"];

    expect(runGate("production", { unset }).status).toBe(1);
    expect(runGate("staging", { unset }).status).toBe(0);
  });

  it("emits GitHub annotations under Actions", () => {
    const { output } = runGate("staging", {
      unset: ["DO_TOKEN", "RESEND_OPTIN_EVENT"],
      isGitHubActions: true,
    });

    expect(output).toMatch(/^::error::DO_TOKEN/m);
    expect(output).toMatch(/^::warning::RESEND_OPTIN_EVENT/m);
  });

  it("never prints a secret value", () => {
    expect(runGate("staging", { unset: ["DO_TOKEN"] }).output).not.toContain(
      SECRET_VALUE,
    );
  });

  it("is the gate the deploy action runs", () => {
    const action = readFileSync(
      join(repoRoot, ".github/actions/deploy/action.yml"),
      "utf8",
    );

    expect(action).toContain("scripts/check-deploy-secrets.sh");
    expect(action).not.toMatch(/environment variable is required/);
  });
});
