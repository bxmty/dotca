# PRD: Paid Checkout (Subscriptions) + Email Redundancy

**Status:** Planned
**Created:** 2026-07-11
**Supersedes:** `tasks/prd-resend-email-service.md` (written 2025-02-19, assumes the waitlist survives — delete it when this lands)

---

## 1. Overview

Two changes that overlap in the same routes, so they're planned together:

1. **Remove the waitlist.** `/checkout` becomes a real paid signup flow. The waitlist was never a feature so much as a holding pattern — the payment path exists but is dead-coded behind `{false && ...}`.
2. **Add Resend as redundancy for Brevo.** Every form submission also emails the webmaster, so a Brevo outage or misconfiguration can't silently lose a lead.

### The thing that makes this bigger than it looks

`/api/stripe/create-payment-intent` calls `stripe.paymentIntents.create` — a **one-time charge**. But `src/lib/pricing.ts` prices plans **per-user, per-month** (`basic: 9900` = $99/user/mo). The waitlist gate is currently the only thing hiding this mismatch. Removing the gate as-is would ship a subscription business that bills each customer exactly once, forever.

So this work necessarily includes **reworking checkout onto Stripe Subscriptions**. That is the bulk of the effort, not the waitlist deletion.

---

## 2. Decisions (settled)

| Question                    | Decision                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Billing model               | **Stripe Subscriptions** — Customer + recurring Price + Subscription. Real rebilling.                                                                                 |
| Currency                    | **CAD.** `pricing.ts` currently says `usd`, which is wrong for an Ontario MSP. Locked in before any Stripe Price is created, because a Price's currency is immutable. |
| `/checkout` "Next Steps" UI | Stripe card element only. No radio group. Secondary "Need invoicing or a custom plan? Contact us →" link.                                                             |
| Brevo waitlist list 10      | Dropped from the contact path. `isWaitlist` param and `IS_WAITLIST` attribute deleted; all contact-form leads → list 9.                                               |
| Resend vs Brevo             | Both fire in parallel, **both awaited**. Submission succeeds if **either** lands.                                                                                     |
| Onboarding                  | Now writes a Brevo contact (**reusing list 10**, the vacated waitlist list) _and_ emails the webmaster. Today it persists nothing at all.                             |
| Paid signup notification    | Yes — via a **new Stripe webhook route**, so it fires even if the customer closes the tab.                                                                            |
| Spam                        | Honeypot field + per-IP rate limit on the public form routes.                                                                                                         |
| Resend account              | **Does not exist yet.** Account creation + domain verification is a blocking prerequisite.                                                                            |
| Webmaster inbox             | `hi@boximity.ca` — the address the forms' own failure copy already points users at.                                                                                   |

### Redundancy semantics

Validation failures (bad email, bad phone) short-circuit **before** either call — we never email the webmaster garbage. After validation:

```
Brevo ok   + Resend any   → 200 success
Brevo FAIL + Resend ok    → 200 success   ← the lead is in your inbox; don't tell the user to go away
Brevo FAIL + Resend FAIL  → 503 "contact us directly at hi@boximity.ca or (289) 539-0098"
```

Every partial failure is logged (and reported to Sentry) even when the response is a 200.

---

## 3. Admin runbook — account setup (manual, before any code ships)

**These are on you, not on the code.** Nothing in Phases 1–6 can be tested until this section is done.

### The rule that shapes all of it: test mode and live mode are separate universes

Stripe **Price IDs** and **webhook signing secrets** are _per-mode_. A `price_…` created in test mode does not exist in live mode, and the webhook secret for staging is not the one for production. So:

- The 6 Prices in §3.1 are created **twice** — once in test mode (→ staging + local dev), once in live mode (→ production).
- The webhook is registered **three times** — Stripe CLI (local), test-mode dashboard endpoint (staging), live-mode dashboard endpoint (production) — yielding **three different `whsec_…` values**.
- Every `STRIPE_PRICE_*` and `STRIPE_WEBHOOK_SECRET` is therefore an **environment-scoped** secret, never a shared one. Copying a staging value into production is a silent failure: the subscription create will throw _"No such price"_ at the first real customer.

### 3.1 Stripe — create the recurring Prices (do this in BOTH test and live mode)

3 plans × 2 cycles = 6 Prices per mode (**12 total**), all _per-seat_ (quantity = employee count):

| Plan     | Monthly (per seat) | Annual (per seat) |
| -------- | ------------------ | ----------------- |
| Basic    | CA$99.00           | CA$1,069.20       |
| Standard | CA$249.00          | CA$2,689.20       |
| Premium  | CA$449.00          | CA$4,849.20       |

**Set the currency to CAD when you create each Price — it cannot be changed afterward.** Getting this wrong means deleting and recreating all six.

Annual bakes in the existing 10% discount (`unit × 12 × 0.9`, from `ANNUAL_DISCOUNT_MULTIPLIER`). Once Stripe owns the prices, that multiplier leaves the codebase — otherwise the discount lives in two places and they will drift.

**Note the assumption:** these figures are _unchanged_ from `PLAN_UNIT_PRICE_CENTS` — they are being re-denominated as CAD, not converted from USD. That assumes the pricing page (which displays a bare `$99.00` with no currency label) always meant Canadian dollars and the `"usd"` in code was the mistake. If those numbers were genuinely intended as USD, then switching to CAD is a **~35% price cut** and you need new figures before creating anything.

Record the 12 IDs as you go — you'll paste them into three places (`.env.local`, staging GitHub secrets, production GitHub secrets). The six variable names, exactly:

| Variable                        | Price it holds                |
| ------------------------------- | ----------------------------- |
| `STRIPE_PRICE_BASIC_MONTHLY`    | Basic, CA$99.00/seat/mo       |
| `STRIPE_PRICE_BASIC_ANNUAL`     | Basic, CA$1,069.20/seat/yr    |
| `STRIPE_PRICE_STANDARD_MONTHLY` | Standard, CA$249.00/seat/mo   |
| `STRIPE_PRICE_STANDARD_ANNUAL`  | Standard, CA$2,689.20/seat/yr |
| `STRIPE_PRICE_PREMIUM_MONTHLY`  | Premium, CA$449.00/seat/mo    |
| `STRIPE_PRICE_PREMIUM_ANNUAL`   | Premium, CA$4,849.20/seat/yr  |

- [ ] Test mode ×6 → these names in `.env.local` and the GitHub `staging` environment
- [ ] Live mode ×6 → same names, GitHub `production` environment only

### 3.2 Resend — account, domain, API keys

- [ ] Create the Resend account (none exists today).
- [ ] Add `boximity.ca` and verify it — DKIM + SPF DNS records, added wherever `boximity.ca` DNS is hosted. **This is the long pole:** DNS propagation can take hours, and _nothing_ can be sent to a real inbox until it lands.
- [ ] Mint **separate API keys per environment** (`dev`, `staging`, `production`). One key everywhere means one leak revokes everything; separate keys mean you can rotate staging without touching prod.
- [ ] Sending domain: `noreply@boximity.ca` (`RESEND_FROM_EMAIL`). Destination: `hi@boximity.ca` (`WEBMASTER_EMAIL`) — the address the forms' own failure copy already points users at.

**Before the domain verifies,** Resend only delivers to the account owner's own address, and only from `onboarding@resend.dev`. That's enough to develop against — set `RESEND_FROM_EMAIL=onboarding@resend.dev` locally and swap it once DNS is green. Don't let it reach staging that way.

### 3.3 Stripe — register the webhook endpoints

| Environment | How                                                                          | Event                       | Secret lands in                |
| ----------- | ---------------------------------------------------------------------------- | --------------------------- | ------------------------------ |
| Local       | `stripe listen --forward-to localhost:3000/api/stripe/webhook`               | —                           | `.env.local`                   |
| Staging     | Dashboard (**test mode**) → `https://staging.boximity.ca/api/stripe/webhook` | `invoice.payment_succeeded` | GitHub `staging` env secret    |
| Production  | Dashboard (**live mode**) → `https://boximity.ca/api/stripe/webhook`         | `invoice.payment_succeeded` | GitHub `production` env secret |

`stripe listen` prints its own `whsec_…` on each run and it is **not** the dashboard's — don't cross-wire them.

### 3.4 Brevo — vacate list 10

Onboarding reuses list 10, the old waitlist list. **Export the existing waitlist contacts to CSV before anything ships** — the plan doesn't migrate them, and once onboarding starts writing to list 10 they're mixed in with new records with no attribute to tell them apart.

- [ ] Export list 10 → CSV, keep it somewhere durable.
- [ ] Confirm list 9 (contact-form leads) is the intended destination for the now-unbranched contact path.

---

## 4. Phase 1 — Remove the waitlist

**Delete**

- `src/app/components/WaitlistForm.tsx`
- `src/tests/WaitlistForm.test.tsx`

**`src/app/checkout/page.tsx`**

- Drop `joinWaitlist` from `formData` (`:36`) and the entire "Next Steps" radio group (`:628-672`).
- Delete the `{false && !formData.joinWaitlist && (...)}` gate (`:676`) — the Stripe form inside it becomes the unconditional payment path.
- Delete the `WaitlistForm` render block (`:743`).
- Delete the `document.querySelector("[data-waitlist-button]").click()` hack (`:183-188`). It fakes a click on a component that will no longer exist.
- Copy: `"Join Our Waitlist"` (`:356`) → checkout heading; `"By joining our waitlist, you agree…"` (`:818`) → purchase terms.
- Add the "Need invoicing or a custom plan? Contact us →" link below the card element.

**`src/app/checkout/metadata.ts`** — rewrite the description (`:6`), which currently sells the waitlist.

**`src/app/api/contact/route.ts`** — remove the `isWaitlist` param (`:34`), the `IS_WAITLIST` attribute (`:158`), and the list branch: `listIds: [isWaitlist ? 10 : 9]` → `listIds: [9]`.

**The Free plan dead-ends.** `priceOrder` rejects it (_"The selected plan does not require payment"_) and the waitlist was quietly absorbing those signups. Point the pricing page's Free CTA at `/onboarding` instead of `/checkout?plan=Free`, and have checkout redirect if it's handed a free plan.

**Existing waitlist contacts in Brevo list 10 are untouched** — migrate or export them by hand if you want them.

---

## 5. Phase 2 — Stripe Subscriptions

**`src/lib/pricing.ts`** — the amount math goes away; Stripe owns prices now. Keep the plan/cycle/seat-count _validation_ (5–20 seats) and keep display prices for the UI. Replace `PLAN_UNIT_PRICE_CENTS` with a plan+cycle → Stripe Price ID map, read from the six `STRIPE_PRICE_*` env vars named in §3.1 (`STRIPE_PRICE_BASIC_MONTHLY` through `STRIPE_PRICE_PREMIUM_ANNUAL`).

**Replace `create-payment-intent` with `src/app/api/stripe/create-subscription/route.ts`:**

```
validate order (plan, cycle, seats)
  → stripe.customers.create({ email, name, phone, address, metadata })
  → stripe.subscriptions.create({
      customer,
      items: [{ price: <mapped price id>, quantity: employeeCount }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    })
  → return latest_invoice.payment_intent.client_secret
```

The client confirms that client secret with the **same Stripe Elements card form it already has** — `StripeWrapper` / `StripePaymentForm` just point at the new route. That's what keeps this tractable: the UI barely changes, the server object graph does.

Use an **idempotency key** on the subscription create so a double-click can't mint two subscriptions.

Retire the old payment-intent route and its tests. Set `PAYMENT_CURRENCY = "cad"` (`pricing.ts:15`, currently `"usd"`) so it matches the currency of the Prices you created — a mismatch between the Price's currency and the Subscription's is a hard Stripe error, so this will fail loudly rather than quietly charge the wrong money.

---

## 6. Phase 3 — Resend + shared notification module

Add `resend` to `package.json` — **pinned to an exact version**, per the repo's no-ranges rule.

Two new modules, both shaped as deep modules that the three routes share (per `.cursor/rules/design-principles.mdc`; note the naming rules forbid `Helper`/`Utils` suffixes):

- **`src/lib/notify.ts`** → `sendWebmasterNotification({ formType, fields })`. Renders labeled key/value HTML + plaintext, returns a boolean, **never throws**. `formType` is `"Contact" | "Onboarding" | "Paid signup"`.
- **`src/lib/brevo.ts`** → `addBrevoContact({ listId, email, attributes })`. Lifts the Brevo call and the E.164 phone formatting out of the contact route so onboarding and the webhook can reuse them instead of copy-pasting.

Subject line: `New <form type> submission — <name>`. (The old PRD specified a generic _"New Form Submission on boximity.ca"_ with the type only in the body; a subject you can triage from the inbox list is strictly better, so this deviates deliberately.)

**`/api/contact`** — `Promise.allSettled([brevo, resend])` with the success matrix from §2. Preserve the existing special cases: Brevo `duplicate_parameter` still returns success, invalid-phone still returns 400.

**`/api/onboarding`** — currently validates and returns `{ success: true }` **without persisting anything anywhere**. Now: Brevo contact (list 10) + webmaster email, same `allSettled` semantics. Map its fields (`companyName` → `COMPANY`, `contactName` → `FULLNAME`, …) onto Brevo attributes.

New env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (`noreply@boximity.ca`), `WEBMASTER_EMAIL` (`hi@boximity.ca`). Both addresses stay env-configured rather than hardcoded, so a change of inbox doesn't need a redeploy of code.

---

## 7. Phase 4 — Stripe webhook

**`src/app/api/stripe/webhook/route.ts`** — net-new; there is no webhook infrastructure in the project today.

- `export const runtime = "nodejs"` — the Stripe SDK will not run on Edge.
- Read the **raw** body via `await request.text()`; signature verification fails against a re-serialized body.
- `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`.
- Handle `invoice.payment_succeeded`, gated on `billing_reason === "subscription_create"` — that fires on the first payment but _not_ on renewals, so you get one "new paid signup" email per customer rather than one every month.
- On a new subscription: Brevo contact (list 9, with plan / billing cycle / seat count attributes) + `sendWebmasterNotification({ formType: "Paid signup", … })`.

**Idempotency caveat, worth knowing up front:** Stripe retries webhooks, and **this project has no database**, so there's nowhere durable to record processed event IDs. The Brevo write is already idempotent (`updateEnabled: true`). The webmaster email is not — a Stripe retry could send a duplicate. Recommend accepting at-least-once delivery and living with a rare double email, rather than introducing a datastore purely for dedupe. Flagging it so it's a choice and not a surprise.

`STRIPE_WEBHOOK_SECRET` is a **runtime** secret — it goes in Ansible/compose/GitHub secrets, _not_ the Dockerfile (whose comments explicitly establish that secrets are never declared there).

---

## 8. Phase 5 — Spam hardening

Making a public unauthenticated endpoint email you directly turns it into a pipe to your inbox, and `/api/contact` has no protection today.

- **Honeypot:** a hidden `website` field on the contact and onboarding forms. If it's filled, return `200` and send nothing — bots get a success, you get silence.
- **Rate limit:** per-IP, 5 submissions / 10 min → `429`. No Redis or DB in this stack, so it's an in-memory `Map` in the route module. That means it resets on container restart and is per-container — acceptable on a single droplet, and worth remembering if you ever scale out. Read the client IP from `x-forwarded-for` (there's a reverse proxy in front).
- Applies to `/api/contact` and `/api/onboarding`. **Not** the webhook — that's already authenticated by Stripe's signature.

---

## 9. Phase 6 — Env, secrets, and deploy plumbing

New variables — **10 in total**, all of them server-side:

| Variable                        | Scope       | Notes                                                                      |
| ------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `RESEND_API_KEY`                | per-env     | Separate key per environment (§3.2); starts `re_`                          |
| `RESEND_FROM_EMAIL`             | per-env     | `noreply@boximity.ca`; `onboarding@resend.dev` locally pre-verification    |
| `WEBMASTER_EMAIL`               | shared      | `hi@boximity.ca`                                                           |
| `STRIPE_WEBHOOK_SECRET`         | **per-env** | Three different values (§3.3); starts `whsec_`                             |
| `STRIPE_PRICE_BASIC_MONTHLY`    | **per-env** | Test-mode ID for staging/local, live-mode for prod (§3.1); starts `price_` |
| `STRIPE_PRICE_BASIC_ANNUAL`     | **per-env** | ″                                                                          |
| `STRIPE_PRICE_STANDARD_MONTHLY` | **per-env** | ″                                                                          |
| `STRIPE_PRICE_STANDARD_ANNUAL`  | **per-env** | ″                                                                          |
| `STRIPE_PRICE_PREMIUM_MONTHLY`  | **per-env** | ″                                                                          |
| `STRIPE_PRICE_PREMIUM_ANNUAL`   | **per-env** | ″                                                                          |

**None of these are `NEXT_PUBLIC_*`** — they're read only on the server (route handlers). That has a consequence worth stating plainly: they are **runtime** config, not build-time. They never become Docker build args, they never enter the image, and **changing one requires only a redeploy, not a rebuild** — which keeps the build-once/promote-the-image model in `deploy.yml` intact. The Dockerfile stays untouched, consistent with its own comments about never declaring secrets there.

### 9.1 Local dev

The dev container bind-mounts the repo at `/app` (`docker-compose.dev.yml:12`), so Next.js reads `.env.local` straight from the working tree. **No `docker-compose.dev.yml` change is needed** — add the vars to `.env.local` and `just dev-restart`. The block, verbatim (test-mode values):

```bash
# Email redundancy (Resend)
RESEND_API_KEY=re_...                      # dev key from §3.2
RESEND_FROM_EMAIL=onboarding@resend.dev    # → noreply@boximity.ca once DNS verifies
WEBMASTER_EMAIL=hi@boximity.ca

# Stripe subscriptions (all test-mode)
STRIPE_WEBHOOK_SECRET=whsec_...            # printed by `stripe listen`, not the dashboard
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_STANDARD_MONTHLY=price_...
STRIPE_PRICE_STANDARD_ANNUAL=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_ANNUAL=price_...
```

- [ ] `.env.example` at the repo root is the committed reference for this block (added alongside this PRD; `.gitignore` now carves it out of the `.env*` rule). Keep it authoritative.
- [ ] Replace the inline `.env.local` heredoc in `scripts/setup-local-dev.sh` (`:227-247`) with `cp .env.example .env.local` — two templates of the same file will drift, and the heredoc already drifted once (`STRIPE_PUBLISHABLE_KEY`, below).
- [ ] Add them to the `just validate` guard in the `justfile` (`:77-84`) and to `scripts/validate-secrets.sh` / `scripts/check-secret-formats.sh` — format checks are cheap and catch paste errors: `RESEND_API_KEY` starts `re_`, `STRIPE_WEBHOOK_SECRET` starts `whsec_`, every `STRIPE_PRICE_*` starts `price_`.
- [ ] Document the `stripe listen` loop in `docs/local-development-setup.md` — it runs on the **host**, forwarding to the published port 3000, and must be running for any webhook work.
- [ ] Update `README.md` env table.

**Fix the latent bug first (it blocks Phase 2 entirely):** `getStripe()` reads `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, but `scripts/setup-local-dev.sh:240`, the README, `docs/local-development-setup.md`, and the `justfile` all write and validate `STRIPE_PUBLISHABLE_KEY` — no `NEXT_PUBLIC_` prefix, so the client never sees it. Ansible maps it correctly for deploys, so **only local dev is broken**, which is strong evidence the payment path has never once been exercised in dev. Phase 2 is undebuggable until this is fixed.

### 9.2 Staging / production — the six hops of a secret

There is no Ansible Vault in this path and no secrets file on the droplet. Every app secret rides from a **GitHub Environment secret** into a generated **Ansible inventory** and out into the container's `environment:` block. Adding one variable means touching all six hops; miss any one and it arrives as an **empty string, silently** (every hop uses `default('')` / `${VAR:-}`), which for `STRIPE_WEBHOOK_SECRET` means every webhook 400s and the "new paid signup" email simply never arrives.

#### GitHub secrets to create (hop 1, the checklist)

**On naming:** the deploy job runs under `environment: ${{ needs.detect-environment.outputs.environment }}` (`deploy.yml:422`), so a secret stored in the `staging` environment and one stored in the `production` environment are **already separate secrets even under the same name** — GitHub resolves whichever environment the job runs in. That's how `BREVO_API_KEY` and `STRIPE_SECRET_KEY` work today, and the new secrets follow it. The repo does carry an older pattern — suffixed names like `SENTRY_DSN_STAGING` / `SENTRY_DSN_PRODUCTION`, selected by an inline conditional in `deploy.yml:382` — but that predates the environment scoping and shouldn't be extended. **Do not create suffixed variants of the names below.** Creating `STRIPE_WEBHOOK_SECRET_STAGING` at the repo level would be invisible to hop 3, which reads `secrets.STRIPE_WEBHOOK_SECRET`.

Create under **Settings → Environments → `staging` → Environment secrets**, then repeat under **`production`** with the production values:

| Secret name                     | `staging` value                                            | `production` value                                  |
| ------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `RESEND_API_KEY`                | Resend key labeled _staging_ (§3.2)                        | Resend key labeled _production_ — a different key   |
| `RESEND_FROM_EMAIL`             | `noreply@boximity.ca`                                      | `noreply@boximity.ca`                               |
| `WEBMASTER_EMAIL`               | `hi@boximity.ca`                                           | `hi@boximity.ca`                                    |
| `STRIPE_WEBHOOK_SECRET`         | `whsec_…` from the **test-mode** dashboard endpoint (§3.3) | `whsec_…` from the **live-mode** dashboard endpoint |
| `STRIPE_PRICE_BASIC_MONTHLY`    | test-mode `price_…`                                        | live-mode `price_…`                                 |
| `STRIPE_PRICE_BASIC_ANNUAL`     | test-mode `price_…`                                        | live-mode `price_…`                                 |
| `STRIPE_PRICE_STANDARD_MONTHLY` | test-mode `price_…`                                        | live-mode `price_…`                                 |
| `STRIPE_PRICE_STANDARD_ANNUAL`  | test-mode `price_…`                                        | live-mode `price_…`                                 |
| `STRIPE_PRICE_PREMIUM_MONTHLY`  | test-mode `price_…`                                        | live-mode `price_…`                                 |
| `STRIPE_PRICE_PREMIUM_ANNUAL`   | test-mode `price_…`                                        | live-mode `price_…`                                 |

`RESEND_FROM_EMAIL` and `WEBMASTER_EMAIL` happen to hold the same value in both environments, but they still live in both — there is no repo-level fallback in this pipeline, and keeping them env-scoped means staging can later point at a test inbox without touching prod.

While you're in there, also verify the two pre-existing Stripe secrets both environments already require: `STRIPE_SECRET_KEY` (`sk_test_…` in staging, `sk_live_…` in production) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…` / `pk_live_…`) — see the two verification items at the end of this section.

| #   | File                                                                      | What to add                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GitHub → Settings → Environments → `staging` **and** `production`         | The 10 secrets themselves, under the exact names from the table above. Different values per environment.                                                                                           |
| 2   | `.github/workflows/environments/{staging,production}.yml`                 | The 10 names in the `secrets:` list (the manifest of what the env expects).                                                                                                                        |
| 3   | `.github/workflows/deploy.yml` (`:464-470`)                               | The `env:` mappings in the deploy job — this is what exposes them to the composite action.                                                                                                         |
| 4   | `.github/actions/deploy/action.yml`                                       | **Two edits:** the required-var guard (`:45-53`) so a missing secret fails loudly instead of deploying an empty string; and the `inventory/deploy.ini` heredoc (`:165-171`) so they reach Ansible. |
| 5   | `ansible/staging-deploy.yml` + `ansible/production-deploy.yml` (`:29-31`) | Lowercase `vars:` mappings from the inventory names.                                                                                                                                               |
| 6   | `ansible/templates/docker-compose.yml.j2`                                 | The vars in the `web` service's `environment:` list. **Not** the `build.args` block — these aren't build-time.                                                                                     |

The exact lines per hop (following the repo's existing casing: UPPERCASE through GitHub and the inventory, lowercase inside Ansible/Jinja):

**Hop 3 — `deploy.yml` `env:` block:**

```yaml
RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
WEBMASTER_EMAIL: ${{ secrets.WEBMASTER_EMAIL }}
STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
STRIPE_PRICE_BASIC_MONTHLY: ${{ secrets.STRIPE_PRICE_BASIC_MONTHLY }}
STRIPE_PRICE_BASIC_ANNUAL: ${{ secrets.STRIPE_PRICE_BASIC_ANNUAL }}
STRIPE_PRICE_STANDARD_MONTHLY: ${{ secrets.STRIPE_PRICE_STANDARD_MONTHLY }}
STRIPE_PRICE_STANDARD_ANNUAL: ${{ secrets.STRIPE_PRICE_STANDARD_ANNUAL }}
STRIPE_PRICE_PREMIUM_MONTHLY: ${{ secrets.STRIPE_PRICE_PREMIUM_MONTHLY }}
STRIPE_PRICE_PREMIUM_ANNUAL: ${{ secrets.STRIPE_PRICE_PREMIUM_ANNUAL }}
```

**Hop 4 — `action.yml` inventory heredoc** (guard checks take the same names; `${VAR:-}` form matches the existing `BREVO_API_KEY` line):

```
RESEND_API_KEY=${RESEND_API_KEY:-}
RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL:-}
WEBMASTER_EMAIL=${WEBMASTER_EMAIL:-}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-}
STRIPE_PRICE_BASIC_MONTHLY=${STRIPE_PRICE_BASIC_MONTHLY:-}
STRIPE_PRICE_BASIC_ANNUAL=${STRIPE_PRICE_BASIC_ANNUAL:-}
STRIPE_PRICE_STANDARD_MONTHLY=${STRIPE_PRICE_STANDARD_MONTHLY:-}
STRIPE_PRICE_STANDARD_ANNUAL=${STRIPE_PRICE_STANDARD_ANNUAL:-}
STRIPE_PRICE_PREMIUM_MONTHLY=${STRIPE_PRICE_PREMIUM_MONTHLY:-}
STRIPE_PRICE_PREMIUM_ANNUAL=${STRIPE_PRICE_PREMIUM_ANNUAL:-}
```

**Hop 5 — both playbooks' `vars:` blocks:**

```yaml
resend_api_key: "{{ RESEND_API_KEY | default('') }}"
resend_from_email: "{{ RESEND_FROM_EMAIL | default('') }}"
webmaster_email: "{{ WEBMASTER_EMAIL | default('') }}"
stripe_webhook_secret: "{{ STRIPE_WEBHOOK_SECRET | default('') }}"
stripe_price_basic_monthly: "{{ STRIPE_PRICE_BASIC_MONTHLY | default('') }}"
stripe_price_basic_annual: "{{ STRIPE_PRICE_BASIC_ANNUAL | default('') }}"
stripe_price_standard_monthly: "{{ STRIPE_PRICE_STANDARD_MONTHLY | default('') }}"
stripe_price_standard_annual: "{{ STRIPE_PRICE_STANDARD_ANNUAL | default('') }}"
stripe_price_premium_monthly: "{{ STRIPE_PRICE_PREMIUM_MONTHLY | default('') }}"
stripe_price_premium_annual: "{{ STRIPE_PRICE_PREMIUM_ANNUAL | default('') }}"
```

**Hop 6 — `docker-compose.yml.j2` `environment:` list:**

```yaml
- RESEND_API_KEY={{ resend_api_key }}
- RESEND_FROM_EMAIL={{ resend_from_email }}
- WEBMASTER_EMAIL={{ webmaster_email }}
- STRIPE_WEBHOOK_SECRET={{ stripe_webhook_secret }}
- STRIPE_PRICE_BASIC_MONTHLY={{ stripe_price_basic_monthly }}
- STRIPE_PRICE_BASIC_ANNUAL={{ stripe_price_basic_annual }}
- STRIPE_PRICE_STANDARD_MONTHLY={{ stripe_price_standard_monthly }}
- STRIPE_PRICE_STANDARD_ANNUAL={{ stripe_price_standard_annual }}
- STRIPE_PRICE_PREMIUM_MONTHLY={{ stripe_price_premium_monthly }}
- STRIPE_PRICE_PREMIUM_ANNUAL={{ stripe_price_premium_annual }}
```

Then: `docs/secrets-rotation-guide.md` (rotation procedure for the new keys) and `scripts/validate-environment.sh`.

**Two things to verify while you're in here** (both pre-existing, both bite Phase 2):

1. `deploy.yml:377,466` reads `secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, but `environments/staging.yml` declares that name under **`variables:`**, not `secrets:`. If it isn't _also_ set as a real environment secret, the publishable key reaches the Docker build empty and the card element never mounts. Confirm before Phase 2 goes to staging.
2. `environments/production.yml` has a **placeholder** live publishable key (`pk_live_…XXXXXXXX`). It must be replaced with the real one before production takes a card.

**A note on how these secrets travel:** hop 4 writes them as plaintext inventory vars into `inventory/deploy.ini` on the runner. That's exactly how `BREVO_API_KEY` and `STRIPE_SECRET_KEY` already travel, so this adds no new exposure class — but it does mean `STRIPE_WEBHOOK_SECRET` and the live Resend key inherit that posture, and the runner's `Cleanup sensitive files` step (`action.yml:213`) removes the SSH key and vault password but **not** `deploy.ini`. Worth adding it there while you're editing the file.

---

## 10. Testing

- **Unit:** `notify.ts` (Resend mocked), `brevo.ts`, the contact route across the full ok/fail matrix (Brevo × Resend), the onboarding route, webhook signature verification and the `billing_reason` gate, honeypot, rate limiter.
- **Delete** the waitlist tests; update `checkout-page.test.tsx`, `checkout-page-stripe.test.tsx`, `api-contact.test.ts`, `stripe.lib.test.ts`.
- Jest coverage thresholds (65% branches/functions, 70% lines/statements) must still pass.
- **E2E:** full checkout against Stripe test card `4242 4242 4242 4242`; assert the waitlist is gone.
- **Webhook:** `stripe trigger invoice.payment_succeeded` via the Stripe CLI.

---

## 11. Sequencing and the go-live gate

**Start the Resend DNS verification (§3.2) today, before writing any code.** It's the only step with a wall-clock delay you can't compress, and every email test is blocked behind it. Everything else in §3 is a matter of minutes.

Phases 3–5 (email redundancy, webhook, spam) are independent of 1–2 (checkout) and can land first — they carry no risk of taking money.

**Phases 1 and 2 must ship together.** Phase 1 alone exposes a live card form wired to a one-time charge, which is precisely the bug this plan exists to avoid.

Order of operations across environments:

1. **Local** — test-mode Prices, `stripe listen`, Resend dev key. Fix the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` bug (§9.1) _first_ or none of this is debuggable.
2. **Staging** — test-mode Price IDs, test-mode webhook endpoint + its own `whsec_`, staging Resend key. Full E2E on `4242 4242 4242 4242`. Confirm one webmaster email per signup, not one per retry.
3. **Production** — live-mode Price IDs (a _different_ six), live-mode webhook endpoint + its own `whsec_`, prod Resend key, real `pk_live_` publishable key.

Live keys are the last switch flipped, and flipping them is the moment the site starts taking real money. The most likely way this breaks in production while looking fine in staging is a **test-mode Price ID copied into the production environment** — check those six values against the live-mode dashboard specifically.

---

## 12. Out of scope (but you should know)

- **Sales tax.** Now that billing is explicitly CAD to Canadian customers, GST/HST is unambiguously in play (13% in Ontario). Stripe Tax can handle it, but nothing in this plan does, and the Prices above are tax-exclusive. This is a compliance question, not a technical footnote — worth answering before you charge anyone.
- **Subscription management for customers** (upgrade, downgrade, cancel, change seat count). Stripe's billing portal is the cheap answer when you want it.
- **Dunning / failed renewal payments.** Stripe retries on its own; nobody is currently notified when a renewal fails.
- Auto-reply / thank-you emails to the person who submitted a form.
- Migrating the existing Brevo list-10 waitlist contacts.
