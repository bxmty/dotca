import {
  createRateLimiter,
  getClientIp,
  isRateLimited,
  resetRateLimits,
} from "@/lib/rate-limit";

describe("getClientIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const request = {
      headers: new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }),
    } as Request;

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("trims whitespace around the first address", () => {
    const request = {
      headers: new Headers({ "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" }),
    } as Request;

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to 'unknown' without the header", () => {
    const request = { headers: new Headers() } as Request;

    expect(getClientIp(request)).toBe("unknown");
  });
});

describe("isRateLimited", () => {
  beforeEach(() => {
    resetRateLimits();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows 5 submissions in the window and rejects the 6th", () => {
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited("1.2.3.4")).toBe(false);
    }
    expect(isRateLimited("1.2.3.4")).toBe(true);
  });

  it("tracks IPs independently", () => {
    for (let i = 0; i < 5; i++) {
      isRateLimited("1.2.3.4");
    }
    expect(isRateLimited("5.6.7.8")).toBe(false);
  });

  it("frees the window after 10 minutes", () => {
    for (let i = 0; i < 5; i++) {
      isRateLimited("1.2.3.4");
    }
    expect(isRateLimited("1.2.3.4")).toBe(true);

    jest.advanceTimersByTime(10 * 60 * 1000 + 1);

    expect(isRateLimited("1.2.3.4")).toBe(false);
  });

  it("still limits the 6th submission at 9:59", () => {
    for (let i = 0; i < 5; i++) {
      isRateLimited("1.2.3.4");
    }

    jest.advanceTimersByTime(10 * 60 * 1000 - 1000);

    expect(isRateLimited("1.2.3.4")).toBe(true);
  });

  it("allows the 6th submission at exactly 10:00", () => {
    for (let i = 0; i < 5; i++) {
      isRateLimited("1.2.3.4");
    }

    jest.advanceTimersByTime(10 * 60 * 1000);

    expect(isRateLimited("1.2.3.4")).toBe(false);
  });
});

describe("createRateLimiter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("limits by its own window and hit count", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxPerWindow: 2,
      maxTrackedIps: 10,
    });

    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("a")).toBe(true);

    jest.advanceTimersByTime(1000);

    expect(limiter.isRateLimited("a")).toBe(false);
  });

  it("keeps limiters independent of each other", () => {
    const options = { windowMs: 1000, maxPerWindow: 1, maxTrackedIps: 10 };
    const first = createRateLimiter(options);
    const second = createRateLimiter(options);

    first.isRateLimited("a");

    expect(second.isRateLimited("a")).toBe(false);
  });

  it("forgets every IP on reset", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxPerWindow: 1,
      maxTrackedIps: 10,
    });
    limiter.isRateLimited("a");

    limiter.reset();

    expect(limiter.trackedIpCount()).toBe(0);
    expect(limiter.isRateLimited("a")).toBe(false);
  });

  it("evicts the oldest IP when the cap is reached and every IP is fresh", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxPerWindow: 1,
      maxTrackedIps: 2,
    });
    limiter.isRateLimited("a");
    limiter.isRateLimited("b");

    limiter.isRateLimited("c");

    expect(limiter.trackedIpCount()).toBe(2);
    // "b" is still tracked, so it stays limited; "a" was evicted and starts over.
    expect(limiter.isRateLimited("b")).toBe(true);
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.trackedIpCount()).toBe(2);
  });

  it("prunes stale IPs before evicting a fresh one", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxPerWindow: 2,
      maxTrackedIps: 2,
    });
    limiter.isRateLimited("oldest-but-active");
    limiter.isRateLimited("stale");
    jest.advanceTimersByTime(500);
    limiter.isRateLimited("oldest-but-active");
    // "stale" last hit exactly one window ago; "oldest-but-active" is at 500 ms.
    jest.advanceTimersByTime(500);

    limiter.isRateLimited("newcomer");

    expect(limiter.trackedIpCount()).toBe(2);
    // Had the oldest entry been evicted instead, it would get two fresh hits.
    expect(limiter.isRateLimited("oldest-but-active")).toBe(false);
    expect(limiter.isRateLimited("oldest-but-active")).toBe(true);
  });

  it("leaves stale IPs tracked while under the cap", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxPerWindow: 1,
      maxTrackedIps: 10,
    });
    limiter.isRateLimited("stale");
    jest.advanceTimersByTime(1000);

    limiter.isRateLimited("fresh");

    // Pruning only runs at the cap; below it, nothing is scanned.
    expect(limiter.trackedIpCount()).toBe(2);
  });

  it("keeps a full map intact when an already-tracked IP returns", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxPerWindow: 2,
      maxTrackedIps: 2,
    });
    limiter.isRateLimited("a");
    limiter.isRateLimited("a");
    limiter.isRateLimited("b");

    limiter.isRateLimited("b");

    expect(limiter.isRateLimited("a")).toBe(true);
  });

  it("does not track an IP beyond the hits it was allowed", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxPerWindow: 1,
      maxTrackedIps: 1,
    });
    limiter.isRateLimited("a");

    // A limited request from the only tracked IP must not evict anything.
    expect(limiter.isRateLimited("a")).toBe(true);
    expect(limiter.isRateLimited("a")).toBe(true);
    expect(limiter.trackedIpCount()).toBe(1);
  });
});
