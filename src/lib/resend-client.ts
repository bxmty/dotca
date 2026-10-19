import * as Sentry from "@sentry/nextjs";
import type { Resend } from "resend";

/**
 * What the best-effort Resend writes share (the brief opt-in, the
 * paid-customer flag and the confirmation email): running one SDK call down
 * to a PII-free result, fetching whether an address is a contact, and reporting a failure
 * as a Sentry warning. None of these throw.
 */

type ResendSdkResult = { error: { name: string } | null };

/** One Resend call's outcome: on failure, a PII-free failure code only. */
export type ResendCallResult =
  { ok: true } | { ok: false; failureCode: string };

/**
 * Run one Resend call down to its outcome. The failure code is the API
 * error's name, or "exception" when the SDK threw: error messages can echo
 * the address, so they are never reported.
 */
export async function runResendCall(
  call: () => Promise<ResendSdkResult>,
): Promise<ResendCallResult> {
  try {
    const { error } = await call();
    return error ? { ok: false, failureCode: error.name } : { ok: true };
  } catch {
    return { ok: false, failureCode: "exception" };
  }
}

/** Whether an address is a Resend contact, as one discriminated result. */
export type ContactLookup =
  | { status: "exists" }
  | { status: "missing" }
  | { status: "failed"; failureCode: string };

/**
 * Fetch whether the address is a contact: Resend answers `not_found` (404) for an address that
 * isn't a contact; any other error is a PII-free failure code, as in
 * runResendCall.
 */
export async function fetchContactStatus(
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

/**
 * Log and send a PII-free failure to Sentry as a warning, worded
 * "<summary>: <detail>". The one reporter every best-effort Resend write
 * uses, so their warnings read alike: the summary names the write (and its
 * form or source), the detail is a failure code or missing-env list.
 */
export function reportResendWarning(summary: string, detail: string): void {
  const message = `${summary}: ${detail}`;
  console.warn(message);
  Sentry.captureMessage(message, "warning");
}
