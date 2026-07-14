# PRD: Sentry.io Integration

## 1. Introduction / Overview

This document describes the integration of **Sentry.io** into the dotca project (Next.js 16 application) for **error tracking** and **performance monitoring**. The goal is to capture production errors with useful context and stack traces, support manual error reporting where needed, and collect performance data—all within Sentry’s **free tier** and with **no PII** sent to Sentry.

**Problem:** Today, production errors are only logged to the console (e.g. in `error.tsx`). There is no centralized visibility into what fails in production or how the app performs for real users.

**Goal:** Provide reliable, privacy-safe observability for errors and performance using Sentry’s free tier, without introducing regressions for users.

---

## 2. Goals

- **Error visibility:** All unhandled and manually reported errors in production (and optionally other environments) appear in Sentry with stack traces and context.
- **Performance visibility:** Key transactions and spans (e.g. page loads, API calls) are visible in Sentry so we can spot slow pages or endpoints.
- **Privacy:** No PII (e.g. emails, names, phone numbers) is sent to Sentry; use scrubbing and avoid setting user identifiers that contain PII.
- **Free tier only:** Use only features and quotas included in Sentry’s free tier (see Technical Considerations).
- **Stability:** Enabling Sentry must not introduce new user-facing errors or regressions.

---

## 3. User Stories

- **As a developer,** I want unhandled errors in the browser and on the server to be reported to Sentry so that I can debug production issues using stack traces and context.
- **As a developer,** I want to call `Sentry.captureException()` (or equivalent) in try/catch blocks so that I can report handled errors with custom context.
- **As a developer,** I want performance data (e.g. page load, API latency) in Sentry so that I can find slow pages and backend calls.
- **As a developer,** I want errors and performance data to stay within Sentry’s free tier limits so that we don’t incur cost without explicit approval.
- **As a user of the application,** I want the site to behave the same after Sentry is enabled (no new errors or broken features).

---

## 4. Functional Requirements

1. **Client-side error capture:** The system must capture unhandled JavaScript errors and unhandled promise rejections in the browser and send them to Sentry (with stack traces where available).

2. **Server-side error capture:** The system must capture unhandled exceptions in Next.js server code (e.g. Server Components, Route Handlers, Server Actions) and send them to Sentry.

3. **Integration with existing error boundary:** The existing `src/app/error.tsx` React error boundary must report the caught error to Sentry (in addition to or instead of only logging to `console.error`), so that React component errors are visible in Sentry.

4. **Manual error reporting:** The system must expose a way for application code to report errors manually (e.g. `Sentry.captureException(error)` or equivalent) with optional extra context (e.g. tags, extra data), and these must appear in Sentry.

5. **Performance monitoring (client):** The system must instrument the Next.js client application so that key page loads and navigations are reported as transactions to Sentry, with spans for sub-operations where supported by the Sentry SDK.

6. **Performance monitoring (server):** The system must instrument Next.js server-side work (e.g. Route Handlers, Server Actions, or critical server paths) so that relevant operations appear as transactions/spans in Sentry, within free-tier limits.

7. **Single Sentry project:** All environments (e.g. development, staging, production) must report to one Sentry project. Events must be distinguishable by environment (e.g. via `environment` tag or Sentry config) so that developers can filter by environment in Sentry.

8. **No PII in events:** The system must ensure that no personally identifiable information (e.g. email, full name, phone number, address) is sent to Sentry. This must be achieved by:
   - Configuring Sentry to scrub or deny known PII from payloads (e.g. request headers, body, breadcrumbs), and/or
   - Not setting user identifiers (e.g. `Sentry.setUser()`) with PII, and/or
   - Only setting non-PII identifiers (e.g. anonymous or hashed IDs) if user context is needed.

9. **Source maps (optional but recommended):** The system should support uploading source maps to Sentry (e.g. via Sentry’s build integration or CLI) so that stack traces show original source locations. Implementation must respect free-tier attachment/storage limits (e.g. 1 GB).

10. **Release association (optional):** If source maps are uploaded, errors and performance data should be associable with a release (e.g. commit hash or version) so that we can correlate issues with deployments. The project already exposes `NEXT_PUBLIC_COMMIT_HASH`; this may be used as the release identifier.

11. **No regression:** After integration, the application must not throw new errors or break existing functionality because of Sentry (e.g. SDK must be loaded and configured in a way that does not block rendering or break in unsupported browsers).

---

## 5. Non-Goals (Out of Scope)

- **Paid Sentry features:** No use of features or quotas that require a paid plan (e.g. exceeding free-tier error or span limits without a documented decision to upgrade).
- **Session Replay:** Session Replay is not in scope for the first version, even though the free tier includes a limited number of replays. It may be revisited later.
- **Cron or uptime monitors:** Sentry’s free tier includes limited cron/uptime monitors; these are out of scope unless explicitly added in a later PRD.
- **Custom alerting beyond Sentry:** No requirement to integrate Sentry with Slack, PagerDuty, or other external alerting in this PRD (Sentry’s own email alerts are acceptable).
- **User identification with PII:** We will not set Sentry user context with real email, name, or other PII.
- **Multiple Sentry projects:** One project for all environments; no separate projects per environment in this scope.

---

## 6. Design Considerations

- **No UI change for end users:** Sentry runs in the background. The only user-facing change may be the existing error boundary (`error.tsx`) continuing to show “Something went wrong!” and “Try again,” with the addition of reporting that error to Sentry.
- **Existing `error.tsx`:** The current `src/app/error.tsx` logs the error with `console.error`. The implementation must add a call to report the same error to Sentry so that React error-boundary errors are visible in Sentry.
- **Existing analytics:** The app uses Google Analytics and a `WebVitalsReporter`. Sentry may also capture Web Vitals; duplication with existing reporting is acceptable as long as it stays within free-tier limits and does not break the app.

---

## 7. Technical Considerations

### 7.1 Stack

- **Framework:** Next.js 16 (App Router).
- **Existing:** React 19, TypeScript, `src/app/error.tsx` (client component), root `layout.tsx`, `NEXT_PUBLIC_COMMIT_HASH` available at build time.

### 7.2 Sentry free tier (reference)

- **Errors:** 5,000 errors per month.
- **Performance:** 10 million spans per month (span-based pricing).
- **Session Replay:** 50 sessions/month (out of scope for v1).
- **Attachments:** 1 GB (relevant if uploading source maps).
- **Projects:** Unlimited; **users:** 1 (single developer).
- **Notifications:** Email alerts.

Implementation must stay within these limits. Consider sampling or limiting instrumentation (e.g. only production, or only a subset of routes) if volume could exceed the free tier.

### 7.3 Recommended approach (high level)

- Use the official **Sentry SDK for Next.js** (e.g. `@sentry/nextjs`) which supports both client and server in one integration.
- Configure Sentry in a way that:
  - Runs in all environments but sets `environment` (e.g. `development`, `staging`, `production`) so that one project can filter by env.
  - Enables error capture (client + server) and performance (client + server) as required.
  - Applies PII scrubbing and does not set PII in user context.
- **Client:** Initialize Sentry in the client bundle (e.g. via Next.js instrumentation or a client layout/wrapper) and ensure the React error boundary reports to Sentry.
- **Server:** Use Sentry’s Next.js server instrumentation (e.g. `instrumentation.ts` or framework-recommended setup) so that server errors and traces are captured.
- **Release:** Set release to `process.env.NEXT_PUBLIC_COMMIT_HASH` (or similar) when uploading source maps and when initializing the SDK, so that events can be tied to a deploy.
- **Source maps:** Use Sentry’s build or CLI to upload source maps for production builds; ensure uploads are only for production (or intended envs) and within the 1 GB attachment limit.
- **Dependencies:** Add only Sentry packages required for Next.js (e.g. `@sentry/nextjs`). Avoid adding paid-only or unnecessary features.

### 7.4 Environment variables

- At least one **Sentry DSN** (e.g. `NEXT_PUBLIC_SENTRY_DSN` for client, and `SENTRY_DSN` or same DSN for server, depending on SDK docs). Keep DSN in environment variables; do not commit secrets.
- Optional: `SENTRY_AUTH_TOKEN` or similar for source map uploads (stored in CI/env only, not in repo).

### 7.5 Existing code to touch

- **`src/app/error.tsx`:** Add Sentry report for the caught `error` (and optionally `digest`).
- **Root layout or Sentry docs:** Ensure client-side Sentry is loaded early (e.g. via Sentry’s recommended Next.js setup, which may use a wrapper or instrumentation).
- **New files:** Likely `instrumentation.ts` (or equivalent per Sentry + Next.js 16 docs), Sentry config file (e.g. `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` if used), and possibly a global error handler for the server (e.g. `global-error.tsx` for root-level server errors if desired).

---

## 8. Success Metrics

1. **Errors visible:** Every unhandled error in production that hits the error boundary or escapes to the runtime is visible in Sentry with a stack trace (and, if source maps are set up, with original source references).
2. **Manual reports work:** Errors reported via `Sentry.captureException()` (or equivalent) appear in Sentry with the provided context.
3. **Performance visible:** Key page loads and server operations appear as transactions/spans in Sentry, and developers can use this data to identify slow pages or endpoints.
4. **No regressions:** No increase in user-facing errors or broken flows after Sentry is enabled (e.g. no new failures in existing E2E or smoke tests, and no critical bugs reported due to Sentry).

---

## 9. Open Questions

- **Sampling:** If error or span volume approaches free-tier limits, should we add sampling (e.g. report only a percentage of events)? If so, at what threshold and for which event types?
- **`global-error.tsx`:** Should the app add a root `global-error.tsx` to catch errors that escape the root layout and report them to Sentry (and show a generic error UI)?
- **Staging vs production:** Should Sentry be disabled or heavily sampled in development to avoid consuming quota and noise, or is “one project for all envs” with filtering sufficient for now?

---

_PRD created for the dotca project. Implementation should be done by a developer following this document and the official Sentry for Next.js documentation._
