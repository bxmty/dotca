import { createHash } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

/**
 * The day-0 confirmation email (bxmty/dotca#646, #642 decisions 2, 4, 7, 10,
 * 21): one non-commercial "thanks, here's what happens next" email to every
 * genuine contact or onboarding submitter, opted in or not. The copy lives
 * in a published Resend template (#645); this only picks the template and
 * fills in USER_FIRST_NAME.
 *
 * Best-effort by design: it never throws, and sits outside the delivery
 * matrix. A failure or missing env var is a PII-free Sentry warning and an
 * `isSent: false` result, never a failed submission.
 */

export type ConfirmationFormType = "contact" | "onboarding";

export interface ConfirmationEmail {
  formType: ConfirmationFormType;
  email: string;
  /** Omitted from the template variables when blank (template fallback). */
  firstName?: string;
}

export interface ConfirmationEmailResult {
  isSent: boolean;
}

const TEMPLATE_ENV_NAMES = {
  contact: "RESEND_TEMPLATE_CONTACT_CONFIRMATION",
  onboarding: "RESEND_TEMPLATE_ONBOARDING_CONFIRMATION",
} as const satisfies Record<ConfirmationFormType, string>;

const REPLY_TO = "hi@boximity.ca";

// The idempotency key's day is Toronto's calendar day, where the business
// and nearly all submitters are, so "one per person per form per day"
// matches the day the submitter sees.
const KEY_TIME_ZONE = "America/Toronto";

/**
 * `followup-<formType>/<sha256(email)>/<YYYY-MM-DD>` (#642 decision 10): a
 * repeat submission the same day sends nothing new. The address is trimmed
 * and lower-cased before hashing so case or spacing differences share one
 * key, and only the hash is sent, never the raw address.
 */
function buildIdempotencyKey(
  formType: ConfirmationFormType,
  email: string,
): string {
  const emailHash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  // en-CA formats as YYYY-MM-DD
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: KEY_TIME_ZONE,
  }).format(new Date());
  return `followup-${formType}/${emailHash}/${date}`;
}

function reportFailure(formType: ConfirmationFormType, detail: string): void {
  const message = `Confirmation email not sent (${formType}): ${detail}`;
  console.warn(message);
  Sentry.captureMessage(message, "warning");
}

export async function sendConfirmationEmail({
  formType,
  email,
  firstName,
}: ConfirmationEmail): Promise<ConfirmationEmailResult> {
  const templateEnvName = TEMPLATE_ENV_NAMES[formType];
  const missingEnvNames = [
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    templateEnvName,
  ].filter((name) => !process.env[name]);
  if (missingEnvNames.length > 0) {
    reportFailure(formType, `${missingEnvNames.join(", ")} not set`);
    return { isSent: false };
  }

  // Omitted, not "", when unknown: the template's fallback is documented to
  // apply to a missing variable, not to an empty one
  const trimmedFirstName = firstName?.trim();
  const variables: Record<string, string> = trimmedFirstName
    ? { USER_FIRST_NAME: trimmedFirstName }
    : {};

  // Only the API error's name or "exception" is reported: error messages
  // can echo the recipient address
  let failureCode: string | null;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send(
      {
        from: `Boximity <${process.env.RESEND_FROM_EMAIL}>`,
        to: email,
        replyTo: REPLY_TO,
        template: {
          id: process.env[templateEnvName] as string,
          variables,
        },
      },
      { idempotencyKey: buildIdempotencyKey(formType, email) },
    );
    failureCode = error ? error.name : null;
  } catch {
    failureCode = "exception";
  }

  if (failureCode) {
    reportFailure(formType, failureCode);
    return { isSent: false };
  }
  return { isSent: true };
}
