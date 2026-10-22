/**
 * @jest-environment node
 */
import { buildInstallUrl, checkInstallToken } from "@/lib/install-link";

const originalEnv = process.env;

describe("install link", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEAD_MAGNET_SIGNING_SECRET: "a".repeat(64),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("links to production /install with a token that checks as valid", () => {
    const url = new URL(buildInstallUrl("jane@example.com"));

    expect(url.origin).toBe("https://boximity.ca");
    expect(url.pathname).toBe("/install");
    expect(checkInstallToken(url.searchParams.get("t"))).toBe("valid");
  });

  it("links to staging from a staging deploy, whose secret differs", () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";

    expect(new URL(buildInstallUrl("jane@example.com")).origin).toBe(
      "https://staging.boximity.ca",
    );
  });

  it("does not carry the email address", () => {
    const url = buildInstallUrl("jane@example.com");

    expect(url).not.toContain("jane");
    expect(url).not.toContain("example.com");
  });

  it.each([
    [null, "missing"],
    ["", "missing"],
    ["junk", "malformed"],
  ])("checks %p as %s", (token, expected) => {
    expect(checkInstallToken(token)).toBe(expected);
  });

  it("throws when the signing secret is missing", () => {
    delete process.env.LEAD_MAGNET_SIGNING_SECRET;

    expect(() => buildInstallUrl("jane@example.com")).toThrow(
      "LEAD_MAGNET_SIGNING_SECRET",
    );
  });
});
