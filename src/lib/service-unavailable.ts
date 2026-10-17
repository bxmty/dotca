/**
 * The 503 failure copy: say what is down, then how to reach a person instead.
 * One source so every degraded route points at the same contact details.
 * (/api/contact, /api/onboarding and the Stripe routes still inline the same
 * wording and can adopt this.)
 */
const CONTACT_INSTEAD =
  "Please contact us directly at hi@boximity.ca or (289) 539-0098.";

/** The copy for a route-specific outage, e.g. "Downloads are temporarily unavailable." */
export function formatUnavailableMessage(situation: string): string {
  return `${situation} ${CONTACT_INSTEAD}`;
}

/** The generic copy the form APIs answer 503 with. */
export const SERVICE_UNAVAILABLE_MESSAGE = formatUnavailableMessage(
  "Service temporarily unavailable.",
);
