/**
 * GA4 cookie/environment helpers shared by server and client code.
 *
 * Kept separate from ga4.ts (the Measurement Protocol sender, which imports
 * Sentry and only makes sense server-side) so client code — like checkout,
 * which needs to read these cookies synchronously before submitting — can
 * import this module without pulling server-only code into the bundle.
 */

type Ga4Environment = "production" | "staging" | "development";

export function resolveGa4Environment(): Ga4Environment {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === "production") return "production";
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === "staging") return "staging";
  return "development";
}

export function resolveGa4MeasurementId(
  environment: Ga4Environment = resolveGa4Environment(),
): string | undefined {
  switch (environment) {
    case "production":
      return process.env.NEXT_PUBLIC_PRODUCTION_GA_ID;
    case "staging":
      return process.env.NEXT_PUBLIC_STAGING_GA_ID;
    default:
      return process.env.NEXT_PUBLIC_DEV_GA_ID;
  }
}

/**
 * Extract client_id (from `_ga`) and session_id (from `_ga_<CONTAINER_ID>`)
 * out of a raw cookie string — either a request `Cookie` header (server) or
 * `document.cookie` (browser); both use the same `name=value; name=value`
 * shape. The container ID is derived from the measurement ID at runtime
 * since it differs per environment.
 *
 * Never throws: any cookie that's absent or doesn't match the expected shape
 * simply yields an undefined field.
 */
export function parseGa4CookieIds(
  cookieHeader: string | undefined | null,
  measurementId: string | undefined = resolveGa4MeasurementId(),
): { clientId?: string; sessionId?: string } {
  if (!cookieHeader) return {};

  const cookies = new Map<string, string>();
  for (const pair of cookieHeader.split(";")) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;
    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (name) cookies.set(name, value);
  }

  // `_ga` looks like GA1.1.<part1>.<part2>; client_id is the last two segments.
  let clientId: string | undefined;
  const gaCookie = cookies.get("_ga");
  if (gaCookie) {
    const segments = gaCookie.split(".");
    if (segments.length >= 2) {
      clientId = segments.slice(-2).join(".");
    }
  }

  // `_ga_<CONTAINER_ID>` looks like GS1.1.<session_id>.<...>; session_id is
  // the third segment. The container ID is the measurement ID minus its
  // leading "G-".
  let sessionId: string | undefined;
  if (measurementId) {
    const containerId = measurementId.replace(/^G-/, "");
    const sessionCookie = cookies.get(`_ga_${containerId}`);
    if (sessionCookie) {
      const segments = sessionCookie.split(".");
      if (segments.length >= 3 && segments[2]) {
        sessionId = segments[2];
      }
    }
  }

  return { clientId, sessionId };
}
