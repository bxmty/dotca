import { signLinkToken, verifyLinkToken } from "@/lib/signed-link-token";
import { SITE_URL } from "@/lib/schema";

/**
 * Per-signup links to /install, the redirect to the Free-tier Syncro agent
 * installer. The installer lets anyone enroll a device into the RMM, so
 * /install only redirects for a token issued to an onboarding signup in the
 * last 7 days, sent in their day-0 confirmation email.
 *
 * 7 days rather than the lead magnets' 24 hours: installing an agent waits on
 * someone's free afternoon, not a download click.
 */

const INSTALL_TOKEN_SCOPE = "install:free-tier";
const INSTALL_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const STAGING_SITE_URL = "https://staging.boximity.ca";

/** The query parameter /install reads the token from. */
export const INSTALL_TOKEN_PARAM = "t";

// Staging and production sign with different secrets, so a staging email
// must link back to staging. Same staging signal as syncro.ts (#554).
function readSiteUrl(): string {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "staging"
    ? STAGING_SITE_URL
    : SITE_URL;
}

/**
 * The signed /install URL for this signup's email. Throws only when
 * LEAD_MAGNET_SIGNING_SECRET is unset or too short.
 */
export function buildInstallUrl(email: string): string {
  const token = signLinkToken({
    scope: INSTALL_TOKEN_SCOPE,
    email,
    lifetimeMs: INSTALL_TOKEN_LIFETIME_MS,
  });
  const query = new URLSearchParams({ [INSTALL_TOKEN_PARAM]: token });
  return `${readSiteUrl()}/install?${query}`;
}

export type InstallTokenCheck =
  "valid" | "missing" | "malformed" | "invalid-signature" | "expired";

/**
 * Checks a token from the /install query string. Throws only when
 * LEAD_MAGNET_SIGNING_SECRET is unset or too short.
 */
export function checkInstallToken(token: string | null): InstallTokenCheck {
  if (!token) return "missing";
  const verification = verifyLinkToken({ scope: INSTALL_TOKEN_SCOPE, token });
  return verification.isValid ? "valid" : verification.reason;
}
