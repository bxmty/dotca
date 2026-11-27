/**
 * Keeps link secrets and intake submissions out of Sentry. Every Sentry
 * runtime (server, edge, browser) passes its events, transactions and spans
 * through scrubLinkTokens before they are sent.
 *
 * - Signed links (SDR console, lead magnets) carry their token in `?t=`.
 * - The joiner/leaver intake link (#565) carries its token as a path segment:
 *   `/service-request/<token>`.
 *
 * The SDK records the request URL on events, spans, breadcrumbs and the
 * Referer header, so the tokens are filtered from every string. It also
 * attaches the incoming request body to anything raised while a request is
 * handled (`request.data` on events, `http.request.body.data` on spans); for
 * the intake route that body is the token plus every submitted field, so it
 * is dropped.
 *
 * No server-only imports: the browser's Sentry config imports this module.
 */

const LINK_TOKEN_PATTERN = /(^|[?&])t=[^&#\s]*/g;

/**
 * The segment after `/service-request/`, plain or percent-encoded. The route
 * template (`[token]`, `:token`) is left alone: transaction names and stack
 * frame paths hold it, and it is not a secret.
 */
const INTAKE_PATH_TOKEN_PATTERN =
  /(\/service-request\/)(?!\[token\]|:token)[^/?#&\s"'\\]+/g;
const ENCODED_INTAKE_PATH_TOKEN_PATTERN =
  /(%2Fservice-request%2F)[^%/?#&\s"'\\]+/gi;

const INTAKE_PAGE_PATH_PATTERN = /\/service-request\/[^/?#]/;

/** The submission route: anything that mentions it may carry its body */
const INTAKE_API_PATH = "/api/service-request";

/** Where the SDK puts a captured incoming request body on a span */
const REQUEST_BODY_ATTRIBUTE = "http.request.body.data";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function scrubValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(LINK_TOKEN_PATTERN, "$1t=[Filtered]")
      .replace(INTAKE_PATH_TOKEN_PATTERN, "$1[Filtered]")
      .replace(ENCODED_INTAKE_PATH_TOKEN_PATTERN, "$1[Filtered]");
  }
  if (Array.isArray(value)) return value.map(scrubValue);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, scrubValue(item)]),
    );
  }
  return value;
}

function mentionsIntakeSubmission(value: unknown): boolean {
  if (typeof value === "string") return value.includes(INTAKE_API_PATH);
  if (isObject(value)) {
    return Object.values(value).some(mentionsIntakeSubmission);
  }
  return false;
}

/** A copy without the span body attribute, wherever a span's data sits. */
function dropRequestBodyAttribute(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dropRequestBodyAttribute);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== REQUEST_BODY_ATTRIBUTE)
      .map(([key, item]) => [key, dropRequestBodyAttribute(item)]),
  );
}

/** A copy of an event or span without the incoming request body. */
function dropRequestBody(payload: unknown): unknown {
  const withoutAttribute = dropRequestBodyAttribute(payload);
  if (!isObject(withoutAttribute) || !isObject(withoutAttribute.request)) {
    return withoutAttribute;
  }
  const request = Object.fromEntries(
    Object.entries(withoutAttribute.request).filter(([key]) => key !== "data"),
  );
  return { ...withoutAttribute, request };
}

/**
 * A copy of a span or event with every string's link token filtered out and,
 * when it comes from the intake submission route, no request body.
 */
export function scrubLinkTokens<T>(value: T): T {
  const scrubbed = scrubValue(value);
  return (
    mentionsIntakeSubmission(scrubbed) ? dropRequestBody(scrubbed) : scrubbed
  ) as T;
}

/**
 * Is this path or URL an intake link (`/service-request/<token>`)? Session
 * replay is kept off those pages: a recording holds the page URL in places no
 * send hook reaches.
 */
export function isIntakePagePath(pathOrUrl: string): boolean {
  return INTAKE_PAGE_PATH_PATTERN.test(pathOrUrl);
}
