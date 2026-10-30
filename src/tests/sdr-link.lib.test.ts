/**
 * @jest-environment node
 */
import {
  buildSdrConsoleUrl,
  isSdrLinkEnvironment,
  signSdrToken,
  verifySdrToken,
} from "@/lib/sdr-link";
import { checkInstallToken } from "@/lib/install-link";
import {
  signLeadMagnetToken,
  verifyLeadMagnetToken,
} from "@/lib/lead-magnet-token";
import { signSubjectLinkToken } from "@/lib/signed-link-token";

const SDR_SECRET = "s".repeat(64);
const LEAD_MAGNET_SECRET = "a".repeat(64);
const DAY_MS = 24 * 60 * 60 * 1000;
const originalEnv = process.env;

describe("SDR link token", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SDR_LINK_SIGNING_SECRET: SDR_SECRET,
      LEAD_MAGNET_SIGNING_SECRET: LEAD_MAGNET_SECRET,
    };
    jest.useFakeTimers({ now: new Date("2026-10-01T12:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it("verifies and reads back the SDR's name", () => {
    const token = signSdrToken({ name: "Alex Doe" });

    expect(verifySdrToken(token)).toEqual({
      isValid: true,
      sdrName: "Alex Doe",
    });
  });

  it("normalizes whitespace in the name", () => {
    const token = signSdrToken({ name: "  Alex   Doe " });

    expect(verifySdrToken(token)).toEqual({
      isValid: true,
      sdrName: "Alex Doe",
    });
  });

  it("keeps non-ASCII names intact and the token URL-safe", () => {
    const token = signSdrToken({ name: "Zoë Côté" });

    expect(token).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(verifySdrToken(token)).toEqual({
      isValid: true,
      sdrName: "Zoë Côté",
    });
  });

  it.each(["", "   ", "x".repeat(101)])(
    "refuses to sign for name %p",
    (name) => {
      expect(() => signSdrToken({ name })).toThrow(/SDR name/);
    },
  );

  it("still verifies just before the 90-day expiry", () => {
    const token = signSdrToken({ name: "Alex Doe" });

    jest.advanceTimersByTime(90 * DAY_MS - 1000);

    expect(verifySdrToken(token).isValid).toBe(true);
  });

  it("rejects a token once 90 days have passed", () => {
    const token = signSdrToken({ name: "Alex Doe" });

    jest.advanceTimersByTime(90 * DAY_MS);

    expect(verifySdrToken(token)).toEqual({
      isValid: false,
      reason: "expired",
    });
  });

  it("rejects a token whose name has been swapped", () => {
    const [expiresAt, , signature] = signSdrToken({ name: "Alex Doe" }).split(
      ".",
    );
    const swapped = [
      expiresAt,
      Buffer.from("Sam Smith").toString("base64url"),
      signature,
    ].join(".");

    expect(verifySdrToken(swapped)).toEqual({
      isValid: false,
      reason: "invalid-signature",
    });
  });

  it("rejects a token whose signature has been tampered with", () => {
    const token = signSdrToken({ name: "Alex Doe" });
    const lastChar = token.slice(-1);
    const tampered = token.slice(0, -1) + (lastChar === "A" ? "B" : "A");

    expect(verifySdrToken(tampered)).toEqual({
      isValid: false,
      reason: "invalid-signature",
    });
  });

  it.each([null, undefined, ""])("reports %p as missing", (token) => {
    expect(verifySdrToken(token)).toEqual({
      isValid: false,
      reason: "missing",
    });
  });

  it.each(["garbage", "1.2", "abc.def.ghi", "1.2.3.4"])(
    "rejects malformed token %p",
    (token) => {
      expect(verifySdrToken(token)).toEqual({
        isValid: false,
        reason: "malformed",
      });
    },
  );

  it("rejects a validly signed token with an empty subject", () => {
    const [expiresAt, , signature] = signSdrToken({ name: "x" }).split(".");
    // An empty middle part can only be signed by someone holding the secret,
    // but the console must still never render an anonymous SDR.
    const emptySubject = `${expiresAt}..${signature}`;

    expect(verifySdrToken(emptySubject).isValid).toBe(false);
  });

  it("rejects a token signed with a different SDR secret", () => {
    const token = signSdrToken({ name: "Alex Doe" });
    process.env.SDR_LINK_SIGNING_SECRET = "r".repeat(64);

    expect(verifySdrToken(token)).toEqual({
      isValid: false,
      reason: "invalid-signature",
    });
  });

  describe("scope and secret separation", () => {
    it("rejects an assessment:sdr token signed with the lead-magnet secret", () => {
      const token = signSubjectLinkToken({
        secretEnvName: "LEAD_MAGNET_SIGNING_SECRET",
        scope: "assessment:sdr",
        subject: "Alex Doe",
        lifetimeMs: DAY_MS,
      });

      expect(verifySdrToken(token)).toEqual({
        isValid: false,
        reason: "invalid-signature",
      });
    });

    it("rejects a token signed with the SDR secret for another scope", () => {
      const token = signSubjectLinkToken({
        secretEnvName: "SDR_LINK_SIGNING_SECRET",
        scope: "assessment:other",
        subject: "Alex Doe",
        lifetimeMs: DAY_MS,
      });

      expect(verifySdrToken(token)).toEqual({
        isValid: false,
        reason: "invalid-signature",
      });
    });

    it("rejects a lead-magnet token even when the secrets match", () => {
      process.env.SDR_LINK_SIGNING_SECRET = LEAD_MAGNET_SECRET;
      const leadMagnetToken = signLeadMagnetToken({
        slug: "test-guide",
        email: "jane@example.com",
      });

      expect(verifySdrToken(leadMagnetToken).isValid).toBe(false);
    });

    it("never verifies an SDR token as a lead-magnet or install token", () => {
      process.env.SDR_LINK_SIGNING_SECRET = LEAD_MAGNET_SECRET;
      const token = signSdrToken({ name: "Alex Doe" });

      expect(verifyLeadMagnetToken({ slug: "test-guide", token })).toEqual({
        isValid: false,
        reason: "invalid-signature",
      });
      expect(checkInstallToken(token)).toBe("invalid-signature");
    });
  });

  it.each([undefined, "", "too-short"])(
    "refuses to sign or verify when the SDR secret is %p",
    (secret) => {
      process.env.SDR_LINK_SIGNING_SECRET = secret;

      expect(() => signSdrToken({ name: "Alex Doe" })).toThrow(
        /SDR_LINK_SIGNING_SECRET/,
      );
      expect(() => verifySdrToken("1.a.b")).toThrow(/SDR_LINK_SIGNING_SECRET/);
    },
  );

  it("does not fall back to the lead-magnet secret", () => {
    delete process.env.SDR_LINK_SIGNING_SECRET;

    expect(() => signSdrToken({ name: "Alex Doe" })).toThrow(
      /SDR_LINK_SIGNING_SECRET/,
    );
  });

  describe("console URL", () => {
    it.each([
      ["production", "https://boximity.ca"],
      ["staging", "https://staging.boximity.ca"],
      ["local", "http://localhost:3000"],
    ] as const)(
      "links %s to its own console with a verifiable token",
      (environment, origin) => {
        const url = new URL(
          buildSdrConsoleUrl({ name: "Alex Doe", environment }),
        );

        expect(url.origin).toBe(origin);
        expect(url.pathname).toBe("/security-assessment/call");
        expect(verifySdrToken(url.searchParams.get("t"))).toEqual({
          isValid: true,
          sdrName: "Alex Doe",
        });
      },
    );

    it("does not carry the secret", () => {
      expect(
        buildSdrConsoleUrl({ name: "Alex Doe", environment: "production" }),
      ).not.toContain(SDR_SECRET);
    });

    it.each([
      ["production", true],
      ["staging", true],
      ["local", true],
      ["dev", false],
      ["toString", false],
    ])("treats %p as an environment: %p", (value, expected) => {
      expect(isSdrLinkEnvironment(value)).toBe(expected);
    });
  });
});
