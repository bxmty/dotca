/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import * as Sentry from "@sentry/nextjs";
import { GET } from "@/app/api/lead-magnet/download/route";
import { signLeadMagnetToken } from "@/lib/lead-magnet-token";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

// The fixture magnet is read from disk for real, from the test fixtures
// directory the loader is pointed at below — never from content/, where the
// site would publish it.
const FIXTURE_DIR = path.join(__dirname, "fixtures", "lead-magnets");
const SLUG = "test-fixture-guide";
const FIXTURE_PDF = fs.readFileSync(
  path.join(FIXTURE_DIR, "assets", "test-fixture-guide.pdf"),
);
const EMAIL = "jane.doe@example.com";
const HOUR_MS = 60 * 60 * 1000;
const originalEnv = process.env;

function download({ slug, token }: { slug?: string; token?: string }) {
  const url = new URL("http://localhost/api/lead-magnet/download");
  if (slug !== undefined) url.searchParams.set("slug", slug);
  if (token !== undefined) url.searchParams.set("token", token);
  return GET(new Request(url));
}

describe("GET /api/lead-magnet/download", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      LEAD_MAGNET_SIGNING_SECRET: "s".repeat(64),
      LEAD_MAGNET_CONTENT_DIR: FIXTURE_DIR,
    };
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    logSpy.mockRestore();
    process.env = originalEnv;
  });

  it("serves the PDF as an attachment for a valid token", async () => {
    const token = signLeadMagnetToken({ slug: SLUG, email: EMAIL });

    const response = await download({ slug: SLUG, token });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="test-fixture-guide.pdf"',
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = Buffer.from(await response.arrayBuffer());
    expect(body.equals(FIXTURE_PDF)).toBe(true);
    expect(body.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("logs exactly one line with the slug and timestamp, and no email", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-17T15:30:00Z") });
    const token = signLeadMagnetToken({ slug: SLUG, email: EMAIL });

    await download({ slug: SLUG, token });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0].map(String).join(" ");
    expect(JSON.parse(line)).toEqual({
      event: "lead_magnet_download",
      slug: SLUG,
      timestamp: "2026-10-17T15:30:00.000Z",
    });
    expect(line).not.toContain(EMAIL);
    expect(line).not.toContain("jane");
    expect(line).not.toContain(token);
  });

  async function expectLinkExpiredResponse(response: Response) {
    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toMatch(/^text\/html/);
    const html = await response.text();
    expect(html).toContain(`href="/resources/${SLUG}"`);
    expect(html).toMatch(/re-enter your email/i);
    expect(logSpy).not.toHaveBeenCalled();
  }

  it("refuses an expired token and points back at the resource page", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-01T12:00:00Z") });
    const token = signLeadMagnetToken({ slug: SLUG, email: EMAIL });
    jest.advanceTimersByTime(25 * HOUR_MS);

    await expectLinkExpiredResponse(await download({ slug: SLUG, token }));
  });

  it("refuses a tampered token", async () => {
    const token = signLeadMagnetToken({ slug: SLUG, email: EMAIL });
    const [expiresAt, emailTag] = token.split(".");

    await expectLinkExpiredResponse(
      await download({ slug: SLUG, token: `${expiresAt}.${emailTag}.forged` }),
    );
  });

  it("refuses a token issued for a different slug", async () => {
    const token = signLeadMagnetToken({ slug: "another-guide", email: EMAIL });

    await expectLinkExpiredResponse(await download({ slug: SLUG, token }));
  });

  it("refuses a request with no token", async () => {
    await expectLinkExpiredResponse(await download({ slug: SLUG }));
  });

  it.each([
    ["an unknown slug", "no-such-guide"],
    ["a traversal attempt", "../../.env"],
    ["a missing slug", undefined],
  ])("returns 404 for %s", async (_name, slug) => {
    const token = signLeadMagnetToken({ slug: slug ?? "", email: EMAIL });

    const response = await download({ slug, token });

    expect(response.status).toBe(404);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("returns 500 and alerts when the magnet's PDF is missing from disk", async () => {
    const token = signLeadMagnetToken({ slug: SLUG, email: EMAIL });
    const realReadFileSync = fs.readFileSync;
    const readSpy = jest.spyOn(fs, "readFileSync").mockImplementation(((
      file: fs.PathOrFileDescriptor,
      options?: unknown,
    ) => {
      if (String(file).endsWith(".pdf")) {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }
      return realReadFileSync(file, options as BufferEncoding);
    }) as typeof fs.readFileSync);
    jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await download({ slug: SLUG, token });

      expect(response.status).toBe(500);
      expect(Sentry.captureException).toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      readSpy.mockRestore();
    }
  });

  it("returns 503 and alerts when the signing secret is not configured", async () => {
    const token = signLeadMagnetToken({ slug: SLUG, email: EMAIL });
    delete process.env.LEAD_MAGNET_SIGNING_SECRET;
    jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await download({ slug: SLUG, token });

    expect(response.status).toBe(503);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("LEAD_MAGNET_SIGNING_SECRET"),
      "error",
    );
  });
});
