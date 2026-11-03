import * as Sentry from "@sentry/nextjs";
import { logLeadSubmission } from "@/lib/lead-log";
import { sendWebmasterNotification } from "@/lib/notify";
import {
  createLead,
  describeLeadOutcome,
  toLeadResult,
  type CreateLeadResult,
  type LeadSubmission,
} from "@/lib/syncro";

/**
 * Lead delivery: getting a website lead into its two sinks, the Syncro Lead
 * and the webmaster email, then leaving one structured log line and, when a
 * sink failed, one PII-free Sentry error. Every lead route goes through
 * here, so the sinks always carry the same fields and the log and Sentry
 * wording stay alike.
 *
 * Both sinks fire in parallel, and the lead is delivered if either lands
 * (the PRD's redundancy matrix, #596 decision 4); the route decides what a
 * total failure means for its response. Never throws: every sink is
 * settled, and a throw reads as a failed sink.
 */

/**
 * A lead as the routes describe it. `fields` is every submitted field,
 * label → value, shared by the Syncro ticket and the webmaster email; the
 * "Monthly brief" line is added here from `hasOptedInToBrief`.
 */
export interface LeadDetails extends Omit<LeadSubmission, "name"> {
  /**
   * The answer to the brief opt-in. Left out when the form never asks (a
   * discovery call: an SDR can't give the prospect's consent), so there's no
   * "Monthly brief" line: "No" would misdescribe the lead.
   */
  hasOptedInToBrief?: boolean;
  /**
   * Omitted when the form asks for none (the lead-magnet gate): the address
   * stands in for it in Syncro and the webmaster email, and the log line
   * leaves it blank.
   */
  name?: string;
}

export interface LeadDeliveryRequest {
  lead: LeadDetails;
  /** Names the route in the Sentry message, e.g. "Contact form delivery failure" */
  failureSummary: string;
  /** PII-free identifier appended to the Sentry message, e.g. "invoice in_123" */
  failureContext?: string;
  /**
   * Other best-effort calls (the GA4 conversion event) settled alongside
   * the sinks. Their outcomes never count
   * towards delivery.
   */
  alongside?: Promise<unknown>[];
}

export interface LeadDelivery {
  /** At least one sink landed, so the lead exists somewhere */
  isDelivered: boolean;
}

/** The "Monthly brief" field every lead carries: Yes only on explicit consent */
export function describeBriefOptIn(
  hasOptedInToBrief: boolean | undefined,
): "Yes" | "No" {
  return hasOptedInToBrief === true ? "Yes" : "No";
}

function toLeadSubmission(lead: LeadDetails): LeadSubmission {
  return {
    ...lead,
    name: lead.name ?? lead.email,
    fields:
      lead.hasOptedInToBrief === undefined
        ? lead.fields
        : {
            ...lead.fields,
            "Monthly brief": describeBriefOptIn(lead.hasOptedInToBrief),
          },
  };
}

function isNotificationSent(settled: PromiseSettledResult<boolean>): boolean {
  return settled.status === "fulfilled" && settled.value;
}

function sendNotification(lead: LeadSubmission): Promise<boolean> {
  return sendWebmasterNotification({
    formType: lead.formType,
    submitterName: lead.name || lead.email,
    fields: lead.fields,
  });
}

function logLead(
  lead: LeadDetails,
  syncroResult: CreateLeadResult,
  isEmailSent: boolean,
): void {
  logLeadSubmission({
    formType: lead.formType,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    syncro: syncroResult,
    isEmailSent,
  });
}

/** Fire both sinks in parallel; delivered when either lands. */
export async function deliverLead({
  lead,
  failureSummary,
  failureContext,
  alongside = [],
}: LeadDeliveryRequest): Promise<LeadDelivery> {
  const submission = toLeadSubmission(lead);
  const [[syncroSettled, notificationSettled]] = await Promise.all([
    Promise.allSettled([createLead(submission), sendNotification(submission)]),
    Promise.allSettled(alongside),
  ]);
  const syncroResult = toLeadResult(syncroSettled);
  const isEmailSent = isNotificationSent(notificationSettled);

  logLead(lead, syncroResult, isEmailSent);
  if (!syncroResult.ok || !isEmailSent) {
    // No submitted values in this string: it goes to Sentry
    const detail = `Syncro ${describeLeadOutcome(syncroResult)}, webmaster email ${
      isEmailSent ? "ok" : "failed"
    }`;
    const context = failureContext ? ` (${failureContext})` : "";
    const message = `${failureSummary}: ${detail}${context}`;
    console.error(message);
    Sentry.captureMessage(message, "error");
  }
  return { isDelivered: syncroResult.ok || isEmailSent };
}
