import * as Sentry from "@sentry/nextjs";
import { verifySdrToken, type SdrTokenVerification } from "./sdr-link";

/** A token's verdict; "secret-unset" means it couldn't be checked at all. */
export type SdrSessionCheck =
  SdrTokenVerification | { isValid: false; reason: "secret-unset" };

export function checkSdrSession(
  token: string | null | undefined,
): SdrSessionCheck {
  try {
    return verifySdrToken(token);
  } catch {
    return { isValid: false, reason: "secret-unset" };
  }
}

/**
 * The SDR named in a token, or undefined for anything the console should 404
 * on. A missing secret is a deployment fault, so it warns as well.
 */
export function readSdrName(
  token: string | null | undefined,
): string | undefined {
  const session = checkSdrSession(token);
  if (session.isValid) return session.sdrName;
  if (session.reason === "secret-unset") {
    Sentry.captureMessage(
      "/security-assessment/call requested but SDR_LINK_SIGNING_SECRET is unset or too short, so SDR tokens cannot be checked",
      "warning",
    );
  }
  return undefined;
}
