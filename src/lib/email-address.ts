/**
 * The one canonical form of an email address for anything keyed by it:
 * Resend contacts and the confirmation email's idempotency key. Trimmed and
 * lower-cased, so "Jane@Example.com " and "jane@example.com" are the same
 * person rather than two contacts (or two confirmation emails).
 */
export function normalizeEmailAddress(emailAddress: string): string {
  return emailAddress.trim().toLowerCase();
}
