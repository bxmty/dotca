/**
 * Per-IP rate limiting for the public, unauthenticated form routes.
 *
 * In-memory by design: this stack has no Redis or database, and the app
 * runs as a single container on one droplet. The window resets on container
 * restart and is per-container — revisit if the app ever scales out.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
// Cap tracked IPs so a scan across many source addresses can't grow the map
// without bound; stale entries are pruned before the cap is enforced.
const MAX_TRACKED_IPS = 10_000;

const submissionTimesByIp = new Map<string, number[]>();

/** Read the client IP; there's a reverse proxy in front, so trust its header. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}

function pruneStaleIps(now: number): void {
  for (const [ip, times] of submissionTimesByIp) {
    if (times.every((time) => now - time >= WINDOW_MS)) {
      submissionTimesByIp.delete(ip);
    }
  }
}

/**
 * Record a submission attempt from this IP and report whether it exceeds
 * the limit. Returns true when the request should be rejected with a 429.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();

  if (submissionTimesByIp.size >= MAX_TRACKED_IPS) {
    pruneStaleIps(now);
  }

  const recentTimes = (submissionTimesByIp.get(ip) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );

  if (recentTimes.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    submissionTimesByIp.set(ip, recentTimes);
    return true;
  }

  recentTimes.push(now);
  submissionTimesByIp.set(ip, recentTimes);
  return false;
}

/** Test hook: clear all tracked submissions. */
export function resetRateLimits(): void {
  submissionTimesByIp.clear();
}
