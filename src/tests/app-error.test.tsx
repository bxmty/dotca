import { render, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import "@testing-library/jest-dom";

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import AppError from "@/app/error";
import GlobalError from "@/app/global-error";

const captureMock = Sentry.captureException as jest.Mock;

beforeEach(() => {
  captureMock.mockClear();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("app error boundary", () => {
  it("reports the error and renders in the new system", () => {
    const error = new Error("boom");
    render(<AppError error={error} retry={jest.fn()} />);

    expect(captureMock).toHaveBeenCalledWith(error);
    expect(console.error).toHaveBeenCalledWith(error);
    expect(
      screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toHaveClass(
      "border-ink",
      "rounded-ctl",
    );
  });

  it("retries when asked", () => {
    const retry = jest.fn();
    render(<AppError error={new Error("boom")} retry={retry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("shows the error digest for support, when there is one", () => {
    const error = Object.assign(new Error("boom"), { digest: "d1g35t" });
    render(<AppError error={error} retry={jest.fn()} />);

    expect(screen.getByText("Reference d1g35t")).toBeInTheDocument();
  });
});

describe("global error boundary", () => {
  it("renders its own document on the brand tokens and fonts", () => {
    const markup = renderToString(
      <GlobalError error={new Error("boom")} retry={jest.fn()} />,
    );

    expect(markup).toMatch(/<html[^>]*lang="en"[^>]*class="variable variable"/);
    expect(markup).toContain("Something went wrong");
    expect(markup).toContain("Try again");
  });
});
