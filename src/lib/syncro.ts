import * as Sentry from "@sentry/nextjs";
import { normalizeEmailAddress } from "@/lib/email-address";
import { isRecord } from "@/lib/isRecord";
import type { NotificationFormType } from "@/lib/notify";
import { formatTorontoDate } from "@/lib/toronto-date";
import { splitFullName } from "@/lib/person-name";

/**
 * Syncro (PSA) reads and writes. Website leads land here as Syncro Leads;
 * the joiner/leaver intake (#565) reads customers and contacts (cached, see
 * readCachedList) and writes tickets.
 *
 * Never throws: callers branch on the result to build the success/failure
 * matrix with the webmaster email. A Syncro rejection (4xx) and "could not
 * reach Syncro" (missing config, network error, 5xx) are distinct results so
 * Sentry detail says which one happened. Missing config deliberately reads as
 * unreachable: the secrets ship optional, and the email path still lands.
 */

export type CreateLeadResult =
  { ok: true; leadId?: number } | SyncroWriteFailure;

/** How a Syncro write (lead or ticket) fails */
export type SyncroWriteFailure =
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
      /** "exception" only ever comes from toLeadResult: the writes never throw */
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
  // Never a Lead: service requests become tickets (createIntakeTicket)
  "Service request": "Website service request",
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
    // JSON.stringify drops the key when there is no amount
    opportunity_amount_dollars: lead.opportunityAmountDollars,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
    // Stryker disable next-line BlockStatement: both readers treat a null body and an undefined one alike
  } catch {
    return null;
  }
}

function readErrorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
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

// --- Joiner/leaver intake (#565) -------------------------------------------

export interface IntakeOrganization {
  /** Syncro customer id */
  id: number;
  /** Never shown to a submitter: a token alone must not name its client */
  name: string;
}

export type ResolveIntakeTokenResult =
  | {
      status: "matched";
      organization: IntakeOrganization;
      /** True when Syncro was unreachable and the last-known-good list answered */
      isStale: boolean;
    }
  /** Syncro's customer list (fresh or last-known-good) holds no such token */
  | { status: "no_match" }
  /** Syncro could not be asked and nothing is cached: not a verdict on the token */
  | { status: "could_not_check"; detail: SyncroReadFailureDetail };

/**
 * Why a list could not be read, safe for logs and Sentry: "missing_config",
 * "network_error", "invalid_response" or "HTTP <status>". Never Syncro's body.
 */
export type SyncroReadFailureDetail = string;

/** Organization custom field holding the client's intake link secret */
const INTAKE_TOKEN_FIELD = "intake_token";

/**
 * How long a list read from Syncro answers before it is read again, which is
 * also how long a revoked token or contact keeps working. In memory because
 * the app runs as one container on one droplet (as src/lib/rate-limit.ts).
 */
const LIST_CACHE_TTL_IN_MS = 5 * 60 * 1000;

interface CachedList<Item> {
  items: Item[];
  fetchedAtInMs: number;
}

type ListRead<Item> =
  | { isAvailable: true; items: Item[]; isStale: boolean }
  | { isAvailable: false; detail: SyncroReadFailureDetail };

type ListFetch =
  | { ok: true; records: unknown[] }
  | { ok: false; detail: SyncroReadFailureDetail };

/**
 * How long an intake call waits on Syncro: one ticket write, or every page of
 * one list read. A Syncro that accepts the connection and never answers would
 * otherwise hold the page render and the route open. Past this the call is
 * aborted and reads as a network error, so stale-serving and fail-open apply.
 */
const INTAKE_TIMEOUT_IN_MS = 10_000;

/** Run `call` with a signal that aborts once the intake timeout has passed. */
async function withIntakeTimeout<Result>(
  call: (signal: AbortSignal) => Promise<Result>,
): Promise<Result> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INTAKE_TIMEOUT_IN_MS);
  try {
    return await call(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The most pages one list read follows. Far above any list Boximity holds; it
 * stops a Syncro that never sends an empty page from being paged until the
 * timeout.
 */
const MAX_LIST_PAGES = 50;

/**
 * Every page of a Syncro list endpoint, or the first failure. Never throws.
 * The intake timeout covers the whole read, not each page.
 */
async function fetchSyncroList(
  path: string,
  listKey: string,
  query: Record<string, string> = {},
): Promise<ListFetch> {
  const config = readSyncroConfig();
  if (!config.isConfigured) {
    return { ok: false, detail: "missing_config" };
  }
  const { baseUrl, apiKey } = config;
  return withIntakeTimeout((signal) =>
    fetchSyncroListPages({ baseUrl, apiKey, path, listKey, query, signal }),
  );
}

async function fetchSyncroListPages({
  baseUrl,
  apiKey,
  path,
  listKey,
  query,
  signal,
}: {
  baseUrl: string;
  apiKey: string;
  path: string;
  listKey: string;
  query: Record<string, string>;
  signal: AbortSignal;
}): Promise<ListFetch> {
  const records: unknown[] = [];
  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const search = new URLSearchParams({ ...query, page: String(page) });
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}?${search}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
      });
    } catch {
      return { ok: false, detail: "network_error" };
    }
    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` };
    }

    const body = await readJson(response);
    if (signal.aborted) {
      // The body stalled: a timeout, not a malformed answer
      return { ok: false, detail: "network_error" };
    }
    const pageBody = isRecord(body) ? body : {};
    const pageRecords = pageBody[listKey];
    if (!Array.isArray(pageRecords)) {
      return { ok: false, detail: "invalid_response" };
    }
    records.push(...pageRecords);

    // The list ends at an empty page, or at the last page Syncro counts.
    // Without a count (`meta.total_pages` absent) only the empty page ends
    // it: stopping at page 1 would pass a first page off as the whole list.
    const { meta } = pageBody;
    const totalPages = isRecord(meta) ? meta.total_pages : undefined;
    const isLastPage = typeof totalPages === "number" && page >= totalPages;
    if (isLastPage || pageRecords.length === 0) {
      return { ok: true, records };
    }
  }
  // Still going at the limit: a list cut short is not one to judge a token on
  return { ok: false, detail: "invalid_response" };
}

/**
 * Read a list through its cache entry. Fresh within the TTL; past it, Syncro
 * is asked again. When Syncro cannot answer, the last-known-good list is
 * served for as long as the outage lasts, with a Sentry warning, so a
 * requester can still reach the form and its email fallback. Only a cold
 * cache during an outage is "unavailable".
 */
async function readCachedList<Item>({
  listName,
  cached,
  store,
  fetchItems,
}: {
  /** Names the list in logs and Sentry, e.g. "customer list" */
  listName: string;
  cached: CachedList<Item> | undefined;
  store: (entry: CachedList<Item>) => void;
  fetchItems: () => Promise<
    { ok: true; items: Item[] } | { ok: false; detail: SyncroReadFailureDetail }
  >;
}): Promise<ListRead<Item>> {
  if (cached && Date.now() - cached.fetchedAtInMs < LIST_CACHE_TTL_IN_MS) {
    return { isAvailable: true, items: cached.items, isStale: false };
  }

  const fetched = await fetchItems();
  if (fetched.ok) {
    store({ items: fetched.items, fetchedAtInMs: Date.now() });
    return { isAvailable: true, items: fetched.items, isStale: false };
  }

  if (cached) {
    const message = `Syncro ${listName} unavailable (${fetched.detail}): serving the last-known-good copy`;
    console.error(message);
    Sentry.captureMessage(message, "warning");
    return { isAvailable: true, items: cached.items, isStale: true };
  }

  console.error(`Syncro ${listName} unavailable (${fetched.detail})`);
  return { isAvailable: false, detail: fetched.detail };
}

function readTrimmedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

interface TokenHolder extends IntakeOrganization {
  token: string;
}

/** Each well-formed customer with its token, "" where the field is unset. */
function toTokenHolders(records: unknown[]): TokenHolder[] {
  const holders: TokenHolder[] = [];
  for (const record of records) {
    if (!isRecord(record) || typeof record.id !== "number") continue;
    if (!isRecord(record.properties)) continue;
    const token = readTrimmedText(record.properties[INTAKE_TOKEN_FIELD]);
    holders.push({
      id: record.id,
      name:
        readTrimmedText(record.business_name) ||
        readTrimmedText(record.fullname),
      token,
    });
  }
  return holders;
}

/**
 * Does the customer list look like the real one? Boximity always has
 * customers, and Syncro sends each with a `properties` object. A 200 with no
 * customers, or with none carrying `properties`, is a degraded answer: taken
 * at face value it would replace the last-known-good list and turn every
 * valid link into a 404 until the cache expires. It reads as "could not
 * check" instead, so stale-serving applies.
 */
function hasCustomerCustomFields(records: unknown[]): boolean {
  return records.some(
    (record) => isRecord(record) && isRecord(record.properties),
  );
}

let cachedTokenHolders: CachedList<TokenHolder> | undefined;

/**
 * Find the organization whose `intake_token` custom field holds `token`
 * (exact match, surrounding whitespace ignored). Never throws.
 *
 * "no_match" and "could_not_check" are deliberately distinct: collapsing them
 * would make a Syncro outage look like a dead link. Every token, real or not,
 * reaches "could_not_check" during a cold outage, so it leaks nothing.
 */
export async function resolveIntakeToken(
  token: string,
): Promise<ResolveIntakeTokenResult> {
  const submittedToken = token.trim();
  if (submittedToken === "") {
    return { status: "no_match" };
  }

  const read = await readCachedList<TokenHolder>({
    listName: "customer list",
    cached: cachedTokenHolders,
    store: (entry) => {
      cachedTokenHolders = entry;
    },
    fetchItems: async () => {
      const fetched = await fetchSyncroList("/customers", "customers");
      if (!fetched.ok) return fetched;
      if (!hasCustomerCustomFields(fetched.records)) {
        return { ok: false, detail: "invalid_response" };
      }
      return { ok: true, items: toTokenHolders(fetched.records) };
    },
  });
  if (!read.isAvailable) {
    return { status: "could_not_check", detail: read.detail };
  }

  const holder = read.items.find(
    (candidate) => candidate.token === submittedToken,
  );
  return holder
    ? {
        status: "matched",
        organization: { id: holder.id, name: holder.name },
        isStale: read.isStale,
      }
    : { status: "no_match" };
}

export interface IntakeContact {
  /** Syncro contact id: the ticket is attributed to it */
  id: number;
  name: string;
  /** Trimmed and lower-cased */
  email: string;
}

export type FindAuthorizedContactResult =
  | {
      status: "authorized";
      contact: IntakeContact;
      /** True when Syncro was unreachable and the last-known-good list answered */
      isStale: boolean;
    }
  /** The organization's contact list holds no authorized contact with this email */
  | { status: "not_authorized" }
  /**
   * The contact list could not be read and nothing is cached: authorization is
   * unverified, not refused. The route fails open on this (email only).
   */
  | { status: "could_not_check"; detail: SyncroReadFailureDetail };

/** Contact custom field (checkbox): this contact may file service requests */
const INTAKE_AUTHORIZED_FIELD = "intake_authorized";

// How Syncro and its importers write a ticked checkbox
const TICKED_CHECKBOX_VALUES: readonly unknown[] = [
  true,
  1,
  "1",
  "true",
  "yes",
  "on",
];

function isTickedCheckbox(value: unknown): boolean {
  return TICKED_CHECKBOX_VALUES.includes(
    typeof value === "string" ? value.trim().toLowerCase() : value,
  );
}

/** The contacts allowed to file; everything else is dropped. */
function toAuthorizedContacts(records: unknown[]): IntakeContact[] {
  const contacts: IntakeContact[] = [];
  for (const record of records) {
    if (!isRecord(record) || typeof record.id !== "number") continue;
    if (!isRecord(record.properties)) continue;
    if (!isTickedCheckbox(record.properties[INTAKE_AUTHORIZED_FIELD])) continue;
    const email = normalizeEmailAddress(readTrimmedText(record.email));
    if (email === "") continue;
    contacts.push({ id: record.id, name: readTrimmedText(record.name), email });
  }
  return contacts;
}

/** Authorized contacts per Syncro customer id */
const cachedAuthorizedContacts = new Map<number, CachedList<IntakeContact>>();

/**
 * Is `email` one of the organization's contacts with `intake_authorized`
 * ticked? Matched case-insensitively. Never throws.
 */
export async function findAuthorizedContact(
  organizationId: number,
  email: string,
): Promise<FindAuthorizedContactResult> {
  const read = await readCachedList<IntakeContact>({
    listName: "contact list",
    cached: cachedAuthorizedContacts.get(organizationId),
    store: (entry) => {
      cachedAuthorizedContacts.set(organizationId, entry);
    },
    fetchItems: async () => {
      const fetched = await fetchSyncroList("/contacts", "contacts", {
        customer_id: String(organizationId),
      });
      return fetched.ok
        ? { ok: true, items: toAuthorizedContacts(fetched.records) }
        : fetched;
    },
  });
  if (!read.isAvailable) {
    return { status: "could_not_check", detail: read.detail };
  }

  const submittedEmail = normalizeEmailAddress(email);
  const contact = read.items.find(
    (candidate) => candidate.email === submittedEmail,
  );
  return contact
    ? { status: "authorized", contact: { ...contact }, isStale: read.isStale }
    : { status: "not_authorized" };
}

/**
 * One-phrase summary of a lead write for logs and Sentry: the failure kind,
 * code and HTTP status only. Never includes Syncro's message, which can echo
 * submitted values.
 */
export function describeLeadOutcome(
  result: { ok: true } | SyncroWriteFailure,
): string {
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

/**
 * The one Syncro write path: config check, POST, and the split between a
 * rejection (4xx) and an unreachable Syncro. Never throws. `recordName`
 * names the write in log lines ("lead", "ticket"). An aborted `signal` reads
 * as a network error; lead writes pass none and wait as long as fetch does.
 */
async function postToSyncro(
  path: string,
  payload: Record<string, unknown>,
  recordName: string,
  signal?: AbortSignal,
): Promise<{ ok: true; body: unknown } | SyncroWriteFailure> {
  const config = readSyncroConfig();
  if (!config.isConfigured) {
    console.error(
      `Syncro ${recordName} skipped: SYNCRO_SUBDOMAIN or SYNCRO_API_KEY is not set`,
    );
    return { ok: false, reason: "unreachable", code: "missing_config" };
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    console.error(`Syncro ${recordName} request failed:`, error);
    return { ok: false, reason: "unreachable", code: "network_error" };
  }

  const body = await readJson(response);

  if (response.ok) {
    return { ok: true, body };
  }

  if (response.status >= 500) {
    console.error(
      `Syncro ${recordName} request failed: HTTP ${response.status}`,
    );
    return {
      ok: false,
      reason: "unreachable",
      code: "server_error",
      status: response.status,
    };
  }

  const message = readErrorMessage(body);
  console.error(
    `Syncro rejected the ${recordName}: HTTP ${response.status}`,
    message,
  );
  return {
    ok: false,
    reason: "rejected",
    status: response.status,
    ...(message === undefined ? {} : { message }),
  };
}

/** Create a Syncro Lead (POST /leads) for a website submission. */
export async function createLead(
  lead: LeadSubmission,
): Promise<CreateLeadResult> {
  const posted = await postToSyncro("/leads", buildLeadPayload(lead), "lead");
  if (!posted.ok) return posted;
  const leadId = readLeadId(posted.body);
  return leadId === undefined ? { ok: true } : { ok: true, leadId };
}

export interface IntakeTicket {
  /** From resolveIntakeToken */
  organizationId: number;
  /** From findAuthorizedContact: the requester the ticket is attributed to */
  contactId: number;
  subject: string;
  /** The initial comment: every submitted field */
  comment: string;
}

export type CreateTicketResult =
  | {
      ok: true;
      ticketId?: number;
      /** The reference the requester quotes, e.g. "3417" */
      ticketNumber?: string;
    }
  | SyncroWriteFailure;

const INTAKE_TICKET_ISSUE_TYPE = "Onboarding/Offboarding";
const INTAKE_TICKET_STATUS = "New";

function readTicketReference(body: unknown): {
  ticketId?: number;
  ticketNumber?: string;
} {
  const ticket = isRecord(body) && isRecord(body.ticket) ? body.ticket : {};
  const { id, number } = ticket;
  const ticketNumber =
    typeof number === "number" ? String(number) : readTrimmedText(number);
  return {
    ...(typeof id === "number" ? { ticketId: id } : {}),
    ...(ticketNumber === "" ? {} : { ticketNumber }),
  };
}

/**
 * Create the service-request ticket (POST /tickets) in status New. The
 * initial comment is public and emailed on purpose: Syncro's ticket
 * autoresponder is the only confirmation the requester is sent. Never throws.
 *
 * A write that times out reads as unreachable although Syncro may still
 * create the ticket: the email still lands and Sentry is told. A 2xx whose
 * body stalls is a created ticket without a reference.
 */
export async function createIntakeTicket(
  ticket: IntakeTicket,
): Promise<CreateTicketResult> {
  const posted = await withIntakeTimeout((signal) =>
    postToSyncro(
      "/tickets",
      {
        customer_id: ticket.organizationId,
        contact_id: ticket.contactId,
        subject: isStagingDeploy()
          ? `[STAGING] ${ticket.subject}`
          : ticket.subject,
        problem_type: INTAKE_TICKET_ISSUE_TYPE,
        status: INTAKE_TICKET_STATUS,
        comments_attributes: [
          {
            subject: "Initial Issue",
            body: ticket.comment,
            hidden: false,
            do_not_email: false,
          },
        ],
      },
      "ticket",
      signal,
    ),
  );
  return posted.ok ? { ok: true, ...readTicketReference(posted.body) } : posted;
}

/** describeLeadOutcome for a ticket write: kind, code and HTTP status only. */
export function describeTicketOutcome(result: CreateTicketResult): string {
  return describeLeadOutcome(result);
}
