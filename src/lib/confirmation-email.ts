import { createHash } from "node:crypto";
import { Resend } from "resend";
import { normalizeEmailAddress } from "@/lib/email-address";
import { reportResendWarning, runResendCall } from "@/lib/resend-client";
import { describeMissingEnv, readRequiredEnv } from "@/lib/required-env";
import { formatTorontoDate } from "@/lib/toronto-date";

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

/**
 * `followup-<formType>/<sha256(email)>/<YYYY-MM-DD>` (#642 decision 10): a
 * repeat submission the same (Toronto) day sends nothing new, so "one per
 * person per form per day" matches the day the submitter sees. The address is trimmed
 * and lower-cased before hashing so case or spacing differences share one
 * key, and only the hash is sent, never the raw address.
 */
function buildIdempotencyKey(
  formType: ConfirmationFormType,
  email: string,
): string {
  const emailHash = createHash("sha256")
    .update(normalizeEmailAddress(email))
    .digest("hex");
  return `followup-${formType}/${emailHash}/${formatTorontoDate()}`;
}

export async function sendConfirmationEmail({
  formType,
  email,
  firstName,
}: ConfirmationEmail): Promise<ConfirmationEmailResult> {
  const failureSummary = `Confirmation email not sent (${formType})`;
  const templateEnvName = TEMPLATE_ENV_NAMES[formType];
  const requiredEnv = readRequiredEnv([
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    templateEnvName,
  ]);
  if (!requiredEnv.isComplete) {
    reportResendWarning(
      failureSummary,
      describeMissingEnv(requiredEnv.missingNames),
    );
    return { isSent: false };
  }
  const envValues = requiredEnv.valuesByName;

  // Omitted, not "", when unknown: the template's fallback is documented to
  // apply to a missing variable, not to an empty one
  const trimmedFirstName = firstName?.trim();
  const variables: Record<string, string> = trimmedFirstName
    ? { USER_FIRST_NAME: trimmedFirstName }
    : {};

  // Not notify.ts's sendResendEmail: that path logs the raw SDK error
  // (which can echo the address) and has no template, reply-to or
  // idempotency key; this one reports PII-free failure codes only.
  const resend = new Resend(envValues.RESEND_API_KEY);
  const sendResult = await runResendCall(() =>
    resend.emails.send(
      {
        from: `Boximity <${envValues.RESEND_FROM_EMAIL}>`,
        to: email,
        replyTo: REPLY_TO,
        template: {
          id: envValues[templateEnvName],
          variables,
        },
      },
      { idempotencyKey: buildIdempotencyKey(formType, email) },
    ),
  );

  if (!sendResult.ok) {
    reportResendWarning(failureSummary, sendResult.failureCode);
    return { isSent: false };
  }
  return { isSent: true };
}
