/**
 * Guards the wiring fixed in bxmty/dotca#567: the browser Sentry SDK reads its
 * DSN from a NEXT_PUBLIC_-prefixed variable. Next.js only inlines that prefix
 * into client bundles, so a bare SENTRY_DSN resolves to undefined in the
 * browser and Sentry.init silently disables the SDK.
 */

const initMock = jest.fn();
const replayIntegrationMock = jest.fn(() => ({ name: "Replay" }));

const captureRouterTransitionStartMock = jest.fn();
const stopReplayMock = jest.fn(() => Promise.resolve());

jest.mock("@sentry/nextjs", () => ({
  init: (...args: unknown[]) => initMock(...args),
  replayIntegration: () => replayIntegrationMock(),
  getReplay: () => ({ stop: stopReplayMock }),
  withStreamedSpan: (callback: unknown) => callback,
  captureRouterTransitionStart: (...args: unknown[]) =>
    captureRouterTransitionStartMock(...args),
}));

const ORIGINAL_ENV = process.env;

type ClientInstrumentationModule = typeof import("@/instrumentation-client");

/** Imports the client instrumentation fresh. */
function loadClientInstrumentationModule(): ClientInstrumentationModule {
  let loaded: ClientInstrumentationModule | undefined;
  jest.isolateModules(() => {
    loaded = require("@/instrumentation-client");
  });
  return loaded as ClientInstrumentationModule;
}

/** Imports the client instrumentation fresh and returns the Sentry.init options. */
function loadClientInstrumentation(): Record<string, unknown> {
  loadClientInstrumentationModule();
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

// The intake link's token is a path segment (#565): it must not reach Sentry
// from the browser, where the page URL is on every event and in a replay.
describe("client Sentry instrumentation on an intake link", () => {
  const INTAKE_PATH = "/service-request/k3Zr-9_qLm";

  beforeEach(() => {
    jest.resetModules();
    initMock.mockClear();
    replayIntegrationMock.mockClear();
    captureRouterTransitionStartMock.mockClear();
    stopReplayMock.mockClear();
    window.history.pushState({}, "", "/");
  });

  afterAll(() => {
    window.history.pushState({}, "", "/");
  });

  it.each(["beforeSend", "beforeSendTransaction", "beforeSendSpan"])(
    "filters the token out of what %s sends",
    (hookName) => {
      const hook = loadClientInstrumentation()[hookName] as (
        payload: unknown,
      ) => unknown;

      expect(
        hook({ request: { url: `https://boximity.ca${INTAKE_PATH}` } }),
      ).toEqual({
        request: { url: "https://boximity.ca/service-request/[Filtered]" },
      });
    },
  );

  it("records session replay on other pages", () => {
    window.history.pushState({}, "", "/contact");

    expect(loadClientInstrumentation().integrations).toEqual([
      { name: "Replay" },
    ]);
  });

  it("does not load session replay when the page is an intake link", () => {
    window.history.pushState({}, "", INTAKE_PATH);

    expect(loadClientInstrumentation().integrations).toEqual([]);
    expect(replayIntegrationMock).not.toHaveBeenCalled();
  });

  it("stops a running replay before an in-app navigation to an intake link", () => {
    const { onRouterTransitionStart } = loadClientInstrumentationModule();

    onRouterTransitionStart(INTAKE_PATH, "push");

    expect(stopReplayMock).toHaveBeenCalledTimes(1);
    expect(captureRouterTransitionStartMock).toHaveBeenCalledWith(
      INTAKE_PATH,
      "push",
    );
  });

  it("leaves the replay running on any other navigation", () => {
    const { onRouterTransitionStart } = loadClientInstrumentationModule();

    onRouterTransitionStart("/contact", "push");

    expect(stopReplayMock).not.toHaveBeenCalled();
    expect(captureRouterTransitionStartMock).toHaveBeenCalledWith(
      "/contact",
      "push",
    );
  });
});
