import { Resend } from "resend";
import { normalizeEmailAddress } from "@/lib/email-address";
import {
  lookUpContact,
  reportResendWarning,
  runResendCall,
} from "@/lib/resend-client";

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
}

// All three come from the environment: the IDs differ per Resend account
// and must never be hardcoded (#599).
const REQUIRED_ENV_NAMES = [
  "RESEND_API_KEY",
  "RESEND_OPTIN_SEGMENT_ID",
  "RESEND_OPTIN_TOPIC_ID",
] as const;

function reportFailure(source: OptInSource, detail: string): void {
  reportResendWarning(`Monthly brief opt-in failed (${source}): ${detail}`);
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
  const reportEventFailure = (detail: string) =>
    reportResendWarning(
      `Monthly brief opt-in event not sent (${source}): ${detail}`,
    );
  const event = process.env.RESEND_OPTIN_EVENT;
  if (!event) {
    reportEventFailure("RESEND_OPTIN_EVENT not set");
    return;
  }

  const failureCode = await runResendCall(() =>
    resend.events.send({ event, email, payload: { source } }),
  );
  if (failureCode) {
    reportEventFailure(`${event} ${failureCode}`);
  }
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
    return { isSubscribed: false };
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

  const createFailureCode = await runResendCall(() =>
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
    return { isSubscribed: true };
  }

  // Resend has no documented "already exists" error code, so a refused
  // create is only treated as an existing contact once a lookup confirms
  // it. Anything else (a rate limit, an outage, a bad key) is reported as
  // the create's own error.
  const contactLookup = await lookUpContact(resend, email);
  if (contactLookup.status !== "exists") {
    reportFailure(source, `create ${createFailureCode}`);
    return { isSubscribed: false };
  }

  // An existing contact (an earlier opt-in, or someone who opted out and
  // has now ticked the box again) is added to the segment and opted back in
  // to the topic. A fresh tick is fresh express consent.
  const segmentFailureCode = await runResendCall(() =>
    resend.contacts.segments.add({ email, segmentId }),
  );
  const topicFailureCode = segmentFailureCode
    ? null
    : await runResendCall(() =>
        resend.contacts.topics.update({ email, topics }),
      );
  if (!segmentFailureCode && !topicFailureCode) {
    // The event is sent again for a returning contact on purpose: the
    // automation's nurture_started_at guard absorbs repeat events (#642
    // decision 13), so a re-opt-in never restarts the nurture.
    await sendOptInEvent({ resend, email, source });
    return { isSubscribed: true };
  }

  reportFailure(
    source,
    `create ${createFailureCode}, existing-contact update ${
      segmentFailureCode
        ? `segment ${segmentFailureCode}`
        : `topic ${topicFailureCode}`
    }`,
  );
  return { isSubscribed: false };
}
