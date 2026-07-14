## Relevant Files

The Sentry wizard will create these files automatically:

- `instrumentation.ts` - Registers server and edge configurations with Next.js
- `sentry.client.config.ts` - Client-side Sentry configuration (runs in browser)
- `sentry.server.config.ts` - Server-side Sentry configuration (runs in Node.js)
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `next.config.ts` - Wrapped with Sentry configuration for source maps and build features
- `app/global-error.tsx` - Root-level error boundary for React rendering errors
- `app/sentry-example-page/page.tsx` - Test page with error button
- `app/api/sentry-example-api/route.ts` - Test API route
- `.env.sentry-build-plugin` - Auth token for source map uploads (auto-added to .gitignore)

### Notes

- The Sentry wizard automatically configures all runtime environments (client, server, edge)
- Source maps are uploaded during production builds via the wrapped next.config.ts
- The wizard creates test pages to verify your setup works correctly
- Environment variables are managed through .env.local and .env.sentry-build-plugin

## Tasks

- [x] 1.0 Run Sentry wizard and setup basic configuration
  - [x] 1.1 Create Sentry account and project at [sentry.io](https://sentry.io/signup/)
  - [x] 1.2 Run `npx @sentry/wizard@latest -i nextjs` to automatically configure Sentry
  - [x] 1.3 Select desired features when prompted: Error Monitoring, Tracing, Session Replay, Logs
  - [x] 1.4 Review and commit the automatically generated files
  - [x] 1.5 Add SENTRY_AUTH_TOKEN to your CI/CD environment for source map uploads
- [x] 2.0 Test and verify Sentry setup
  - [x] 2.1 Start development server with `npm run dev`
  - [x] 2.2 Visit `http://localhost:3000/sentry-example-page` and click "Throw Sample Error"
  - [x] 2.3 Verify error appears in Sentry dashboard with correct stack traces
  - [x] 2.4 Check that performance traces are captured for page loads and API calls
  - [x] 2.5 Confirm Session Replay recordings are working (if enabled)
  - [x] 2.6 Test logging functionality with `Sentry.logger.info/warn/error()` calls
- [x] 3.0 Configure sampling rates and environment settings
  - [x] 3.1 Adjust `tracesSampleRate` in configuration files (1.0 for dev, 0.1 for prod)
  - [x] 3.2 Configure `replaysSessionSampleRate` and `replaysOnErrorSampleRate` (if using Session Replay)
  - [x] 3.3 Set environment tagging in all config files (`environment: process.env.NODE_ENV`)
  - [x] 3.4 Configure PII scrubbing if needed (default settings handle most cases)
  - [ ] 3.5 Monitor usage stats and adjust rates to stay within free tier limits
- [x] 4.0 Update existing error boundaries (optional)
  - [x] 4.1 Review existing `src/app/error.tsx` and consider integration with Sentry
  - [x] 4.2 Update error boundaries to use `Sentry.captureException()` for manual error reporting
  - [x] 4.3 Test that both automatic and manual error capture work correctly
- [x] 5.0 Setup release tracking and source maps
  - [x] 5.1 Set release identifier using `NEXT_PUBLIC_COMMIT_HASH` in Sentry configurations
  - [x] 5.2 Test production build with `npm run build` to verify source map uploads
  - [x] 5.3 Verify that error stack traces show original source code, not minified code
  - [x] 5.4 Ensure source map uploads respect the 1GB attachment limit
- [x] 6.0 Configure deployment pipeline for Sentry
  - [x] 6.1 Add Sentry environment variables to `.github/workflows/deploy.yml` build-args
  - [x] 6.2 Configure environment-specific Sentry DSNs (staging vs production projects)
  - [x] 6.3 Add `SENTRY_AUTH_TOKEN` secret to GitHub repository secrets for source map uploads
  - [x] 6.4 Verify Sentry variables are passed to Docker build for both staging and production
  - [x] 6.5 Test deployment to staging and verify Sentry error capture works in deployed environment
  - [x] 6.6 Confirm source maps are uploaded during production builds via CI/CD
- [x] 7.0 Update architecture diagrams
  - [x] 7.1 Locate existing architecture diagrams in the project (check docs/, README.md)
  - [x] 7.2 Add Sentry SDK integration points to component and class diagrams
  - [x] 7.3 Document data flow from client/server to Sentry (errors, traces, replays)
  - [x] 7.4 Show environment-based filtering and sampling configurations
  - [x] 7.5 Validate diagrams accurately reflect the wizard-generated setup
