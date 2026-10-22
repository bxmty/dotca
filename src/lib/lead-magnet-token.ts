import {
  signLinkToken,
  verifyLinkToken,
  type LinkTokenVerification,
} from "@/lib/signed-link-token";

/**
 * Signed download tokens for lead magnets: proof that someone gave us an
 * email for this slug in the last 24 hours. The slug is the token scope, so
 * the format is unchanged from before signed-link-token.ts was extracted and
 * tokens issued earlier still verify.
 */

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

export type LeadMagnetTokenVerification = LinkTokenVerification;

export function signLeadMagnetToken({
  slug,
  email,
}: {
  slug: string;
  email: string;
}): string {
  return signLinkToken({ scope: slug, email, lifetimeMs: TOKEN_LIFETIME_MS });
}

export function verifyLeadMagnetToken({
  slug,
  token,
}: {
  slug: string;
  token: string;
}): LeadMagnetTokenVerification {
  return verifyLinkToken({ scope: slug, token });
}
