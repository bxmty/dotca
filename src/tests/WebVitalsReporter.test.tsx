import { render } from "@testing-library/react";
import WebVitalsReporter from "@/app/components/WebVitalsReporter";
import * as webVitals from "@/lib/web-vitals";

jest.mock("@/lib/web-vitals", () => ({
  initWebVitals: jest.fn(),
}));

// Mock setTimeout to execute immediately for testing
jest.useFakeTimers();

describe("WebVitalsReporter", () => {
  it("initializes web vitals tracking on mount", () => {
    render(<WebVitalsReporter />);
    // Advance timers to trigger the setTimeout
    jest.advanceTimersByTime(1500);
    expect(webVitals.initWebVitals).toHaveBeenCalledTimes(1);
  });

  it("renders nothing to the DOM", () => {
    const { container } = render(<WebVitalsReporter />);
    expect(container.firstChild).toBeNull();
  });
});
