/**
 * Signed links (SDR console, lead magnets) carry their token in `?t=`. Server
 * tracing records the request's full URL on its spans, and error events record
 * it too, so strip those tokens from everything sent to Sentry.
 */

const LINK_TOKEN_PATTERN = /(^|[?&])t=[^&#\s]*/g;

function scrubValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(LINK_TOKEN_PATTERN, "$1t=[Filtered]");
  }
  if (Array.isArray(value)) return value.map(scrubValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, scrubValue(item)]),
    );
  }
  return value;
}

/** A copy of a span or event with every string's link token filtered out. */
export function scrubLinkTokens<T>(value: T): T {
  return scrubValue(value) as T;
}
