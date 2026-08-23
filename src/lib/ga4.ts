import * as Sentry from "@sentry/nextjs";
import { resolveGa4Environment, resolveGa4MeasurementId } from "./ga4Cookies";

/**
 * Server-side GA4 Measurement Protocol sender.
 *
 * Deliberately does not import gtag.ts: that module logs at module scope,
 * which would fire on every server request if pulled in here.
 */

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const MP_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";
const MP_TIMEOUT_MS = 5000;

// Re-exported so existing callers of the sender module can still reach the
// cookie parser without knowing it moved to ga4Cookies.ts. Client code
// (checkout) should import it from ga4Cookies.ts directly instead, to avoid
// pulling this Sentry-importing module into the browser bundle.
export { parseGa4CookieIds } from "./ga4Cookies";

/**
 * Derive a stable fallback client_id when no `_ga` cookie is available
 * (e.g. a server-to-server webhook has no browser cookies at all). Built
 * from a caller-supplied seed such as a Stripe invoice ID — deterministic,
 * so retries land on the same GA4 user instead of minting a new one.
 */
export function deriveGa4FallbackClientId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `fallback.${hash}`;
}

export async function sendConversionEvent({
  name,
  clientId,
  sessionId,
  params,
}: {
  name: string;
  clientId: string | undefined;
  sessionId?: string;
  params?: Record<string, unknown>;
}): Promise<void> {
  const environment = resolveGa4Environment();
  const measurementId = resolveGa4MeasurementId(environment);
  const apiSecret = process.env.GA4_MP_API_SECRET;

  if (!measurementId) {
    console.error(`GA4 measurement ID missing (${environment}); dropping "${name}" conversion`);
    return;
  }

  if (!apiSecret) {
    // Missing in dev is expected (no secret exists locally) and must stay
    // silent — throwing or logging here would just add noise to local runs.
    if (environment === "development") return;

    const message = `GA4 MP API secret missing (${environment}); dropping "${name}" conversion`;
    console.error(message);
    Sentry.captureMessage(message, "error");
    return;
  }

  if (!clientId) {
    // Expected on every ad-blocked visitor — not exceptional, so this stays
    // a console.log rather than a Sentry alert that would bury real issues.
    console.log(`GA4 client_id missing; dropping "${name}" conversion`);
    return;
  }

  const endpoint = environment === "production" ? MP_ENDPOINT : MP_DEBUG_ENDPOINT;
  const url = `${endpoint}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), MP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name,
            params: {
              ...(sessionId ? { session_id: sessionId } : {}),
              ...params,
            },
          },
        ],
      }),
      signal: abortController.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const message = `GA4 MP request failed: ${response.status} (event "${name}")`;
      console.error(message);
      Sentry.captureMessage(message, "error");
      return;
    }

    if (environment !== "production") {
      const body = (await response.json().catch(() => null)) as {
        validationMessages?: unknown[];
      } | null;
      if (body?.validationMessages && body.validationMessages.length > 0) {
        const message = `GA4 MP validation errors for "${name}": ${JSON.stringify(body.validationMessages)}`;
        console.error(message);
        Sentry.captureMessage(message, "error");
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    const message = `GA4 MP request threw (event "${name}"): ${error instanceof Error ? error.message : String(error)}`;
    console.error(message);
    Sentry.captureMessage(message, "error");
  }
}
