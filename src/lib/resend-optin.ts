import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { normalizeEmailAddress } from "@/lib/email-address";

/**
 * The monthly security brief opt-in (bxmty/dotca#599): a ticked checkbox on
 * the contact, onboarding or checkout form makes the submitter a Resend
 * contact in the brief segment, opted in to the brief topic. Callers only
 * call this when the box was ticked; an unticked box means no Resend call
 * at all (CASL: consent is express, never inferred). Once the contact write
 * lands, it also sends one lead.opted_in event so the nurture automation can
 * start (#647).
 *
 * Best-effort by design: it never throws. A failure is a PII-free Sentry
 * warning and an `isSubscribed: false` result, so a missed newsletter signup
 * never fails the lead submission around it.
 */

/** Where the opt-in was given; the lead.opted_in event carries it on. */
export type OptInSource = "contact" | "onboarding" | "checkout";

export interface MonthlyBriefSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  source: OptInSource;
}

/**
 * Whether the contact write landed. The lead.opted_in event is sent only when
 * it did (the event needs a contact), and an event failure does not change
 * it: the subscription itself still stands.
 */
export interface MonthlyBriefSubscription {
  isSubscribed: boolean;
  source: OptInSource;
}

// All three come from the environment: the IDs differ per Resend account
// and must never be hardcoded (#599).
const REQUIRED_ENV_NAMES = [
  "RESEND_API_KEY",
  "RESEND_OPTIN_SEGMENT_ID",
  "RESEND_OPTIN_TOPIC_ID",
] as const;

type ResendCallResult = { error: { name: string } | null };

/**
 * A short, PII-free failure code for one Resend call: the API error name, or
 * "exception" when the SDK threw (its message could echo the address).
 */
async function getFailureCode(
  call: () => Promise<ResendCallResult>,
): Promise<string | null> {
  try {
    const { error } = await call();
    return error ? error.name : null;
  } catch {
    return "exception";
  }
}

function reportFailure(source: OptInSource, detail: string): void {
  const message = `Monthly brief opt-in failed (${source}): ${detail}`;
  console.warn(message);
  Sentry.captureMessage(message, "warning");
}

/**
 * The lead.opted_in event (#647, #642 decisions 11 and 16) that starts the
 * nurture automation. Only sent once the contact write has landed, since a
 * Resend event needs a contact. The name comes from RESEND_OPTIN_EVENT
 * (`lead.opted_in` in production, `lead.opted_in.staging` in staging) so
 * staging never triggers the production automation. Best-effort like the
 * rest of the opt-in: a failure is a PII-free Sentry warning, never a
 * failed subscription.
 */
async function sendOptInEvent({
  resend,
  email,
  source,
}: {
  resend: Resend;
  email: string;
  source: OptInSource;
}): Promise<void> {
  const event = process.env.RESEND_OPTIN_EVENT;
  if (!event) {
    reportEventFailure(source, "RESEND_OPTIN_EVENT not set");
    return;
  }

  const failureCode = await getFailureCode(() =>
    resend.events.send({ event, email, payload: { source } }),
  );
  if (failureCode) {
    reportEventFailure(source, `${event} ${failureCode}`);
  }
}

function reportEventFailure(source: OptInSource, detail: string): void {
  const message = `Monthly brief opt-in event not sent (${source}): ${detail}`;
  console.warn(message);
  Sentry.captureMessage(message, "warning");
}

export async function subscribeToMonthlyBrief({
  email: rawEmail,
  firstName,
  lastName,
  source,
}: MonthlyBriefSubscriber): Promise<MonthlyBriefSubscription> {
  const missingEnvNames = REQUIRED_ENV_NAMES.filter(
    (name) => !process.env[name],
  );
  if (missingEnvNames.length > 0) {
    reportFailure(source, `${missingEnvNames.join(", ")} not set`);
    return { isSubscribed: false, source };
  }

  const email = normalizeEmailAddress(rawEmail);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const segmentId = process.env.RESEND_OPTIN_SEGMENT_ID as string;
  const topics = [
    {
      id: process.env.RESEND_OPTIN_TOPIC_ID as string,
      subscription: "opt_in" as const,
    },
  ];

  const createFailureCode = await getFailureCode(() =>
    resend.contacts.create({
      email,
      firstName,
      lastName,
      segments: [{ id: segmentId }],
      topics,
    }),
  );
  if (!createFailureCode) {
    await sendOptInEvent({ resend, email, source });
    return { isSubscribed: true, source };
  }

  // The create is refused when the address is already a contact (an earlier
  // opt-in, or someone who opted out and has now ticked the box again), so
  // fall back to adding the existing contact to the segment and opting it
  // back in to the topic. A fresh tick is fresh express consent.
  const segmentFailureCode = await getFailureCode(() =>
    resend.contacts.segments.add({ email, segmentId }),
  );
  const topicFailureCode = segmentFailureCode
    ? null
    : await getFailureCode(() =>
        resend.contacts.topics.update({ email, topics }),
      );
  if (!segmentFailureCode && !topicFailureCode) {
    await sendOptInEvent({ resend, email, source });
    return { isSubscribed: true, source };
  }

  reportFailure(
    source,
    `create ${createFailureCode}, existing-contact update ${
      segmentFailureCode
        ? `segment ${segmentFailureCode}`
        : `topic ${topicFailureCode}`
    }`,
  );
  return { isSubscribed: false, source };
}

/**
 * Whether the address is a Resend contact: "exists", "missing" (Resend's
 * `not_found`, a 404), or a PII-free failure code for anything else.
 */
async function findContact(resend: Resend, email: string): Promise<string> {
  try {
    const { error } = await resend.contacts.get({ email });
    if (!error) return "exists";
    if (error.name === "not_found" || error.statusCode === 404) {
      return "missing";
    }
    return error.name;
  } catch {
    return "exception";
  }
}

function reportPaidFlagFailure(detail: string): void {
  const message = `Paid-customer flag not set in Resend: ${detail}`;
  console.warn(message);
  Sentry.captureMessage(message, "warning");
}

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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    reportPaidFlagFailure("RESEND_API_KEY not set");
    return;
  }

  const resend = new Resend(apiKey);
  const email = normalizeEmailAddress(rawEmail);

  const lookup = await findContact(resend, email);
  if (lookup === "missing") return;
  if (lookup !== "exists") {
    reportPaidFlagFailure(`lookup ${lookup}`);
    return;
  }

  const updateFailureCode = await getFailureCode(() =>
    resend.contacts.update({ email, properties: { customer: "paid" } }),
  );
  if (updateFailureCode) {
    reportPaidFlagFailure(`update ${updateFailureCode}`);
  }
}
