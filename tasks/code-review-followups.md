# Code Review Follow-Ups

Remaining findings from the full code review (2026-07-06). Already fixed on
`upgrades`: client-controlled payment amount, GA duplicate pageviews, Stripe
secret baked into Docker image, Umami removal.

## High priority

1. [x] **Unit tests never gate CI.** `npm run test` used
       `--testFailureExitCode=0`, so it exited 0 even when tests or coverage
       failed. Fixed in #569: the flag is gone from the test script and the
       pre-commit hook, `deploy.yml` runs the unit suite and its
       fail-on-test-failures gate is now reachable. Thresholds were set to
       measured coverage in #566 as a ratchet baseline; #570 covers the
       structured-data builders, the OG image renderer and the pages-router
       shell, which carries all four metrics past the 65/70 target.
2. [ ] **Rotate the Stripe secret key.** Previously built images have
       `STRIPE_SECRET_KEY` recoverable via `docker inspect`. After the
       Dockerfile fix deploys, rotate the key in Stripe and update the GitHub
       Environment secret (see docs/secrets-rotation-guide.md).
3. [ ] **Waitlist submissions never record the selected plan.**
       `WaitlistForm.tsx` sends `planName`, but `api/contact/route.ts`
       destructures `plan`, so Brevo's `PLAN_NAME` attribute is always empty.
       Align the field names and add a regression test.

## Medium priority

4. [x] **Missing `/checkout/confirmation` route.** `StripePaymentForm` uses it
       as the Stripe `return_url`; customers paying via redirect-based methods
       would land on a 404. Build the page before re-enabling payments.
5. [x] **Nested `<form>` in checkout.** `StripePaymentForm` renders a form
       inside the outer checkout form (invalid HTML, browsers drop it).
       Restructure when the payment path is re-enabled.
6. [x] **`npm install --frozen-lockfile` in Dockerfile.** npm ignores that
       flag (it's yarn/pnpm); use `npm ci` to actually enforce the lockfile.
7. [x] **Contact route error handling.** The `throw` for Brevo API errors at
       `api/contact/route.ts` is caught by its own JSON-parse `catch` and
       relabeled; non-string `phone` input causes a 500 instead of a 400; the
       dev-only fallback to `NEXT_PUBLIC_BREVO_API_KEY` invites bundling a
       secret into client JS — remove it.
8. [x] **Blog slug hardening.** `getBlogPostBySlug` joins the URL slug into a
       filesystem path unvalidated (add `/^[a-z0-9-]+$/i`) and does not filter
       unpublished posts itself (only the page component remembers to).

## Low priority

9. [ ] Employee-count input on checkout is nearly uneditable: intermediate
       values outside 5–20 are rejected while typing, and `parseInt` NaN is
       unhandled. Validate on blur/submit instead.
10. [ ] `sitemap.ts`: missing `date` frontmatter yields `Invalid Date` in the
        XML (`new Date(filename)` fallback); `readdirSync` calls are unguarded.
11. [ ] `next.config.js` sets `typescript.ignoreBuildErrors` and
        `eslint.ignoreDuringBuilds` — a manual build can ship type errors.
12. [ ] `parseFrontmatter.ts` edge cases vs gray-matter: frontmatter ending at
        EOF without a trailing newline, empty frontmatter block, and BOM prefix
        all silently parse as "no frontmatter".
13. [ ] `pages/_app.tsx` re-registers all five web-vitals observers on every
        route change and duplicates GA setup; only governs pages-router
        leftovers (404/\_error) — simplify or remove.
14. [ ] `/api/analytics/web-vitals` accepts and discards all data in
        production — wire it to storage or drop the client reporting.
15. [ ] `deploy.yml` path filters watch `jest.config.js` but the file is
        `jest.config.cjs`.
16. [ ] `gtag.ts` runs `console.log` at module load on both server and client
        in all environments — gate behind development.
17. [ ] Checkout Terms of Service / Privacy Policy links are `href="#"`; real
        pages exist at `/terms-of-service` and `/privacy-policy`.
18. [ ] `src/lib/analytics.ts` is imported only by its own test — decide
        whether to adopt it as the app-facing tracking API or delete it.
19. [ ] Delete the now-unused `UMAMI_DB_PASSWORD`, `UMAMI_APP_SECRET`, and
        `UMAMI_ADMIN_PASSWORD` secrets from the GitHub Environment settings.
20. [ ] Stray file `neline --no-merges` at the repo root (accidental `git log`
        output redirect) — delete it.
