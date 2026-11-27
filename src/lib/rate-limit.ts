/**
 * Per-IP rate limiting for the public, unauthenticated routes.
 *
 * In-memory by design: this stack has no Redis or database, and the app
 * runs as a single container on one droplet. The window resets on container
 * restart and is per-container — revisit if the app ever scales out.
 */

export interface RateLimiterOptions {
  /** Length of the sliding window. */
  windowMs: number;
  /** Hits allowed per IP inside one window. */
  maxPerWindow: number;
  /**
   * Hard cap on tracked IPs, so a scan across many source addresses can't
   * grow the map without bound. At the cap, stale IPs are pruned first; if
   * every IP is still fresh, the oldest-tracked one is evicted.
   */
  maxTrackedIps: number;
}

export interface RateLimiter {
  /**
   * Record a hit from this IP and report whether it exceeds the limit.
   * Returns true when the request should be rejected with a 429.
   */
  isRateLimited(ip: string): boolean;
  /** Number of IPs currently tracked; never exceeds `maxTrackedIps`. */
  trackedIpCount(): number;
  /** Test hook: forget every tracked IP. */
  reset(): void;
}

export function createRateLimiter({
  windowMs,
  maxPerWindow,
  maxTrackedIps,
}: RateLimiterOptions): RateLimiter {
  // Hit times per IP, ascending. Map iteration order is first-tracked first.
  const hitTimesByIp = new Map<string, number[]>();

  function makeRoomForNewIp(now: number): void {
    for (const [ip, times] of hitTimesByIp) {
      if (now - times[times.length - 1] >= windowMs) {
        hitTimesByIp.delete(ip);
      }
    }
    if (hitTimesByIp.size >= maxTrackedIps) {
      for (const oldestIp of hitTimesByIp.keys()) {
        hitTimesByIp.delete(oldestIp);
        break;
      }
    }
  }

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const recentTimes = (hitTimesByIp.get(ip) ?? []).filter(
      (time) => now - time < windowMs,
    );

    if (recentTimes.length >= maxPerWindow) {
      return true;
    }

    if (!hitTimesByIp.has(ip) && hitTimesByIp.size >= maxTrackedIps) {
      makeRoomForNewIp(now);
    }

    recentTimes.push(now);
    hitTimesByIp.set(ip, recentTimes);
    return false;
  }

  return {
    isRateLimited,
    trackedIpCount: () => hitTimesByIp.size,
    reset: () => hitTimesByIp.clear(),
  };
}

/** Limiter shared by the form routes: 5 submissions per 10 minutes per IP. */
const formSubmissionLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxPerWindow: 5,
  maxTrackedIps: 10_000,
});

/** Read the client IP; there's a reverse proxy in front, so trust its header. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}

/**
 * Record a form submission attempt from this IP and report whether it
 * exceeds the limit. Returns true when the request should be rejected with
 * a 429.
 */
export function isRateLimited(ip: string): boolean {
  return formSubmissionLimiter.isRateLimited(ip);
}

/** Test hook: clear all tracked submissions. */
export function resetRateLimits(): void {
  formSubmissionLimiter.reset();
}
