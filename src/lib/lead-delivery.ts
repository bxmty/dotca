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
 * Two delivery policies, one per route shape:
 * - deliverLead (contact, onboarding, paid signup): both sinks fire in
 *   parallel, and the lead is delivered if either lands (the PRD's
 *   redundancy matrix).
 * - recordLeadInSyncro then notifyWebmasterOfRecordedLead (lead magnet):
 *   Syncro gates the download, so it runs alone first, and the webmaster
 *   email only follows once the route has its download link.
 *
 * None of these throw: every sink is settled, and a throw reads as a failed
 * sink.
 */

/**
 * A lead as the routes describe it. `fields` is every submitted field,
 * label → value, shared by the Syncro ticket and the webmaster email; the
 * "Monthly brief" line is added here from `hasOptedInToBrief`.
 */
export interface LeadDetails extends Omit<LeadSubmission, "name"> {
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
   * Other best-effort calls (the GA4 conversion event, the lead-magnet
   * delivery email) settled alongside the sinks. Their outcomes never count
   * towards delivery.
   */
  alongside?: Promise<unknown>[];
}

export interface LeadDelivery {
  /** At least one sink landed, so the lead exists somewhere */
  isDelivered: boolean;
}

export interface SyncroLeadRecord {
  /** The Syncro Lead exists; the route may release what it gates */
  isRecorded: boolean;
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
    fields: {
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

/** Log and capture a PII-free delivery failure as a Sentry error. */
function reportFailure({
  failureSummary,
  failureContext,
  detail,
}: {
  failureSummary: string;
  failureContext?: string;
  detail: string;
}): void {
  const context = failureContext ? ` (${failureContext})` : "";
  const message = `${failureSummary}: ${detail}${context}`;
  console.error(message);
  Sentry.captureMessage(message, "error");
}

function describeDelivery(
  syncroResult: CreateLeadResult,
  isEmailSent: boolean,
): string {
  return `Syncro ${describeLeadOutcome(syncroResult)}, webmaster email ${
    isEmailSent ? "ok" : "failed"
  }`;
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
    reportFailure({
      failureSummary,
      failureContext,
      detail: describeDelivery(syncroResult, isEmailSent),
    });
  }
  return { isDelivered: syncroResult.ok || isEmailSent };
}

/**
 * Write the Syncro Lead alone, for a route that releases something only
 * once the lead exists. On failure this is the lead's only record, so it
 * logs the line itself; on success the log waits for
 * notifyWebmasterOfRecordedLead.
 */
export async function recordLeadInSyncro({
  lead,
  failureSummary,
}: Pick<
  LeadDeliveryRequest,
  "lead" | "failureSummary"
>): Promise<SyncroLeadRecord> {
  const [syncroSettled] = await Promise.allSettled([
    createLead(toLeadSubmission(lead)),
  ]);
  const syncroResult = toLeadResult(syncroSettled);
  if (!syncroResult.ok) {
    logLead(lead, syncroResult, false);
    reportFailure({
      failureSummary,
      detail: `Syncro ${describeLeadOutcome(syncroResult)}`,
    });
  }
  return { isRecorded: syncroResult.ok };
}

/**
 * Send the webmaster email for a lead recordLeadInSyncro has recorded. The
 * lead already exists, so a failed email is reported but changes nothing.
 */
export async function notifyWebmasterOfRecordedLead({
  lead,
  failureSummary,
  alongside = [],
}: Omit<LeadDeliveryRequest, "failureContext">): Promise<void> {
  const [[notificationSettled]] = await Promise.all([
    Promise.allSettled([sendNotification(toLeadSubmission(lead))]),
    Promise.allSettled(alongside),
  ]);
  const syncroResult: CreateLeadResult = { ok: true };
  const isEmailSent = isNotificationSent(notificationSettled);

  logLead(lead, syncroResult, isEmailSent);
  if (!isEmailSent) {
    reportFailure({
      failureSummary,
      detail: describeDelivery(syncroResult, isEmailSent),
    });
  }
}
