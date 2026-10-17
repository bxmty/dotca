import * as Sentry from "@sentry/nextjs";
import type { Resend } from "resend";

/**
 * What the best-effort Resend writes share (the brief opt-in, the
 * paid-customer flag and the confirmation email): running one SDK call down
 * to a PII-free failure code, looking a contact up, and reporting a failure
 * as a Sentry warning. None of these throw.
 */

type ResendCallResult = { error: { name: string } | null };

/**
 * Run one Resend call and return its failure code, or null when it worked.
 * The code is the API error's name, or "exception" when the SDK threw: error
 * messages can echo the address, so they are never reported.
 */
export async function runResendCall(
  call: () => Promise<ResendCallResult>,
): Promise<string | null> {
  try {
    const { error } = await call();
    return error ? error.name : null;
  } catch {
    return "exception";
  }
}

/** Whether an address is a Resend contact, as one discriminated result. */
export type ContactLookup =
  | { status: "exists" }
  | { status: "missing" }
  | { status: "failed"; failureCode: string };

/**
 * Look the address up: Resend answers `not_found` (404) for an address that
 * isn't a contact; any other error is a PII-free failure code, as in
 * runResendCall.
 */
export async function lookUpContact(
  resend: Resend,
  email: string,
): Promise<ContactLookup> {
  try {
    const { error } = await resend.contacts.get({ email });
    if (!error) return { status: "exists" };
    if (error.name === "not_found" || error.statusCode === 404) {
      return { status: "missing" };
    }
    return { status: "failed", failureCode: error.name };
  } catch {
    return { status: "failed", failureCode: "exception" };
  }
}

/** Log and send a PII-free failure message to Sentry as a warning. */
export function reportResendWarning(message: string): void {
  console.warn(message);
  Sentry.captureMessage(message, "warning");
}
