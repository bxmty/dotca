import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { searchAddresses } from "@/lib/nominatim";
import { getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Autocomplete fires far more often than a form submit, so this gets its own
// looser window rather than sharing the 5-per-10-minutes contact/onboarding limiter.
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_TRACKED_IPS = 10_000;

const requestTimesByIp = new Map<string, number[]>();

function isAutocompleteRateLimited(ip: string): boolean {
  const now = Date.now();

  if (requestTimesByIp.size >= MAX_TRACKED_IPS) {
    for (const [trackedIp, times] of requestTimesByIp) {
      if (times.every((time) => now - time >= WINDOW_MS)) {
        requestTimesByIp.delete(trackedIp);
      }
    }
  }

  const recentTimes = (requestTimesByIp.get(ip) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );

  if (recentTimes.length >= MAX_REQUESTS_PER_WINDOW) {
    requestTimesByIp.set(ip, recentTimes);
    return true;
  }

  recentTimes.push(now);
  requestTimesByIp.set(ip, recentTimes);
  return false;
}

/** Test hook: clear tracked per-IP request timestamps. */
export function resetGeocodeRateLimits(): void {
  requestTimesByIp.clear();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const countryCodes = searchParams.get("countryCodes") ?? undefined;

  if (query.trim().length < 3) {
    return NextResponse.json({ results: [] });
  }

  if (isAutocompleteRateLimited(getClientIp(request))) {
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
