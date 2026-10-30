/**
 * @jest-environment node
 */
import { spawnSync } from "child_process";
import { join } from "path";
import { verifySdrToken } from "@/lib/sdr-link";

const repoRoot = join(__dirname, "..", "..");
const SECRET = "c".repeat(64);
const originalEnv = process.env;

function runCli(args: string[], secret: string | undefined = SECRET) {
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH };
  if (secret !== undefined) env.SDR_LINK_SIGNING_SECRET = secret;
  const result = spawnSync(
    process.execPath,
    [join(repoRoot, "scripts", "sdr-link.ts"), ...args],
    { env, encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe("scripts/sdr-link.ts", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, SDR_LINK_SIGNING_SECRET: SECRET };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("prints one console URL that verifies, and not the secret", () => {
    const { status, stdout, stderr } = runCli(["Alex Doe", "staging"]);
    const url = new URL(stdout.trim());

    expect(status).toBe(0);
    expect(url.origin).toBe("https://staging.boximity.ca");
    expect(url.pathname).toBe("/security-assessment/call");
    expect(verifySdrToken(url.searchParams.get("t"))).toEqual({
      isValid: true,
      sdrName: "Alex Doe",
    });
    expect(`${stdout}${stderr}`).not.toContain(SECRET);
  });

  it.each([
    ["no arguments", []],
    ["a blank name", ["  ", "staging"]],
    ["an unknown environment", ["Alex Doe", "dev"]],
  ])("fails on %s without printing a URL", (_name, args) => {
    const { status, stdout } = runCli(args);

    expect(status).toBe(1);
    expect(stdout).toBe("");
  });

  it("fails without the secret, naming it", () => {
    const { status, stdout, stderr } = runCli(["Alex Doe", "staging"], "");

    expect(status).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toContain("SDR_LINK_SIGNING_SECRET");
  });
});
