# Code Review Follow-Ups

Remaining findings from the full code review (2026-07-06). Already fixed on
`upgrades`: client-controlled payment amount, GA duplicate pageviews, Stripe
secret baked into Docker image, Umami removal.

## High priority

- [ ] **Unit tests never gate CI.** `npm run test` uses
      `--testFailureExitCode=0`, so it exits 0 even when tests or coverage
      fail, and `deploy.yml` runs lint + typecheck but no jest step before
      deploying. Remove the flag, add a unit-test step to the build job, and
      note that coverage is currently below the thresholds in
      `jest.config.cjs` (58% statements vs 70% minimum) — either raise
      coverage or lower the thresholds honestly.
- [ ] **Rotate the Stripe secret key.** Previously built images have
      `STRIPE_SECRET_KEY` recoverable via `docker inspect`. After the
      Dockerfile fix deploys, rotate the key in Stripe and update the GitHub
      Environment secret (see docs/secrets-rotation-guide.md).
- [ ] **Waitlist submissions never record the selected plan.**
      `WaitlistForm.tsx` sends `planName`, but `api/contact/route.ts`
      destructures `plan`, so Brevo's `PLAN_NAME` attribute is always empty.
      Align the field names and add a regression test.

## Medium priority

- [ ] **Missing `/checkout/confirmation` route.** `StripePaymentForm` uses it
      as the Stripe `return_url`; customers paying via redirect-based methods
      would land on a 404. Build the page before re-enabling payments.
- [ ] **Nested `<form>` in checkout.** `StripePaymentForm` renders a form
      inside the outer checkout form (invalid HTML, browsers drop it).
      Restructure when the payment path is re-enabled.
- [ ] **`npm install --frozen-lockfile` in Dockerfile.** npm ignores that
      flag (it's yarn/pnpm); use `npm ci` to actually enforce the lockfile.
- [ ] **Contact route error handling.** The `throw` for Brevo API errors at
      `api/contact/route.ts` is caught by its own JSON-parse `catch` and
      relabeled; non-string `phone` input causes a 500 instead of a 400; the
      dev-only fallback to `NEXT_PUBLIC_BREVO_API_KEY` invites bundling a
      secret into client JS — remove it.
- [ ] **Blog slug hardening.** `getBlogPostBySlug` joins the URL slug into a
      filesystem path unvalidated (add `/^[a-z0-9-]+$/i`) and does not filter
      unpublished posts itself (only the page component remembers to).

## Low priority

- [ ] Employee-count input on checkout is nearly uneditable: intermediate
      values outside 5–20 are rejected while typing, and `parseInt` NaN is
      unhandled. Validate on blur/submit instead.
- [ ] `sitemap.ts`: missing `date` frontmatter yields `Invalid Date` in the
      XML (`new Date(filename)` fallback); `readdirSync` calls are unguarded.
- [ ] `next.config.js` sets `typescript.ignoreBuildErrors` and
      `eslint.ignoreDuringBuilds` — a manual build can ship type errors.
- [ ] `parseFrontmatter.ts` edge cases vs gray-matter: frontmatter ending at
      EOF without a trailing newline, empty frontmatter block, and BOM prefix
      all silently parse as "no frontmatter".
- [ ] `pages/_app.tsx` re-registers all five web-vitals observers on every
      route change and duplicates GA setup; only governs pages-router
      leftovers (404/_error) — simplify or remove.
- [ ] `/api/analytics/web-vitals` accepts and discards all data in
      production — wire it to storage or drop the client reporting.
- [ ] `deploy.yml` path filters watch `jest.config.js` but the file is
      `jest.config.cjs`.
- [ ] `gtag.ts` runs `console.log` at module load on both server and client
      in all environments — gate behind development.
- [ ] Checkout Terms of Service / Privacy Policy links are `href="#"`; real
      pages exist at `/terms-of-service` and `/privacy-policy`.
- [ ] `src/lib/analytics.ts` is imported only by its own test — decide
      whether to adopt it as the app-facing tracking API or delete it.
- [ ] Delete the now-unused `UMAMI_DB_PASSWORD`, `UMAMI_APP_SECRET`, and
      `UMAMI_ADMIN_PASSWORD` secrets from the GitHub Environment settings.
- [ ] Stray file `neline --no-merges` at the repo root (accidental `git log`
      output redirect) — delete it.
