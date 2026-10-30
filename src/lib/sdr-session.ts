import * as Sentry from "@sentry/nextjs";
import { verifySdrToken } from "./sdr-link";

/**
 * The SDR named in a token, or null for anything the console should 404 on.
 * A missing secret is a deployment fault, so it warns as well.
 */
export function readSdrName(token: string | null | undefined): string | null {
  try {
    const verification = verifySdrToken(token);
    return verification.isValid ? verification.sdrName : null;
  } catch {
    Sentry.captureMessage(
      "/security-assessment/call requested but SDR_LINK_SIGNING_SECRET is unset or too short, so SDR tokens cannot be checked",
      "warning",
    );
    return null;
  }
}
