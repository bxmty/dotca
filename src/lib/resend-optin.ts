import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

/**
 * The monthly security brief opt-in (bxmty/dotca#599): a ticked checkbox on
 * the contact, onboarding or checkout form makes the submitter a Resend
 * contact in the brief segment, opted in to the brief topic. Callers only
 * call this when the box was ticked; an unticked box means no Resend call
 * at all (CASL: consent is express, never inferred).
 *
 * Best-effort by design: it never throws. A failure is a PII-free Sentry
 * warning and an `isSubscribed: false` result, so a missed newsletter signup
 * never fails the lead submission around it.
 */

/** Where the opt-in was given; #647's lead.opted_in event carries it on. */
export type OptInSource = "contact" | "onboarding" | "checkout";

export interface MonthlyBriefSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  source: OptInSource;
}

/**
 * Whether the contact write landed. Follow-on work (the lead.opted_in event,
 * #647) must only run when `isSubscribed` is true: the event needs a contact.
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

export async function subscribeToMonthlyBrief({
  email,
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
