"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "./Button";
import StatusPage from "./StatusPage";

type ErrorNoticeProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * What the App Router error boundaries (error.tsx, global-error.tsx) show.
 * Reports the error to Sentry, and shows the server digest so a visitor can
 * quote it when they get in touch.
 */
export default function ErrorNotice({ error, retry }: ErrorNoticeProps) {
  useEffect(() => {
    Sentry.captureException(error);
    // Also log to the console, for local development and server logs
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      kicker="Error"
      heading="Something went wrong"
      action={
        <Button variant="secondary" onClick={() => retry()}>
          Try again
        </Button>
      }
    >
      <p className="m-0">This page hit an error. Try again in a moment.</p>
      {error.digest && (
        <p className="m-0 mt-2 font-mono text-label">
          Reference {error.digest}
        </p>
      )}
    </StatusPage>
  );
}
