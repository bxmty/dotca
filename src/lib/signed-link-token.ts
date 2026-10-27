import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed link tokens — no database, matching this stack's
 * single-container constraint (see rate-limit.ts). A token proves that
 * someone gave us an email for this scope before it expired. There is no
 * revocation: rotating LEAD_MAGNET_SIGNING_SECRET invalidates every token.
 *
 * Token format: `<expiresAtMs>.<emailTag>.<signature>`, where emailTag is a
 * keyed digest of the email (so the URL — which lands in proxy access logs —
 * carries no PII) and signature is HMAC-SHA256 over `scope:emailTag:expiresAt`.
 *
 * Scopes keep tokens for different links apart: a token signed for one scope
 * never verifies for another. Lead magnets use the bare slug (no colons); any
 * other link must use a scope containing a colon, e.g. `install:free-tier`,
 * so its signed payload can never equal a lead magnet's.
 */

const MIN_SECRET_LENGTH = 32;
const EMAIL_TAG_BYTES = 16;

export type LinkTokenVerification =
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
  scope,
  emailTag,
  expiresAt,
}: {
  secret: string;
  scope: string;
  emailTag: string;
  expiresAt: number;
}): string {
  return computeHmac(secret, `${scope}:${emailTag}:${expiresAt}`).toString(
    "base64url",
  );
}

/** Throws only when LEAD_MAGNET_SIGNING_SECRET is unset or too short. */
export function signLinkToken({
  scope,
  email,
  lifetimeMs,
}: {
  scope: string;
  email: string;
  lifetimeMs: number;
}): string {
  const secret = readSigningSecret();
  const expiresAt = Date.now() + lifetimeMs;
  const emailTag = computeHmac(secret, `email:${email.trim().toLowerCase()}`)
    .subarray(0, EMAIL_TAG_BYTES)
    .toString("base64url");
  const signature = signPayload({ secret, scope, emailTag, expiresAt });
  return `${expiresAt}.${emailTag}.${signature}`;
}

/** Throws only when LEAD_MAGNET_SIGNING_SECRET is unset or too short. */
export function verifyLinkToken({
  scope,
  token,
}: {
  scope: string;
  token: string;
}): LinkTokenVerification {
  const secret = readSigningSecret();

  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0])) {
    return { isValid: false, reason: "malformed" };
  }
  const [expiresAtText, emailTag, signature] = parts;
  const expiresAt = Number(expiresAtText);

  const expectedSignature = Buffer.from(
    signPayload({ secret, scope, emailTag, expiresAt }),
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
