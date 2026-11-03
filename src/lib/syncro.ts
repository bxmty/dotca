import type { NotificationFormType } from "@/lib/notify";
import { formatTorontoDate } from "@/lib/toronto-date";
import { splitFullName } from "@/lib/person-name";

/**
 * Syncro (PSA) writes. Website leads land here as Syncro Leads; the
 * joiner/leaver intake (#565) extends this module with its own reads/writes.
 *
 * Never throws: callers branch on the result to build the success/failure
 * matrix with the webmaster email. A Syncro rejection (4xx) and "could not
 * reach Syncro" (missing config, network error, 5xx) are distinct results so
 * Sentry detail says which one happened. Missing config deliberately reads as
 * unreachable: the secrets ship optional, and the email path still lands.
 */

export type CreateLeadResult =
  | { ok: true; leadId?: number }
  | {
      ok: false;
      reason: "rejected";
      /** HTTP status Syncro answered with */
      status: number;
      /** Syncro's error message. May echo submitted values: keep out of Sentry. */
      message?: string;
    }
  | {
      ok: false;
      reason: "unreachable";
      /** "exception" only ever comes from toLeadResult: createLead never throws */
      code: "missing_config" | "network_error" | "server_error" | "exception";
      /** HTTP status, when Syncro answered with a 5xx */
      status?: number;
    };

export interface LeadSubmission {
  formType: NotificationFormType;
  /** Full name; split into Syncro's first/last name fields */
  name: string;
  email: string;
  /** E.164 where the caller could format it */
  phone?: string;
  company?: string;
  /** Every submitted field, label → value; becomes the ticket description */
  fields: Record<string, string>;
  /** Paid signups: the amount charged */
  opportunityAmountDollars?: number;
  /**
   * The submitter ticked the monthly security brief box. Recorded, with the
   * date, in the Lead's hidden notes so the consent shows in Syncro (#599).
   */
  hasOptedInToBrief?: boolean;
}

const SUBJECT_PREFIX: Record<NotificationFormType, string> = {
  Contact: "Website contact form",
  Onboarding: "Website onboarding form",
  "Paid signup": "PAID SIGNUP",
  "Lead magnet": "Website lead magnet",
  "Security assessment": "Website security assessment",
  "Discovery call assessment": "Discovery call assessment",
};

const STAGING_NOTE =
  "Created by the STAGING website (staging.boximity.ca): a test submission, not a real prospect.";

type SyncroConfig =
  | { isConfigured: true; baseUrl: string; apiKey: string }
  | { isConfigured: false };

/** Shared by every Syncro call. Not configured when either secret is unset. */
function readSyncroConfig(): SyncroConfig {
  const subdomain = process.env.SYNCRO_SUBDOMAIN?.trim();
  const apiKey = process.env.SYNCRO_API_KEY?.trim();
  if (!subdomain || !apiKey) {
    return { isConfigured: false };
  }
  return {
    isConfigured: true,
    baseUrl: `https://${subdomain}.syncromsp.com/api/v1`,
    apiKey,
  };
}

// Staging signal from #554 (same as the Sentry environment tag), not NODE_ENV
function isStagingDeploy(): boolean {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";
}

/** One line per note; empty when there is nothing to record */
function buildHiddenNotes(lead: LeadSubmission, isStaging: boolean): string {
  const notes: string[] = [];
  if (isStaging) {
    notes.push(STAGING_NOTE);
  }
  if (lead.hasOptedInToBrief === true) {
    notes.push(
      `Opted in to the monthly security brief on ${formatTorontoDate()}`,
    );
  }
  return notes.join("\n");
}

function buildLeadPayload(lead: LeadSubmission): Record<string, unknown> {
  // Syncro always gets both name fields, "" where the name has no such part
  const { firstName = "", lastName = "" } = splitFullName(lead.name);
  const subject = `${SUBJECT_PREFIX[lead.formType]} — ${lead.company || lead.name}`;
  const isStaging = isStagingDeploy();
  const hiddenNotes = buildHiddenNotes(lead, isStaging);

  return {
    first_name: firstName,
    last_name: lastName,
    email: lead.email,
    ...(lead.phone ? { phone: lead.phone } : {}),
    ...(lead.company ? { business_name: lead.company } : {}),
    ticket_subject: isStaging ? `[STAGING] ${subject}` : subject,
    ticket_description: Object.entries(lead.fields)
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n"),
    ...(hiddenNotes ? { hidden_notes: hiddenNotes } : {}),
    ...(lead.opportunityAmountDollars !== undefined
      ? { opportunity_amount_dollars: lead.opportunityAmountDollars }
      : {}),
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const { message, error, errors } = body as Record<string, unknown>;
  const raw = message ?? error ?? errors;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.map(String).join("; ");
  return raw === undefined ? undefined : JSON.stringify(raw);
}

function readLeadId(body: unknown): number | undefined {
  const lead = (body as { lead?: { id?: unknown } } | null)?.lead;
  return typeof lead?.id === "number" ? lead.id : undefined;
}

/**
 * One-phrase summary of a lead write for logs and Sentry: the failure kind,
 * code and HTTP status only. Never includes Syncro's message, which can echo
 * submitted values.
 */
export function describeLeadOutcome(result: CreateLeadResult): string {
  if (result.ok) return "ok";
  if (result.reason === "rejected") return `rejected (HTTP ${result.status})`;
  const status = result.status === undefined ? "" : `, HTTP ${result.status}`;
  return `unreachable (${result.code}${status})`;
}

/**
 * Unwrap createLead from Promise.allSettled. It never rejects, but the
 * routes settle every sink defensively; a rejection reads as unreachable.
 */
export function toLeadResult(
  settled: PromiseSettledResult<CreateLeadResult>,
): CreateLeadResult {
  return settled.status === "fulfilled"
    ? settled.value
    : { ok: false, reason: "unreachable", code: "exception" };
}

/** Create a Syncro Lead (POST /leads) for a website submission. */
export async function createLead(
  lead: LeadSubmission,
): Promise<CreateLeadResult> {
  const config = readSyncroConfig();
  if (!config.isConfigured) {
    console.error(
      "Syncro lead skipped: SYNCRO_SUBDOMAIN or SYNCRO_API_KEY is not set",
    );
    return { ok: false, reason: "unreachable", code: "missing_config" };
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/leads`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(buildLeadPayload(lead)),
    });
  } catch (error) {
    console.error("Syncro lead request failed:", error);
    return { ok: false, reason: "unreachable", code: "network_error" };
  }

  const body = await readJson(response);

  if (response.ok) {
    const leadId = readLeadId(body);
    return leadId === undefined ? { ok: true } : { ok: true, leadId };
  }

  if (response.status >= 500) {
    console.error(`Syncro lead request failed: HTTP ${response.status}`);
    return {
      ok: false,
      reason: "unreachable",
      code: "server_error",
      status: response.status,
    };
  }

  const message = readErrorMessage(body);
  console.error(`Syncro rejected the lead: HTTP ${response.status}`, message);
  return {
    ok: false,
    reason: "rejected",
    status: response.status,
    ...(message === undefined ? {} : { message }),
  };
}
