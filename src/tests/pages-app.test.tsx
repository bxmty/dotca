import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { AppProps } from "next/app";
import type { Metric } from "web-vitals";

let mockMeasurementId: string | undefined = "G-TEST1234";
const mockRouterEvents = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
let mockAsPath = "/";

jest.mock("next/router", () => ({
  useRouter: () => ({ asPath: mockAsPath, events: mockRouterEvents }),
}));

jest.mock("@/lib/gtag", () => ({
  initGA: jest.fn(),
  event: jest.fn(),
  pageview: jest.fn(),
  // A getter so each test can choose whether a measurement ID is configured;
  // the real module reads it from the environment at import time.
  get GA_MEASUREMENT_ID() {
    return mockMeasurementId;
  },
}));

// Rendered as a div, not a script: React warns that client-rendered script
// tags never execute, and jest.setup.js surfaces console.error as test noise.
jest.mock("next/script", () => ({
  __esModule: true,
  default: ({ src, strategy }: { src: string; strategy: string }) => (
    <div data-testid="ga-script" data-strategy={strategy} data-src={src} />
  ),
}));

jest.mock("web-vitals", () => ({
  onCLS: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

import * as gtag from "@/lib/gtag";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import MyApp from "@/pages/_app";

const initGAMock = gtag.initGA as jest.Mock;
const eventMock = gtag.event as jest.Mock;
const pageviewMock = gtag.pageview as jest.Mock;

function buildApp(greeting = "hello") {
  const Page = () => <main data-testid="page">{greeting}</main>;
  return (
    <MyApp
      {...({
        Component: Page,
        pageProps: {},
        router: {},
      } as unknown as AppProps)}
    />
  );
}

function renderApp() {
  return render(buildApp());
}

/** The reporter _app handed to every web-vitals listener. */
function readCapturedReporter(): (metric: Metric) => void {
  const [reporter] = (onCLS as jest.Mock).mock.calls[0];
  return reporter;
}

function buildMetric(overrides: Partial<Metric> = {}): Metric {
  return {
    name: "LCP",
    id: "v4-1234",
    delta: 120.4,
    value: 2400,
    ...overrides,
  } as Metric;
}

const originalNodeEnv = process.env.NODE_ENV;

/** NODE_ENV is readonly in the Next.js type declarations but writable at runtime. */
function setNodeEnv(value: string | undefined): void {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  mockMeasurementId = "G-TEST1234";
  mockAsPath = "/";
});

afterEach(() => {
  setNodeEnv(originalNodeEnv);
});

describe("pages-router app wrapper", () => {
  it("renders the page with its props", () => {
    renderApp();

    expect(screen.getByTestId("page")).toHaveTextContent("hello");
  });

  it("initialises Google Analytics once on mount", () => {
    renderApp();

    expect(initGAMock).toHaveBeenCalledTimes(1);
  });

  it("loads the gtag script after hydration when a measurement ID is set", () => {
    renderApp();

    const script = screen.getByTestId("ga-script");
    expect(script).toHaveAttribute(
      "data-src",
      "https://www.googletagmanager.com/gtag/js?id=G-TEST1234",
    );
    expect(script).toHaveAttribute("data-strategy", "afterInteractive");
  });

  it("omits the gtag script when no measurement ID is configured", () => {
    mockMeasurementId = undefined;

    renderApp();

    expect(screen.queryByTestId("ga-script")).not.toBeInTheDocument();
  });
});

describe("pages-router web-vitals reporting", () => {
  it("registers a reporter with every Core Web Vital listener", () => {
    renderApp();

    for (const listener of [onCLS, onINP, onLCP, onFCP, onTTFB]) {
      expect(listener).toHaveBeenCalledTimes(1);
      expect(typeof (listener as jest.Mock).mock.calls[0][0]).toBe("function");
    }
  });

  it("sends a metric as a rounded web_vitals event labelled by metric ID", () => {
    renderApp();

    readCapturedReporter()(
      buildMetric({ name: "LCP", delta: 120.4, id: "lcp-1" }),
    );

    expect(eventMock).toHaveBeenCalledWith({
      action: "web_vitals",
      category: "Web Vitals",
      label: "lcp-1",
      value: 120,
    });
  });

  it("scales CLS to milliseconds so it survives the integer event value", () => {
    renderApp();

    readCapturedReporter()(
      buildMetric({ name: "CLS", delta: 0.0512, id: "cls-1" }),
    );

    expect(eventMock).toHaveBeenCalledWith({
      action: "web_vitals",
      category: "Web Vitals",
      label: "cls-1",
      value: 51,
    });
  });

  it("logs each metric in development, to make local regressions visible", () => {
    setNodeEnv("development");
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    renderApp();

    readCapturedReporter()(
      buildMetric({ name: "INP", delta: 18.2, value: 18.2, id: "inp-1" }),
    );

    expect(logSpy).toHaveBeenCalledWith("Web Vital: INP", {
      id: "inp-1",
      delta: 18.2,
      value: 18.2,
    });
    logSpy.mockRestore();
  });

  it("stays quiet outside development", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    renderApp();

    readCapturedReporter()(buildMetric({ name: "INP", id: "inp-2" }));

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("re-registers the listeners when the route changes", () => {
    const { rerender } = renderApp();
    expect(onCLS).toHaveBeenCalledTimes(1);

    mockAsPath = "/pricing";
    rerender(buildApp("pricing"));

    expect(onCLS).toHaveBeenCalledTimes(2);
  });
});

describe("pages-router page view tracking", () => {
  it("tracks a page view on route change completion", () => {
    renderApp();

    expect(mockRouterEvents.on).toHaveBeenCalledWith(
      "routeChangeComplete",
      expect.any(Function),
    );
    const [, handleRouteChange] = mockRouterEvents.on.mock.calls[0];
    handleRouteChange("/pricing");

    expect(pageviewMock).toHaveBeenCalledWith("/pricing");
  });

  it("unsubscribes the same handler on unmount, so it cannot leak", () => {
    const { unmount } = renderApp();
    const [, subscribed] = mockRouterEvents.on.mock.calls[0];

    unmount();

    expect(mockRouterEvents.off).toHaveBeenCalledWith(
      "routeChangeComplete",
      subscribed,
    );
  });
});
