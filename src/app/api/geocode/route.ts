import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { searchAddresses } from "@/lib/nominatim";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// Stryker disable next-line StringLiteral: Next.js route-segment config, not read under jest
export const dynamic = "force-dynamic";

// Autocomplete fires far more often than a form submit, so this gets its own
// looser window rather than sharing the 5-per-10-minutes contact/onboarding limiter.
const autocompleteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxPerWindow: 30,
  maxTrackedIps: 10_000,
});

/** Test hook: clear tracked per-IP request timestamps. */
export function resetGeocodeRateLimits(): void {
  autocompleteLimiter.reset();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const countryCodes = searchParams.get("countryCodes") ?? undefined;

  if (query.trim().length < 3) {
    return NextResponse.json({ results: [] });
  }

  if (autocompleteLimiter.isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { error: "Too many address lookups. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const results = await searchAddresses(query, { countryCodes });
    return NextResponse.json({ results });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { results: [], error: "Address lookup failed" },
      { status: 502 },
    );
  }
}
