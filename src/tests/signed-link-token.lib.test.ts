/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import { createHmac } from "node:crypto";
import {
  signLinkToken,
  signSubjectLinkToken,
  verifyLinkToken,
  verifySubjectLinkToken,
} from "@/lib/signed-link-token";

const SECRET = "k".repeat(64);
const HOUR_MS = 60 * 60 * 1000;
const originalEnv = process.env;

describe("signed link tokens", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEAD_MAGNET_SIGNING_SECRET: SECRET,
      SDR_LINK_SIGNING_SECRET: SECRET,
    };
    jest.useFakeTimers({ now: new Date("2026-10-01T12:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  describe("signing secret length", () => {
    it("accepts a secret of exactly 32 characters", () => {
      process.env.LEAD_MAGNET_SIGNING_SECRET = "k".repeat(32);

      const token = signLinkToken({
        scope: "guide",
        email: "a@b.ca",
        lifetimeMs: HOUR_MS,
      });

      expect(verifyLinkToken({ scope: "guide", token })).toEqual({
        isValid: true,
      });
    });

    it("rejects a secret of 31 characters", () => {
      process.env.LEAD_MAGNET_SIGNING_SECRET = "k".repeat(31);

      expect(() =>
        signLinkToken({ scope: "guide", email: "a@b.ca", lifetimeMs: HOUR_MS }),
      ).toThrow(/LEAD_MAGNET_SIGNING_SECRET/);
    });
  });

  it.each(["abc123.x.y", "123abc.x.y"])(
    "reports a non-numeric expiry in %p as malformed",
    (token) => {
      expect(verifyLinkToken({ scope: "guide", token })).toEqual({
        isValid: false,
        reason: "malformed",
      });
    },
  );

  it("signs the same token for an email regardless of case and padding", () => {
    const padded = signLinkToken({
      scope: "guide",
      email: " A@b.ca ",
      lifetimeMs: HOUR_MS,
    });
    const plain = signLinkToken({
      scope: "guide",
      email: "a@b.ca",
      lifetimeMs: HOUR_MS,
    });

    expect(padded).toBe(plain);
  });

  describe("subject tokens", () => {
    it("refuses to sign an empty subject", () => {
      expect(() =>
        signSubjectLinkToken({
          scope: "assessment:sdr",
          subject: "",
          lifetimeMs: HOUR_MS,
        }),
      ).toThrow("A signed link subject must not be empty");
    });

    it("reports a correctly signed token with an empty subject as malformed", () => {
      const expiresAt = Date.now() + HOUR_MS;
      // Hand-signed the way the signer would, had it allowed an empty subject.
      const signature = createHmac("sha256", SECRET)
        .update(`assessment:sdr::${expiresAt}`)
        .digest("base64url");

      expect(
        verifySubjectLinkToken({
          scope: "assessment:sdr",
          token: `${expiresAt}..${signature}`,
        }),
      ).toEqual({ isValid: false, reason: "malformed" });
    });
  });
});
