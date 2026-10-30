import {
  signSubjectLinkToken,
  verifySubjectLinkToken,
  type LinkTokenFailureReason,
} from "./signed-link-token.ts";

/**
 * Per-SDR links to the discovery-call console (/security-assessment/call,
 * #710). The token carries the SDR's name so every call-captured lead records
 * who ran it, never a typed value. Signed with SDR_LINK_SIGNING_SECRET, not
 * the lead-magnet secret: rotating it revokes every SDR link (reissue them to
 * the team) without touching lead-magnet or /install links.
 *
 * Imports use explicit .ts extensions so scripts/sdr-link.ts can run this
 * module under plain `node` for `just sdr-link`.
 */

export const SDR_TOKEN_SCOPE = "assessment:sdr";
export const SDR_LINK_SECRET_ENV_NAME = "SDR_LINK_SIGNING_SECRET";
const SDR_TOKEN_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_SDR_NAME_LENGTH = 100;

/** The query parameter the console reads the token from. */
export const SDR_TOKEN_PARAM = "t";
export const SDR_CONSOLE_PATH = "/security-assessment/call";

const SITE_URL_BY_ENVIRONMENT = {
  production: "https://boximity.ca",
  staging: "https://staging.boximity.ca",
  local: "http://localhost:3000",
} as const;

export type SdrLinkEnvironment = keyof typeof SITE_URL_BY_ENVIRONMENT;

export type SdrTokenVerification =
  | { isValid: true; sdrName: string }
  | { isValid: false; reason: LinkTokenFailureReason | "missing" };

function normalizeSdrName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (normalized.length === 0 || normalized.length > MAX_SDR_NAME_LENGTH) {
    throw new Error(
      `SDR name must be 1 to ${MAX_SDR_NAME_LENGTH} characters after trimming`,
    );
  }
  return normalized;
}

/**
 * Throws when SDR_LINK_SIGNING_SECRET is unset or too short, or the name is
 * blank or longer than 100 characters.
 */
export function signSdrToken({ name }: { name: string }): string {
  return signSubjectLinkToken({
    secretEnvName: SDR_LINK_SECRET_ENV_NAME,
    scope: SDR_TOKEN_SCOPE,
    subject: normalizeSdrName(name),
    lifetimeMs: SDR_TOKEN_LIFETIME_MS,
  });
}

/**
 * Checks a token from the console URL or an API request. Throws only when
 * SDR_LINK_SIGNING_SECRET is unset or too short.
 */
export function verifySdrToken(
  token: string | null | undefined,
): SdrTokenVerification {
  if (!token) return { isValid: false, reason: "missing" };
  const verification = verifySubjectLinkToken({
    secretEnvName: SDR_LINK_SECRET_ENV_NAME,
    scope: SDR_TOKEN_SCOPE,
    token,
  });
  return verification.isValid
    ? { isValid: true, sdrName: verification.subject }
    : verification;
}

/** The console URL for an SDR in an environment, signed with its secret. */
export function buildSdrConsoleUrl({
  name,
  environment,
}: {
  name: string;
  environment: SdrLinkEnvironment;
}): string {
  const query = new URLSearchParams({
    [SDR_TOKEN_PARAM]: signSdrToken({ name }),
  });
  return `${SITE_URL_BY_ENVIRONMENT[environment]}${SDR_CONSOLE_PATH}?${query}`;
}

export function isSdrLinkEnvironment(
  value: string,
): value is SdrLinkEnvironment {
  return Object.hasOwn(SITE_URL_BY_ENVIRONMENT, value);
}
