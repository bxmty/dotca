// Toronto is where the business and nearly all submitters are, so "today"
// in lead records and follow-up keys means the day the submitter sees.
const BUSINESS_TIME_ZONE = "America/Toronto";

/** The Toronto calendar day of `date` (default: now), as YYYY-MM-DD. */
export function formatTorontoDate(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date);
}
