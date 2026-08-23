import * as Sentry from "@sentry/nextjs";
import {
  parseGa4CookieIds,
  deriveGa4FallbackClientId,
  sendConversionEvent,
} from "@/lib/ga4";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

const mockCaptureMessage = Sentry.captureMessage as jest.Mock;
const originalEnv = process.env;

describe("parseGa4CookieIds", () => {
  const measurementId = "G-ABC123XYZ";

  it("extracts client_id and session_id from well-formed cookies", () => {
    const cookieHeader =
      "_ga=GA1.1.111111111.222222222; _ga_ABC123XYZ=GS1.1.333333333.4.1.444444444.0.0.0";

    expect(parseGa4CookieIds(cookieHeader, measurementId)).toEqual({
      clientId: "111111111.222222222",
      sessionId: "333333333",
    });
  });

  it("returns an empty object when the cookie header is absent", () => {
    expect(parseGa4CookieIds(undefined, measurementId)).toEqual({});
    expect(parseGa4CookieIds(null, measurementId)).toEqual({});
  });

  it("yields undefined identifiers for cookies that don't match the expected shape", () => {
    const cookieHeader = "_ga=malformed; _ga_ABC123XYZ=alsomalformed";

    expect(parseGa4CookieIds(cookieHeader, measurementId)).toEqual({});
  });

  it("yields undefined identifiers when the relevant cookies are simply missing", () => {
    const cookieHeader = "other_cookie=value";

    expect(parseGa4CookieIds(cookieHeader, measurementId)).toEqual({});
  });

  it("ignores cookie pairs without an '=' instead of throwing", () => {
    const cookieHeader = "garbage; _ga=GA1.1.111111111.222222222";

    expect(parseGa4CookieIds(cookieHeader, measurementId)).toEqual({
      clientId: "111111111.222222222",
    });
  });

  it("skips session_id resolution when no measurement ID is available", () => {
    const cookieHeader = "_ga_ABC123XYZ=GS1.1.333333333.4.1.444444444.0.0.0";

    expect(parseGa4CookieIds(cookieHeader, undefined)).toEqual({});
  });

  it("resolves the measurement ID itself when none is passed", () => {
    process.env = { ...originalEnv, NEXT_PUBLIC_ENVIRONMENT: "development" };
    expect(() => parseGa4CookieIds("_ga=GA1.1.1.2")).not.toThrow();
    process.env = originalEnv;
  });

  it("derives the session cookie name from the measurement ID at runtime", () => {
    const cookieHeader =
      "_ga_DIFFERENT=GS1.1.999999999.1.1.999999999.0.0.0";

    // Cookie name built from a different measurement ID than the one that
    // produced this cookie, so it should not match.
    expect(parseGa4CookieIds(cookieHeader, measurementId).sessionId).toBeUndefined();

    expect(
      parseGa4CookieIds(cookieHeader, "G-DIFFERENT").sessionId,
    ).toBe("999999999");
  });
});

describe("deriveGa4FallbackClientId", () => {
  it("is deterministic for the same seed", () => {
    expect(deriveGa4FallbackClientId("invoice_123")).toBe(
      deriveGa4FallbackClientId("invoice_123"),
    );
  });

  it("differs across seeds", () => {
    expect(deriveGa4FallbackClientId("invoice_123")).not.toBe(
      deriveGa4FallbackClientId("invoice_456"),
    );
  });
});

describe("sendConversionEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENVIRONMENT: "staging",
      NEXT_PUBLIC_STAGING_GA_ID: "G-STAGINGID",
      GA4_MP_API_SECRET: "test-secret",
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ validationMessages: [] }),
      }),
    ) as jest.Mock;
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("is a no-op that does not throw or call fetch when the API secret is unset in development", async () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
    delete process.env.GA4_MP_API_SECRET;

    await expect(
      sendConversionEvent({ name: "purchase", clientId: "111.222" }),
    ).resolves.toBeUndefined();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("reports missing API secret to Sentry as an error in staging", async () => {
    delete process.env.GA4_MP_API_SECRET;

    await sendConversionEvent({ name: "purchase", clientId: "111.222" });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("GA4 MP API secret missing"),
      "error",
    );
  });

  it("reports missing API secret to Sentry as an error in production", async () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
    process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "G-PRODID";
    delete process.env.GA4_MP_API_SECRET;

    await sendConversionEvent({ name: "purchase", clientId: "111.222" });

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("GA4 MP API secret missing"),
      "error",
    );
  });

  it("logs (not Sentry) and skips sending when client_id is missing", async () => {
    await sendConversionEvent({ name: "purchase", clientId: undefined });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("client_id missing"),
    );
  });

  it("targets the MP debug endpoint on staging", async () => {
    await sendConversionEvent({ name: "purchase", clientId: "111.222" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://www.google-analytics.com/debug/mp/collect"),
      expect.any(Object),
    );
  });

  it("targets the real MP endpoint on production", async () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
    process.env.NEXT_PUBLIC_PRODUCTION_GA_ID = "G-PRODID";

    await sendConversionEvent({ name: "purchase", clientId: "111.222" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.google-analytics.com/mp/collect?measurement_id=G-PRODID&api_secret=test-secret",
      expect.any(Object),
    );
  });

  it("surfaces non-empty validationMessages from the debug endpoint to Sentry", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ validationMessages: [{ description: "bad param" }] }),
      }),
    ) as jest.Mock;

    await sendConversionEvent({ name: "purchase", clientId: "111.222" });

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("bad param"),
      "error",
    );
  });

  it("reports a non-2xx response to Sentry without throwing", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500 }),
    ) as jest.Mock;

    await expect(
      sendConversionEvent({ name: "purchase", clientId: "111.222" }),
    ).resolves.toBeUndefined();

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("500"),
      "error",
    );
  });

  it("includes session_id in the payload when provided", async () => {
    await sendConversionEvent({
      name: "purchase",
      clientId: "111.222",
      sessionId: "333333333",
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.events[0].params.session_id).toBe("333333333");
  });

  it("swallows a network failure and reports it to Sentry instead of throwing", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("network down")),
    ) as jest.Mock;

    await expect(
      sendConversionEvent({ name: "purchase", clientId: "111.222" }),
    ).resolves.toBeUndefined();

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("network down"),
      "error",
    );
  });
});
