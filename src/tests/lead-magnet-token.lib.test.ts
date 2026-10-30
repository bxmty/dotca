/**
 * @jest-environment node
 */
import {
  signLeadMagnetToken,
  verifyLeadMagnetToken,
} from "@/lib/lead-magnet-token";

const SECRET = "a".repeat(64);
const HOUR_MS = 60 * 60 * 1000;
const originalEnv = process.env;

describe("lead magnet download token", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, LEAD_MAGNET_SIGNING_SECRET: SECRET };
    jest.useFakeTimers({ now: new Date("2026-10-01T12:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it("verifies a token signed for the same slug", () => {
    const token = signLeadMagnetToken({
      slug: "test-guide",
      email: "jane@example.com",
    });

    expect(verifyLeadMagnetToken({ slug: "test-guide", token })).toEqual({
      isValid: true,
    });
  });

  it("keeps the token format byte-for-byte (issued links still verify)", () => {
    // Golden value from before the SDR token sibling was added (#711).
    expect(
      signLeadMagnetToken({ slug: "test-guide", email: "jane@example.com" }),
    ).toBe(
      "1790942400000.y0FG_-X8xnLewpKwriVL5A.7IfjQk5e1_xGvGF361Wl19st4BEg1R90si2t7YyGGwg",
    );
  });

  it("is URL-safe and does not carry the email address", () => {
    const token = signLeadMagnetToken({
      slug: "test-guide",
      email: "jane@example.com",
    });

    expect(token).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(token).not.toContain("jane");
    expect(Buffer.from(token, "base64url").toString("latin1")).not.toContain(
      "jane",
    );
  });

  it("still verifies just before the 24-hour expiry", () => {
    const token = signLeadMagnetToken({ slug: "test-guide", email: "j@x.io" });

    jest.advanceTimersByTime(24 * HOUR_MS - 1000);

    expect(verifyLeadMagnetToken({ slug: "test-guide", token }).isValid).toBe(
      true,
    );
  });

  it("rejects a token once 24 hours have passed", () => {
    const token = signLeadMagnetToken({ slug: "test-guide", email: "j@x.io" });

    jest.advanceTimersByTime(24 * HOUR_MS + 1000);

    expect(verifyLeadMagnetToken({ slug: "test-guide", token })).toEqual({
      isValid: false,
      reason: "expired",
    });
  });

  it("rejects a token whose signature has been tampered with", () => {
    const token = signLeadMagnetToken({ slug: "test-guide", email: "j@x.io" });
    const lastChar = token.slice(-1);
    const tampered = token.slice(0, -1) + (lastChar === "A" ? "B" : "A");

    expect(
      verifyLeadMagnetToken({ slug: "test-guide", token: tampered }),
    ).toEqual({ isValid: false, reason: "invalid-signature" });
  });

  it("rejects a token whose expiry has been pushed out", () => {
    const token = signLeadMagnetToken({ slug: "test-guide", email: "j@x.io" });
    const [expiresAt, ...rest] = token.split(".");
    const extended = [
      String(Number(expiresAt) + 7 * 24 * HOUR_MS),
      ...rest,
    ].join(".");

    jest.advanceTimersByTime(25 * HOUR_MS);

    expect(
      verifyLeadMagnetToken({ slug: "test-guide", token: extended }),
    ).toEqual({ isValid: false, reason: "invalid-signature" });
  });

  it("rejects a token signed for a different slug", () => {
    const token = signLeadMagnetToken({ slug: "other-guide", email: "j@x.io" });

    expect(verifyLeadMagnetToken({ slug: "test-guide", token })).toEqual({
      isValid: false,
      reason: "invalid-signature",
    });
  });

  it("rejects a token signed with a different secret", () => {
    const token = signLeadMagnetToken({ slug: "test-guide", email: "j@x.io" });
    process.env.LEAD_MAGNET_SIGNING_SECRET = "b".repeat(64);

    expect(verifyLeadMagnetToken({ slug: "test-guide", token })).toEqual({
      isValid: false,
      reason: "invalid-signature",
    });
  });

  it.each(["", "garbage", "1.2", "abc.def.ghi", "1.2.3.4"])(
    "rejects malformed token %p",
    (token) => {
      expect(verifyLeadMagnetToken({ slug: "test-guide", token })).toEqual({
        isValid: false,
        reason: "malformed",
      });
    },
  );

  it.each([undefined, "", "too-short"])(
    "refuses to sign or verify when the secret is %p",
    (secret) => {
      process.env.LEAD_MAGNET_SIGNING_SECRET = secret;

      expect(() =>
        signLeadMagnetToken({ slug: "test-guide", email: "j@x.io" }),
      ).toThrow(/LEAD_MAGNET_SIGNING_SECRET/);
      expect(() =>
        verifyLeadMagnetToken({ slug: "test-guide", token: "1.a.b" }),
      ).toThrow(/LEAD_MAGNET_SIGNING_SECRET/);
    },
  );
});
