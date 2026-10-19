import { Resend } from "resend";
import { normalizeEmailAddress } from "@/lib/email-address";
import {
  fetchContactStatus,
  reportResendWarning,
  runResendCall,
} from "@/lib/resend-client";
import { describeMissingEnv, readRequiredEnv } from "@/lib/required-env";

/**
 * The monthly security brief opt-in (bxmty/dotca#599): a ticked checkbox on
 * the contact, onboarding, checkout or lead-magnet form makes the submitter
 * a Resend contact in the brief segment, opted in to the brief topic.
 * Callers only call this when the box was ticked; an unticked box means no
 * Resend call at all (CASL: consent is express, never inferred). Once the
 * contact write lands, a nurture source also sends one lead.opted_in event
 * so the nurture automation can start (#647).
 *
 * Best-effort by design: it never throws. A failure is a PII-free Sentry
 * warning and an `isSubscribed: false` result, so a missed newsletter signup
 * never fails the lead submission around it.
 */

/**
 * The sources #642's nurture automation branches on (decision 11): the
 * lead.opted_in event carries one of these and nothing else.
 */
export type NurtureSource = "contact" | "onboarding" | "checkout";

/**
 * Where the opt-in was given. A lead-magnet opt-in joins the brief but sends
 * no lead.opted_in event: #642 defines no lead-magnet cadence, so the event
 * contract stays the three nurture sources until it does (#606).
 */
export type OptInSource = NurtureSource | "lead-magnet";

function isNurtureSource(source: OptInSource): source is NurtureSource {
  return source !== "lead-magnet";
}

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
  "RESEND_MONTHLY_BRIEF_SEGMENT_ID",
  "RESEND_MONTHLY_BRIEF_TOPIC_ID",
] as const;

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
  source: NurtureSource;
}): Promise<void> {
  const failureSummary = `Monthly brief opt-in event not sent (${source})`;
  const requiredEnv = readRequiredEnv(["RESEND_OPTIN_EVENT"]);
  if (!requiredEnv.isComplete) {
    reportResendWarning(
      failureSummary,
      describeMissingEnv(requiredEnv.missingNames),
    );
    return;
  }

  const event = requiredEnv.valuesByName.RESEND_OPTIN_EVENT;
  const sendResult = await runResendCall(() =>
    resend.events.send({ event, email, payload: { source } }),
  );
  if (!sendResult.ok) {
    reportResendWarning(failureSummary, `${event} ${sendResult.failureCode}`);
  }
}

export async function subscribeToMonthlyBrief({
  email: rawEmail,
  firstName,
  lastName,
  source,
}: MonthlyBriefSubscriber): Promise<MonthlyBriefSubscription> {
  const failureSummary = `Monthly brief opt-in failed (${source})`;
  const requiredEnv = readRequiredEnv(REQUIRED_ENV_NAMES);
  if (!requiredEnv.isComplete) {
    reportResendWarning(
      failureSummary,
      describeMissingEnv(requiredEnv.missingNames),
    );
    return { isSubscribed: false };
  }
  const envValues = requiredEnv.valuesByName;

  const email = normalizeEmailAddress(rawEmail);
  const resend = new Resend(envValues.RESEND_API_KEY);
  const segmentId = envValues.RESEND_MONTHLY_BRIEF_SEGMENT_ID;
  const topics = [
    {
      id: envValues.RESEND_MONTHLY_BRIEF_TOPIC_ID,
      subscription: "opt_in" as const,
    },
  ];

  const createResult = await runResendCall(() =>
    resend.contacts.create({
      email,
      firstName,
      lastName,
      segments: [{ id: segmentId }],
      topics,
    }),
  );
  if (createResult.ok) {
    if (isNurtureSource(source)) {
      await sendOptInEvent({ resend, email, source });
    }
    return { isSubscribed: true };
  }

  // Resend has no documented "already exists" error code, so a refused
  // create is only treated as an existing contact once a lookup confirms
  // it. Anything else (a rate limit, an outage, a bad key) is reported as
  // the create's own error.
  const contactStatus = await fetchContactStatus(resend, email);
  if (contactStatus.status !== "exists") {
    reportResendWarning(failureSummary, `create ${createResult.failureCode}`);
    return { isSubscribed: false };
  }

  // An existing contact (an earlier opt-in, or someone who opted out and
  // has now ticked the box again) is added to the segment and opted back in
  // to the topic. A fresh tick is fresh express consent.
  const createFailureDetail = `create ${createResult.failureCode}, existing-contact update`;
  const segmentResult = await runResendCall(() =>
    resend.contacts.segments.add({ email, segmentId }),
  );
  if (!segmentResult.ok) {
    reportResendWarning(
      failureSummary,
      `${createFailureDetail} segment ${segmentResult.failureCode}`,
    );
    return { isSubscribed: false };
  }
  const topicResult = await runResendCall(() =>
    resend.contacts.topics.update({ email, topics }),
  );
  if (!topicResult.ok) {
    reportResendWarning(
      failureSummary,
      `${createFailureDetail} topic ${topicResult.failureCode}`,
    );
    return { isSubscribed: false };
  }

  // The event is sent again for a returning contact on purpose: the
  // automation's nurture_started_at guard absorbs repeat events (#642
  // decision 13), so a re-opt-in never restarts the nurture.
  if (isNurtureSource(source)) {
    await sendOptInEvent({ resend, email, source });
  }
  return { isSubscribed: true };
}
