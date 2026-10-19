import { Resend } from "resend";
import { normalizeEmailAddress } from "@/lib/email-address";
import {
  fetchContactStatus,
  reportResendWarning,
  runResendCall,
} from "@/lib/resend-client";
import { describeMissingEnv, readRequiredEnv } from "@/lib/required-env";

const FAILURE_SUMMARY = "Paid-customer flag not set in Resend";

/**
 * Flag a paying customer's Resend contact with `customer = "paid"` (#648,
 * #642 decision 14), so the nurture automation's condition skips the
 * day-14 "what Standard adds" upsell for them.
 *
 * Only an existing contact is touched: a payer who never ticked the brief
 * opt-in has no contact, and gets none here (#596 decision 6: no consent,
 * no contact). The lookup tells the two apart: Resend answers `not_found`
 * (404) for an address that isn't a contact, which ends it quietly with no
 * further calls; any other lookup error is a genuine failure.
 *
 * The `customer` contact property must already exist in the Resend account
 * (a manual setup step, like the brief segment and topic: see .env.example);
 * until it does, expect the update to fail and land here as a warning.
 *
 * Best-effort like the opt-in: it never throws, and a failure is a PII-free
 * Sentry warning, so it can never change the Stripe webhook's response.
 */
export async function markContactAsPaid({
  email: rawEmail,
}: {
  email: string;
}): Promise<void> {
  const requiredEnv = readRequiredEnv(["RESEND_API_KEY"]);
  if (!requiredEnv.isComplete) {
    reportResendWarning(
      FAILURE_SUMMARY,
      describeMissingEnv(requiredEnv.missingNames),
    );
    return;
  }

  const resend = new Resend(requiredEnv.valuesByName.RESEND_API_KEY);
  const email = normalizeEmailAddress(rawEmail);

  const contactStatus = await fetchContactStatus(resend, email);
  if (contactStatus.status === "missing") return;
  if (contactStatus.status === "failed") {
    reportResendWarning(FAILURE_SUMMARY, `lookup ${contactStatus.failureCode}`);
    return;
  }

  const updateResult = await runResendCall(() =>
    resend.contacts.update({ email, properties: { customer: "paid" } }),
  );
  if (!updateResult.ok) {
    reportResendWarning(FAILURE_SUMMARY, `update ${updateResult.failureCode}`);
  }
}
