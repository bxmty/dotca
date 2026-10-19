import type { NotificationFormType } from "@/lib/notify";
import { describeLeadOutcome, type CreateLeadResult } from "@/lib/syncro";

/**
 * One structured line per website lead, so a submission is recoverable from
 * the container logs even when both Syncro and the webmaster email fail.
 *
 * Carries contact details on purpose: container logs stay on our droplet.
 * Sentry is the place that must not see them.
 */
export function logLeadSubmission({
  formType,
  name = "",
  company = "",
  email,
  phone = "",
  syncro,
  isEmailSent,
}: {
  formType: NotificationFormType;
  /** Omitted fields log as "", so every line has the same shape */
  name?: string;
  company?: string;
  email: string;
  phone?: string;
  syncro: CreateLeadResult;
  isEmailSent: boolean;
}): void {
  console.log(
    JSON.stringify({
      event: "lead_submission",
      formType,
      name,
      company,
      email,
      phone,
      syncro: describeLeadOutcome(syncro),
      webmasterEmail: isEmailSent ? "ok" : "failed",
    }),
  );
}
