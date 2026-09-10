/**
 * Guards the wiring fixed in bxmty/dotca#567: the browser Sentry SDK reads its
 * DSN from a NEXT_PUBLIC_-prefixed variable. Next.js only inlines that prefix
 * into client bundles, so a bare SENTRY_DSN resolves to undefined in the
 * browser and Sentry.init silently disables the SDK.
 */

const initMock = jest.fn();
const replayIntegrationMock = jest.fn(() => ({ name: "Replay" }));

jest.mock("@sentry/nextjs", () => ({
  init: (...args: unknown[]) => initMock(...args),
  replayIntegration: () => replayIntegrationMock(),
  captureRouterTransitionStart: jest.fn(),
}));

const ORIGINAL_ENV = process.env;

/** Imports the client instrumentation fresh and returns the Sentry.init options. */
function loadClientInstrumentation(): Record<string, unknown> {
  jest.isolateModules(() => {
    require("@/instrumentation-client");
  });
  return initMock.mock.calls[0][0];
}

describe("client Sentry instrumentation", () => {
  beforeEach(() => {
    jest.resetModules();
    initMock.mockClear();
    replayIntegrationMock.mockClear();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("reads the DSN from the NEXT_PUBLIC_ variable so it survives into the browser bundle", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN =
      "https://public@o0.ingest.sentry.io/1111";

    expect(loadClientInstrumentation().dsn).toBe(
      "https://public@o0.ingest.sentry.io/1111",
    );
  });

  it("does not fall back to the server-only SENTRY_DSN, which is undefined in the browser", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    process.env.SENTRY_DSN = "https://server-only@o0.ingest.sentry.io/2222";

    expect(loadClientInstrumentation().dsn).toBeUndefined();
  });

  it("tags events with the public environment and release", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN =
      "https://public@o0.ingest.sentry.io/1111";
    process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";
    process.env.NEXT_PUBLIC_COMMIT_HASH = "abc123";

    const options = loadClientInstrumentation();

    expect(options.environment).toBe("staging");
    expect(options.release).toBe("abc123");
  });
});
