// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { isIntakePagePath, scrubLinkTokens } from "@/lib/sentry-scrub";

// An intake link (#565) holds its token in the path. A replay stores the page
// URL inside its recording, which the send hooks below never see, so replay
// is not loaded at all when the page opens on one.
const isIntakePage = isIntakePagePath(window.location.pathname);

Sentry.init({
  // Must be NEXT_PUBLIC_-prefixed: Next.js only inlines that prefix into the
  // client bundle, and Sentry.init with an undefined DSN disables the SDK
  // silently. A Sentry DSN is designed to be public, so exposing it here is
  // the intended usage. Server and edge keep reading the unprefixed SENTRY_DSN.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tagging for better issue organization
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,

  // Release tracking for better error grouping and deployment tracking
  release: process.env.NEXT_PUBLIC_COMMIT_HASH,

  // Add optional integrations for additional features
  integrations: isIntakePage ? [] : [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // v11 collects user info, cookies, and request data by default, which
  // matches the previous sendDefaultPii: true setting.

  // Link tokens sit in the page URL, which events, breadcrumbs and spans record.
  beforeSend: (event) => scrubLinkTokens(event),
  beforeSendTransaction: (event) => scrubLinkTokens(event),
  beforeSendSpan: Sentry.withStreamedSpan((span) => scrubLinkTokens(span)),
});

/**
 * No link on the site points at an intake link, so a replay should never be
 * running when one opens. This stops it if a client-side navigation gets
 * there anyway; replay then stays off until the next full page load.
 */
export function onRouterTransitionStart(
  href: string,
  navigationType: string,
): void {
  if (isIntakePagePath(href)) {
    void Sentry.getReplay()?.stop();
  }
  Sentry.captureRouterTransitionStart(href, navigationType);
}
