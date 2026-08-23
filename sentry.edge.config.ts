// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Environment tagging for better issue organization
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,

  // Release tracking for better error grouping and deployment tracking
  release: process.env.NEXT_PUBLIC_COMMIT_HASH,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Bots/scanners probe for Next.js Server Actions with a bogus Next-Action
  // header even though this app defines none; Next.js's fallback error
  // handling for that case throws this pair of framework-internal errors.
  // Not actionable, so keep them out of the issue stream.
  ignoreErrors: [
    /Failed to find Server Action/,
    /Expected RSC response, got text\/plain/,
  ],
});
