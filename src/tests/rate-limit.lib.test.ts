import { getClientIp, isRateLimited, resetRateLimits } from "@/lib/rate-limit";

describe("getClientIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const request = {
      headers: new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }),
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
});
