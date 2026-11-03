/** @jest-environment node */
import { NextRequest } from "next/server";
import { captureMessage } from "@sentry/nextjs";
import { proxy } from "@/proxy";
import { signSdrToken } from "@/lib/sdr-link";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));

const DAY_MS = 24 * 60 * 60 * 1000;
const originalEnv = process.env;
const CONSOLE_URL = "https://boximity.ca/security-assessment/call";

function setEnv(values: Record<string, string>) {
  process.env = {
    ...originalEnv,
    SDR_LINK_SIGNING_SECRET: "s".repeat(64),
    ...values,
  } as NodeJS.ProcessEnv;
}

function open(search: string) {
  return proxy(new NextRequest(`${CONSOLE_URL}${search}`));
}

describe("SDR link proxy", () => {
  beforeEach(() => setEnv({}));

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it("stores a valid token in a strict, httpOnly, secure session cookie", async () => {
    const t = signSdrToken({ name: "Alex Doe" });

    const response = open(`?t=${t}`);

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`sdr_session=${t}`);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=strict/i);
    expect(setCookie).toContain("Secure");
    // Session cookie: expiry follows the token's own, through verification
    expect(setCookie).not.toMatch(/Max-Age|Expires/i);
  });

  it("drops Secure only in development", () => {
    setEnv({ NODE_ENV: "development" });
    const t = signSdrToken({ name: "Alex Doe" });

    const setCookie = open(`?t=${t}`).headers.get("set-cookie") ?? "";

    expect(setCookie).toContain(`sdr_session=${t}`);
    expect(setCookie).not.toContain("Secure");
  });

  /*
   * A plain 307 here 404s on a click from another site: the browser treats
   * the redirected request as cross-site and withholds the Strict cookie it
   * just stored. A same-origin hop made by this document gets it sent.
   */
  it("hops to the clean console URL from a page with no script and no token", async () => {
    const t = signSdrToken({ name: "Alex Doe" });

    const response = open(`?t=${t}&from=mail`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain(
      '<meta http-equiv="refresh" content="0;url=/security-assessment/call">',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain(t);
  });

  it("keeps the hop page out of caches, referrers and indexes, and bars scripts", () => {
    const t = signSdrToken({ name: "Alex Doe" });

    const { headers } = open(`?t=${t}`);

    expect(headers.get("cache-control")).toBe("no-store");
    expect(headers.get("referrer-policy")).toBe("no-referrer");
    expect(headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(headers.get("content-security-policy")).toBe("default-src 'none'");
  });

  it.each([
    ["empty", "?t="],
    ["malformed", "?t=garbage"],
    ["repeated", "?t=1.a.b&t=2.c.d"],
  ])("answers a %s link with 404 and no cookie", async (_name, search) => {
    const response = open(search);

    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).not.toContain("<script");
  });

  it("answers a tampered link with 404 and no cookie", () => {
    const token = signSdrToken({ name: "Alex Doe" });
    const lastChar = token.slice(-1);
    const t = token.slice(0, -1) + (lastChar === "A" ? "B" : "A");

    const response = open(`?t=${t}`);

    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("answers an expired link with 404 and no cookie", () => {
    jest.useFakeTimers({ now: new Date("2026-10-01T12:00:00Z") });
    const t = signSdrToken({ name: "Alex Doe" });
    jest.advanceTimersByTime(90 * DAY_MS);

    const response = open(`?t=${t}`);

    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("answers 404 and warns when the secret is not configured", () => {
    const t = signSdrToken({ name: "Alex Doe" });
    delete process.env.SDR_LINK_SIGNING_SECRET;

    const response = open(`?t=${t}`);

    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("SDR_LINK_SIGNING_SECRET"),
      "warning",
    );
  });

  it("leaves a request with no link to the page", () => {
    const response = open("");

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
