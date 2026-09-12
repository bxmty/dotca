import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { NextPageContext } from "next";

jest.mock("@sentry/nextjs", () => ({
  captureUnderscoreErrorException: jest.fn().mockResolvedValue(undefined),
}));

// next/error's default export carries getInitialProps as a static property,
// which is how _error.tsx reaches it, so the mock has to do the same.
jest.mock("next/error", () => {
  const MockError = ({ statusCode }: { statusCode: number }) => (
    <div data-testid="next-error">{statusCode}</div>
  );
  MockError.getInitialProps = jest.fn();
  return { __esModule: true, default: MockError };
});

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import CustomErrorComponent from "@/pages/_error";

const captureMock = Sentry.captureUnderscoreErrorException as jest.Mock;
const nextErrorGetInitialProps = (
  NextError as unknown as { getInitialProps: jest.Mock }
).getInitialProps;

function buildContext(statusCode?: number): NextPageContext {
  return { err: new Error("boom"), res: { statusCode } } as NextPageContext;
}

describe("pages-router error page", () => {
  it("shows the status code it was handed", () => {
    render(<CustomErrorComponent statusCode={404} />);

    expect(screen.getByTestId("next-error")).toHaveTextContent("404");
  });

  it("shows a 500 when the status code is missing", () => {
    render(<CustomErrorComponent />);

    expect(screen.getByTestId("next-error")).toHaveTextContent("500");
  });
});

describe("pages-router error page getInitialProps", () => {
  it("reports the error to Sentry before resolving, so serverless does not exit first", async () => {
    let sentryResolved = false;
    captureMock.mockImplementation(() =>
      Promise.resolve().then(() => {
        sentryResolved = true;
      }),
    );
    nextErrorGetInitialProps.mockImplementation(() => {
      expect(sentryResolved).toBe(true);
      return { statusCode: 503 };
    });
    const context = buildContext(503);

    const props = await CustomErrorComponent.getInitialProps(context);

    expect(captureMock).toHaveBeenCalledWith(context);
    expect(props).toEqual({ statusCode: 503 });
  });

  it("passes through whatever next/error derives from the response", async () => {
    nextErrorGetInitialProps.mockReturnValue({ statusCode: 404 });

    await expect(
      CustomErrorComponent.getInitialProps(buildContext(404)),
    ).resolves.toEqual({ statusCode: 404 });
    expect(nextErrorGetInitialProps).toHaveBeenCalledWith(buildContext(404));
  });
});
