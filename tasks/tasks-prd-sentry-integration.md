## Relevant Files

- `package.json` - Add Sentry dependencies (@sentry/nextjs).
- `src/lib/sentry.ts` - Utility functions for Sentry error reporting and configuration.
- `src/lib/sentry.test.ts` - Unit tests for Sentry utility functions.
- `src/instrumentation.ts` - Next.js instrumentation file for server-side Sentry setup.
- `sentry.client.config.ts` - Client-side Sentry configuration.
- `sentry.server.config.ts` - Server-side Sentry configuration.
- `src/app/error.tsx` - Update existing error boundary to report errors to Sentry.
- `src/app/global-error.tsx` - New root-level error boundary for server errors (if decided to add).
- `.env.local` - Add Sentry environment variables (DSN, auth token for source maps).
- `next.config.mjs` - Configure Sentry webpack plugin for source maps.
- `src/app/layout.tsx` - Ensure Sentry is loaded early in client bundle.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Install Sentry dependencies and setup basic configuration
  - [ ] 1.1 Install @sentry/nextjs package using npm
  - [ ] 1.2 Create Sentry project in Sentry.io and obtain DSN
  - [ ] 1.3 Add Sentry environment variables to .env.local (NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN for source maps)
  - [ ] 1.4 Create basic src/lib/sentry.ts utility with error reporting functions and PII scrubbing configuration
  - [ ] 1.5 Run npx @sentry/wizard@latest --ci to initialize Sentry configuration for Next.js
  - [ ] 1.6 Test basic Sentry initialization by running the app and checking console for Sentry logs
- [ ] 2.0 Update existing architecture diagrams (class and component diagrams)
  - [ ] 2.1 Locate existing architecture diagrams in the project (check docs/, README.md, or similar)
  - [ ] 2.2 Add Sentry components to class diagram showing client/server SDK integration
  - [ ] 2.3 Add Sentry data flow to component diagram showing error capture and performance monitoring paths
  - [ ] 2.4 Update diagrams to show environment-based filtering and PII scrubbing
  - [ ] 2.5 Validate diagrams are accurate with implementation plan
- [ ] 3.0 Implement client-side Sentry integration
  - [ ] 3.1 Update src/app/error.tsx to report errors to Sentry instead of only console.error
  - [ ] 3.2 Configure sentry.client.config.ts with PII scrubbing rules and environment tagging
  - [ ] 3.3 Ensure Sentry client is loaded early in src/app/layout.tsx (before other scripts)
  - [ ] 3.4 Add Sentry.captureException() wrapper in src/lib/sentry.ts for manual error reporting
  - [ ] 3.5 Test client error capture by triggering an error in a component and verifying it appears in Sentry
  - [ ] 3.6 Verify no PII is sent by checking Sentry events for scrubbed data
- [ ] 4.0 Implement server-side Sentry integration
  - [ ] 4.1 Create instrumentation.ts at project root for server-side Sentry initialization
  - [ ] 4.2 Configure sentry.server.config.ts with server-specific settings and PII scrubbing
  - [ ] 4.3 Ensure server-side error capture works for API routes and Server Components
  - [ ] 4.4 Add environment-based configuration to distinguish dev/staging/prod events
  - [ ] 4.5 Test server error capture by triggering an error in an API route and verifying it appears in Sentry
  - [ ] 4.6 Validate that server-side performance traces are captured without exceeding free tier limits
- [ ] 5.0 Add performance monitoring
  - [ ] 5.1 Enable client-side performance monitoring in sentry.client.config.ts for page loads and navigations
  - [ ] 5.2 Enable server-side performance monitoring in sentry.server.config.ts for API routes and Server Actions
  - [ ] 5.3 Configure sampling rates to stay within free tier limits (10M spans/month)
  - [ ] 5.4 Add manual transaction/span creation utilities in src/lib/sentry.ts for custom performance tracking
  - [ ] 5.5 Test performance monitoring by navigating pages and making API calls, verify transactions appear in Sentry
  - [ ] 5.6 Monitor span usage to ensure we stay within free tier limits
- [ ] 6.0 Setup source maps and release tracking
  - [ ] 6.1 Configure next.config.mjs to upload source maps to Sentry during production builds
  - [ ] 6.2 Set release identifier to NEXT_PUBLIC_COMMIT_HASH in Sentry configurations
  - [ ] 6.3 Test source map upload by building for production and verifying stack traces show original code
  - [ ] 6.4 Ensure source map uploads respect 1GB attachment limit
  - [ ] 6.5 Validate that errors and performance data are associated with correct releases