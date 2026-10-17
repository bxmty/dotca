import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed download tokens for lead magnets — no database, matching
 * this stack's single-container constraint (see rate-limit.ts). A token proves
 * that someone gave us an email for this slug in the last 24 hours. There is
 * no revocation: rotating LEAD_MAGNET_SIGNING_SECRET invalidates every token.
 *
 * Token format: `<expiresAtMs>.<emailTag>.<signature>`, where emailTag is a
 * keyed digest of the email (so the URL — which lands in proxy access logs —
 * carries no PII) and signature is HMAC-SHA256 over `slug:emailTag:expiresAt`.
 */

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;
const EMAIL_TAG_BYTES = 16;

export type LeadMagnetTokenVerification =
  | { isValid: true }
  | { isValid: false; reason: "malformed" | "invalid-signature" | "expired" };

function readSigningSecret(): string {
  const secret = process.env.LEAD_MAGNET_SIGNING_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `LEAD_MAGNET_SIGNING_SECRET is not set (or shorter than ${MIN_SECRET_LENGTH} characters)`,
    );
  }
  return secret;
}

function computeHmac(secret: string, value: string): Buffer {
  return createHmac("sha256", secret).update(value).digest();
}

function signPayload({
  secret,
  slug,
  emailTag,
  expiresAt,
}: {
  secret: string;
  slug: string;
  emailTag: string;
  expiresAt: number;
}): string {
  return computeHmac(secret, `${slug}:${emailTag}:${expiresAt}`).toString(
    "base64url",
  );
}

export function signLeadMagnetToken({
  slug,
  email,
}: {
  slug: string;
  email: string;
}): string {
  const secret = readSigningSecret();
  const expiresAt = Date.now() + TOKEN_LIFETIME_MS;
  const emailTag = computeHmac(secret, `email:${email.trim().toLowerCase()}`)
    .subarray(0, EMAIL_TAG_BYTES)
    .toString("base64url");
  const signature = signPayload({ secret, slug, emailTag, expiresAt });
  return `${expiresAt}.${emailTag}.${signature}`;
}

export function verifyLeadMagnetToken({
  slug,
  token,
}: {
  slug: string;
  token: string;
}): LeadMagnetTokenVerification {
  const secret = readSigningSecret();

  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0])) {
    return { isValid: false, reason: "malformed" };
  }
  const [expiresAtText, emailTag, signature] = parts;
  const expiresAt = Number(expiresAtText);

  const expectedSignature = Buffer.from(
    signPayload({ secret, slug, emailTag, expiresAt }),
  );
  const providedSignature = Buffer.from(signature);
  // Compare the encoded strings, not decoded bytes: base64url has spare bits
  // in its last character, so two different strings can decode identically.
  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return { isValid: false, reason: "invalid-signature" };
  }

  if (Date.now() >= expiresAt) {
    return { isValid: false, reason: "expired" };
  }

  return { isValid: true };
}
