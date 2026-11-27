import { COMPANY_PHONE_DISPLAY } from "@/lib/company-phone";

/**
 * The 503 failure copy: say what is down, then how to reach a person instead.
 * One source so every degraded route points at the same contact details.
 */
const CONTACT_INSTEAD = `Please contact us directly at hi@boximity.ca or ${COMPANY_PHONE_DISPLAY}.`;

/** The copy for a route-specific outage, e.g. "Downloads are temporarily unavailable." */
export function formatUnavailableMessage(situation: string): string {
  return `${situation} ${CONTACT_INSTEAD}`;
}

/** The generic copy the form APIs answer 503 with. */
export const SERVICE_UNAVAILABLE_MESSAGE = formatUnavailableMessage(
  "Service temporarily unavailable.",
);
