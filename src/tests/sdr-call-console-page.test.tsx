import { render, screen } from "@testing-library/react";
import { captureMessage } from "@sentry/nextjs";
import CallConsolePage, { metadata } from "@/app/security-assessment/call/page";
import { signSdrToken } from "@/lib/sdr-link";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));

// jest.setup.js mocks next/navigation without notFound; mirror Next's
// behavior of notFound() throwing so the page stops rendering.
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

let sessionCookie: string | undefined;
jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "sdr_session" && sessionCookie !== undefined
        ? { name, value: sessionCookie }
        : undefined,
  }),
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const originalEnv = process.env;

describe("/security-assessment/call", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SDR_LINK_SIGNING_SECRET: "s".repeat(64),
      LEAD_MAGNET_SIGNING_SECRET: "a".repeat(64),
    };
    sessionCookie = undefined;
    sessionStorage.clear();
    localStorage.clear();
    jest.mocked(captureMessage).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it("renders the console for the SDR named in the session cookie", async () => {
    sessionCookie = signSdrToken({ name: "Alex Doe" });

    render(await CallConsolePage());

    expect(screen.getByText(/Alex Doe/)).toBeInTheDocument();
  });

  it("keeps the token out of the page's props, markup and web storage", async () => {
    sessionCookie = signSdrToken({ name: "Alex Doe" });

    const page = await CallConsolePage();
    const { container } = render(page);

    // Everything handed to client components is serialized into the payload.
    expect(JSON.stringify(page)).not.toContain(sessionCookie);
    expect(container.innerHTML).not.toContain(sessionCookie);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(sessionCookie);
    expect(JSON.stringify({ ...localStorage })).not.toContain(sessionCookie);
  });

  it("leaves the <main> landmark to the root layout", async () => {
    sessionCookie = signSdrToken({ name: "Alex Doe" });

    const { container } = render(await CallConsolePage());

    expect(container.querySelector("main")).toBeNull();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["malformed", "garbage"],
  ])("404s on a %s cookie", async (_name, value) => {
    sessionCookie = value;

    await expect(CallConsolePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("404s on a tampered cookie", async () => {
    const token = signSdrToken({ name: "Alex Doe" });
    const lastChar = token.slice(-1);
    sessionCookie = token.slice(0, -1) + (lastChar === "A" ? "B" : "A");

    await expect(CallConsolePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("404s once the token in the cookie expires", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-01T12:00:00Z") });
    sessionCookie = signSdrToken({ name: "Alex Doe" });
    jest.advanceTimersByTime(90 * DAY_MS);

    await expect(CallConsolePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("404s and warns when the SDR secret is not configured", async () => {
    sessionCookie = signSdrToken({ name: "Alex Doe" });
    delete process.env.SDR_LINK_SIGNING_SECRET;

    await expect(CallConsolePage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("SDR_LINK_SIGNING_SECRET"),
      "warning",
    );
  });

  it("is noindex, unfollowed, referrer-free and not canonical to the quiz", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.referrer).toBe("no-referrer");
    expect(metadata.alternates).toEqual({ canonical: null });
  });
});
