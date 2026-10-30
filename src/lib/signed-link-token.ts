import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed link tokens — no database, matching this stack's
 * single-container constraint (see rate-limit.ts). A token proves that
 * someone gave us an email for this scope before it expired. There is no
 * revocation: rotating LEAD_MAGNET_SIGNING_SECRET invalidates every token.
 * Subject tokens (signSubjectLinkToken, below) share the format, HMAC and
 * expiry handling but carry a readable subject and use their own secret.
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
const DEFAULT_SECRET_ENV_NAME = "LEAD_MAGNET_SIGNING_SECRET";
export const SUBJECT_TOKEN_SECRET_ENV_NAME = "SDR_LINK_SIGNING_SECRET";

export type LinkTokenFailureReason =
  "malformed" | "invalid-signature" | "expired";

export type LinkTokenVerification =
  { isValid: true } | { isValid: false; reason: LinkTokenFailureReason };

export type SubjectLinkTokenVerification =
  | { isValid: true; subject: string }
  | { isValid: false; reason: LinkTokenFailureReason };

function readSigningSecret(secretEnvName: string): string {
  const secret = process.env[secretEnvName];
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${secretEnvName} is not set (or shorter than ${MIN_SECRET_LENGTH} characters)`,
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
  tag,
  expiresAt,
}: {
  secret: string;
  scope: string;
  tag: string;
  expiresAt: number;
}): string {
  return computeHmac(secret, `${scope}:${tag}:${expiresAt}`).toString(
    "base64url",
  );
}

function assembleToken({
  secret,
  scope,
  tag,
  lifetimeMs,
}: {
  secret: string;
  scope: string;
  tag: string;
  lifetimeMs: number;
}): string {
  const expiresAt = Date.now() + lifetimeMs;
  const signature = signPayload({ secret, scope, tag, expiresAt });
  return `${expiresAt}.${tag}.${signature}`;
}

/** Checks shape, signature and expiry; returns the signed middle part. */
function verifyToken({
  secret,
  scope,
  token,
}: {
  secret: string;
  scope: string;
  token: string;
}):
  | { isValid: true; tag: string }
  | { isValid: false; reason: LinkTokenFailureReason } {
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0])) {
    return { isValid: false, reason: "malformed" };
  }
  const [expiresAtText, tag, signature] = parts;
  const expiresAt = Number(expiresAtText);

  const expectedSignature = Buffer.from(
    signPayload({ secret, scope, tag, expiresAt }),
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

  return { isValid: true, tag };
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
  const secret = readSigningSecret(DEFAULT_SECRET_ENV_NAME);
  const emailTag = computeHmac(secret, `email:${email.trim().toLowerCase()}`)
    .subarray(0, EMAIL_TAG_BYTES)
    .toString("base64url");
  return assembleToken({ secret, scope, tag: emailTag, lifetimeMs });
}

/** Throws only when LEAD_MAGNET_SIGNING_SECRET is unset or too short. */
export function verifyLinkToken({
  scope,
  token,
}: {
  scope: string;
  token: string;
}): LinkTokenVerification {
  const secret = readSigningSecret(DEFAULT_SECRET_ENV_NAME);
  const verification = verifyToken({ secret, scope, token });
  return verification.isValid ? { isValid: true } : verification;
}

/**
 * A token whose middle part is the subject itself (base64url UTF-8), not an
 * email digest, so the server can read back who it was issued to. Use only
 * for subjects that may appear in URLs and access logs (staff names, not
 * customer emails). Signed with its own secret, so rotating it never touches
 * lead-magnet or /install links. The scope must
 * contain a colon, like every non-lead-magnet scope.
 *
 * Throws only when the secret is unset or too short, or (signing) when the
 * subject is empty.
 */
export function signSubjectLinkToken({
  scope,
  subject,
  lifetimeMs,
}: {
  scope: string;
  subject: string;
  lifetimeMs: number;
}): string {
  const secret = readSigningSecret(SUBJECT_TOKEN_SECRET_ENV_NAME);
  if (subject.length === 0) {
    throw new Error("A signed link subject must not be empty");
  }
  const tag = Buffer.from(subject, "utf8").toString("base64url");
  return assembleToken({ secret, scope, tag, lifetimeMs });
}

/** Throws only when the secret is unset or too short. */
export function verifySubjectLinkToken({
  scope,
  token,
}: {
  scope: string;
  token: string;
}): SubjectLinkTokenVerification {
  const secret = readSigningSecret(SUBJECT_TOKEN_SECRET_ENV_NAME);
  const verification = verifyToken({ secret, scope, token });
  if (!verification.isValid) return verification;
  const subject = Buffer.from(verification.tag, "base64url").toString("utf8");
  if (subject.length === 0) {
    return { isValid: false, reason: "malformed" };
  }
  return { isValid: true, subject };
}
