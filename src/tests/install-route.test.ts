/** @jest-environment node */
import * as Sentry from "@sentry/nextjs";
import { GET } from "@/app/install/route";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));

// Shaped like a Syncro installer link: valueless flags and an encoded token,
// so any normalisation on the way through shows up as a mismatch.
const INSTALLER_URL =
  "https://example.syncromsp.com/dl/rs/abc123?installer&token=a%2Fb%3D";

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv, SYNCRO_FREE_INSTALLER_URL: INSTALLER_URL };
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe("/install redirect route", () => {
  it("temporarily redirects (307) to the configured installer URL, unchanged", () => {
    const res = GET();

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe(INSTALLER_URL);
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["blank", "   "],
  ])(
    "does not redirect when the installer URL is %s, and warns Sentry",
    (_label, value) => {
      if (value === undefined) delete process.env.SYNCRO_FREE_INSTALLER_URL;
      else process.env.SYNCRO_FREE_INSTALLER_URL = value;

      const res = GET();

      expect(res.status).toBe(503);
      expect(res.headers.get("Location")).toBeNull();
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("SYNCRO_FREE_INSTALLER_URL"),
        "warning",
      );
    },
  );

  it.each([
    ["a placeholder", "change-me"],
    ["a relative path", "/dl/installer"],
    ["a non-web scheme", "javascript:alert(1)"],
  ])(
    "does not redirect when the installer URL is %s, and warns Sentry",
    (_label, value) => {
      process.env.SYNCRO_FREE_INSTALLER_URL = value;

      const res = GET();

      expect(res.status).toBe(503);
      expect(res.headers.get("Location")).toBeNull();
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("SYNCRO_FREE_INSTALLER_URL"),
        "warning",
      );
    },
  );

  it("tells crawlers not to index the redirect", () => {
    expect(GET().headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("tells crawlers not to index the unavailable response either", () => {
    delete process.env.SYNCRO_FREE_INSTALLER_URL;

    expect(GET().headers.get("X-Robots-Tag")).toBe("noindex");
  });

  // Exact-shape assertions double as the no-PII check: any extra field (IP,
  // user agent, query values, the installer URL itself) fails them.
  it("logs one structured line per redirected click", () => {
    GET();

    expect(console.log).toHaveBeenCalledTimes(1);
    const [line] = (console.log as jest.Mock).mock.calls[0];
    expect(JSON.parse(line)).toEqual({
      event: "install_click",
      outcome: "redirected",
    });
  });

  it("logs one structured line per click while the link is unavailable", () => {
    delete process.env.SYNCRO_FREE_INSTALLER_URL;

    GET();

    expect(console.log).toHaveBeenCalledTimes(1);
    const [line] = (console.log as jest.Mock).mock.calls[0];
    expect(JSON.parse(line)).toEqual({
      event: "install_click",
      outcome: "unavailable",
    });
  });

  it("does not warn Sentry on a normal redirect", () => {
    GET();

    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
