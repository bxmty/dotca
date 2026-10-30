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

const DAY_MS = 24 * 60 * 60 * 1000;
const originalEnv = process.env;

function pageProps(search: Record<string, string | string[] | undefined>) {
  return { searchParams: Promise.resolve(search) };
}

describe("/security-assessment/call", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SDR_LINK_SIGNING_SECRET: "s".repeat(64),
      LEAD_MAGNET_SIGNING_SECRET: "a".repeat(64),
    };
    window.history.replaceState(null, "", "/security-assessment/call");
    jest.mocked(captureMessage).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it("renders the console for the SDR named in a valid token", async () => {
    const t = signSdrToken({ name: "Alex Doe" });

    render(await CallConsolePage(pageProps({ t })));

    expect(screen.getByText(/Alex Doe/)).toBeInTheDocument();
  });

  it("leaves the <main> landmark to the root layout", async () => {
    const t = signSdrToken({ name: "Alex Doe" });

    const { container } = render(await CallConsolePage(pageProps({ t })));

    expect(container.querySelector("main")).toBeNull();
  });

  it.each([
    ["missing", {}],
    ["empty", { t: "" }],
    ["malformed", { t: "garbage" }],
    ["repeated", { t: ["1.a.b", "2.c.d"] }],
  ])("404s on a %s token", async (_name, search) => {
    await expect(CallConsolePage(pageProps(search))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("404s on a tampered token", async () => {
    const token = signSdrToken({ name: "Alex Doe" });
    const lastChar = token.slice(-1);
    const t = token.slice(0, -1) + (lastChar === "A" ? "B" : "A");

    await expect(CallConsolePage(pageProps({ t }))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("404s on an expired token", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-01T12:00:00Z") });
    const t = signSdrToken({ name: "Alex Doe" });
    jest.advanceTimersByTime(90 * DAY_MS);

    await expect(CallConsolePage(pageProps({ t }))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("404s and warns when the SDR secret is not configured", async () => {
    const t = signSdrToken({ name: "Alex Doe" });
    delete process.env.SDR_LINK_SIGNING_SECRET;

    await expect(CallConsolePage(pageProps({ t }))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("SDR_LINK_SIGNING_SECRET"),
      "warning",
    );
  });

  it("strips the token from the address bar and keeps other params", async () => {
    const t = signSdrToken({ name: "Alex Doe" });
    window.history.replaceState(
      null,
      "",
      `/security-assessment/call?t=${t}&from=mail#top`,
    );

    render(await CallConsolePage(pageProps({ t })));

    expect(window.location.search).toBe("?from=mail");
    expect(window.location.hash).toBe("#top");
    expect(window.location.href).not.toContain(t);
  });

  it("is noindex, unfollowed, referrer-free and not canonical to the quiz", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.referrer).toBe("no-referrer");
    expect(metadata.alternates).toEqual({ canonical: null });
  });
});
