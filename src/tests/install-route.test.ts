/** @jest-environment node */
import * as Sentry from "@sentry/nextjs";
import { GET } from "@/app/install/route";
import { buildInstallUrl } from "@/lib/install-link";
import { signLeadMagnetToken } from "@/lib/lead-magnet-token";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));

// Shaped like a Syncro installer link: valueless flags and an encoded token,
// so any normalisation on the way through shows up as a mismatch.
const INSTALLER_URL =
  "https://example.syncromsp.com/dl/rs/abc123?installer&token=a%2Fb%3D";
const SECRET = "a".repeat(64);
const DAY_MS = 24 * 60 * 60 * 1000;

const originalEnv = process.env;

function requestInstall(url: string): Response {
  return GET(new Request(url));
}

/** A request carrying a freshly signed token, as the day-0 email links. */
function requestWithValidToken(): Response {
  return requestInstall(buildInstallUrl("jane@example.com"));
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    SYNCRO_FREE_INSTALLER_URL: INSTALLER_URL,
    LEAD_MAGNET_SIGNING_SECRET: SECRET,
  };
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe("/install redirect route", () => {
  it("temporarily redirects (307) to the configured installer URL, unchanged, for a valid token", () => {
    const res = requestWithValidToken();

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe(INSTALLER_URL);
  });

  describe("token gate", () => {
    it.each([
      ["no token", "https://boximity.ca/install"],
      ["an empty token", "https://boximity.ca/install?t="],
      ["a malformed token", "https://boximity.ca/install?t=not-a-token"],
    ])("refuses %s with a 403 and no redirect", async (_label, url) => {
      const res = requestInstall(url);

      expect(res.status).toBe(403);
      expect(res.headers.get("Location")).toBeNull();
      expect(await res.text()).toBe(
        "This installer link has expired or is not valid. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      );
    });

    it("refuses a tampered token", () => {
      const url = new URL(buildInstallUrl("jane@example.com"));
      const token = url.searchParams.get("t")!;
      // Flip, don't overwrite: a signature already ending in "A" (1 in 16)
      // would be unchanged, and correctly redirect.
      const lastChar = token.slice(-1);
      url.searchParams.set(
        "t",
        `${token.slice(0, -1)}${lastChar === "A" ? "B" : "A"}`,
      );

      const res = requestInstall(url.toString());

      expect(res.status).toBe(403);
      expect(res.headers.get("Location")).toBeNull();
    });

    it("refuses a token signed with a different secret", () => {
      const url = buildInstallUrl("jane@example.com");
      process.env.LEAD_MAGNET_SIGNING_SECRET = "b".repeat(64);

      expect(requestInstall(url).status).toBe(403);
    });

    it("refuses a lead magnet download token", () => {
      const token = signLeadMagnetToken({
        slug: "install",
        email: "jane@example.com",
      });

      const res = requestInstall(`https://boximity.ca/install?t=${token}`);

      expect(res.status).toBe(403);
    });

    it("accepts a token just before 7 days and refuses it after", () => {
      jest.useFakeTimers({ now: new Date("2026-10-21T12:00:00Z") });
      const url = buildInstallUrl("jane@example.com");

      jest.advanceTimersByTime(7 * DAY_MS - 1000);
      expect(requestInstall(url).status).toBe(307);

      jest.advanceTimersByTime(1000);
      expect(requestInstall(url).status).toBe(403);
    });

    it("does not warn Sentry for a refused token", () => {
      requestInstall("https://boximity.ca/install");

      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it("answers 503 and warns Sentry when tokens cannot be checked", async () => {
      delete process.env.LEAD_MAGNET_SIGNING_SECRET;

      const res = requestInstall("https://boximity.ca/install?t=x");

      expect(res.status).toBe(503);
      expect(res.headers.get("Location")).toBeNull();
      expect(await res.text()).toBe(
        "The installer link is temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      );
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("LEAD_MAGNET_SIGNING_SECRET"),
        "warning",
      );
    });
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["blank", "   "],
  ])(
    "does not redirect when the installer URL is %s, and warns Sentry",
    async (_label, value) => {
      if (value === undefined) delete process.env.SYNCRO_FREE_INSTALLER_URL;
      else process.env.SYNCRO_FREE_INSTALLER_URL = value;

      const res = requestWithValidToken();

      expect(res.status).toBe(503);
      expect(res.headers.get("Location")).toBeNull();
      expect(await res.text()).toBe(
        "The installer link is temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      );
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

      const res = requestWithValidToken();

      expect(res.status).toBe(503);
      expect(res.headers.get("Location")).toBeNull();
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("SYNCRO_FREE_INSTALLER_URL"),
        "warning",
      );
    },
  );

  it("tells crawlers not to index the redirect", () => {
    expect(requestWithValidToken().headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("tells crawlers not to index the refused or unavailable responses", () => {
    expect(
      requestInstall("https://boximity.ca/install").headers.get("X-Robots-Tag"),
    ).toBe("noindex");

    delete process.env.SYNCRO_FREE_INSTALLER_URL;
    expect(requestWithValidToken().headers.get("X-Robots-Tag")).toBe("noindex");
  });

  // Exact-shape assertions double as the no-PII check: any extra field (IP,
  // user agent, the token, the installer URL itself) fails them.
  it.each([
    [
      "redirected click",
      () => requestWithValidToken(),
      { event: "install_click", outcome: "redirected" },
    ],
    [
      "refused click",
      () => requestInstall("https://boximity.ca/install"),
      { event: "install_click", outcome: "rejected", reason: "missing" },
    ],
    [
      "click while the link is unavailable",
      () => {
        delete process.env.SYNCRO_FREE_INSTALLER_URL;
        return requestWithValidToken();
      },
      { event: "install_click", outcome: "unavailable" },
    ],
  ])("logs one structured line per %s", (_label, request, expected) => {
    request();

    expect(console.log).toHaveBeenCalledTimes(1);
    const [line] = (console.log as jest.Mock).mock.calls[0];
    expect(JSON.parse(line)).toEqual(expected);
  });

  it("does not warn Sentry on a normal redirect", () => {
    requestWithValidToken();

    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
