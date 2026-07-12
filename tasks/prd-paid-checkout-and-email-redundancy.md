# PRD: Paid Checkout (Subscriptions) + Email Redundancy

**Status:** Implemented locally (2026-07-12) — all phases coded, tested, and smoke-tested against Stripe test mode. The items below are the remaining manual steps.
**Created:** 2026-07-11
**Supersedes:** `tasks/prd-resend-email-service.md` (written 2025-02-19, assumes the waitlist survives — delete it when this lands)

---

## 0. Outstanding manual steps (on you, not the code)

Everything below is admin/dashboard work the implementation can't do for you.
Items 1–2 are **go-live gates**; 3 must happen **before this deploys to staging**.

1. **Stripe live-mode catalog.** The CLI's `rk_live_…` restricted key lacks
   Products write permission, so the live half of §3.1 is not done. Grant the
   key write access to Products in the Dashboard (or mint a fuller key), then
   re-run the §3.1 CLI block with `--live`. Verify with
   `stripe prices list --lookup-keys=basic_monthly --live` → exactly one
   active Price. Nothing in deploy fails if this is skipped — the first real
   customer's checkout does.
2. **Webhook endpoints (Workbench → Webhooks, once per mode), per §3.3:**
   - Test mode → `https://staging.boximity.ca/api/stripe/webhook`
   - Live mode → `https://boximity.ca/api/stripe/webhook`
   - Events: `invoice.payment_succeeded` (+ optionally
     `invoice.payment_failed`, `customer.subscription.deleted` — the handler
     already 200s and logs them). Reveal each endpoint's `whsec_…` and store
     it as that environment's `STRIPE_WEBHOOK_SECRET` in step 4.
3. **Export Brevo list 10 to CSV** (§3.4). Onboarding starts writing to
   list 10 the moment this deploys; the old waitlist contacts are
   indistinguishable after that.
4. **GitHub environment secrets** — 4 names × `staging` and `production`
   environments (never repo-level, never suffixed; §9.2):
   | Name | staging | production |
   | ---- | ------- | ---------- |
   | `RESEND_API_KEY` | staged in `.env.local` (bottom block) | staged in `.env.local` (bottom block) |
   | `RESEND_FROM_EMAIL` | `noreply@boximity.ca` | `noreply@boximity.ca` |
   | `WEBMASTER_EMAIL` | `hi@boximity.ca` | `hi@boximity.ca` |
   | `STRIPE_WEBHOOK_SECRET` | test-mode endpoint's `whsec_…` (step 2) | live-mode endpoint's `whsec_…` (step 2) |

   The two Resend keys (`dotca-staging`, `dotca-production`, sending-only,
   domain-scoped) are already minted and sit commented-out at the bottom of
   `.env.local` — copy them into GitHub, then **delete that block**.

5. **Pre-existing publishable-key traps (§9.2, both bite Phase 2):**
   - `deploy.yml` reads `secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, but
     `environments/staging.yml` declares it under `variables:`. Confirm it
     also exists as a real **environment secret** in staging.
   - `environments/production.yml` carries a **placeholder**
     `pk_live_…XXXX`; replace with the real live publishable key before
     production takes a card.
   - Confirm `STRIPE_SECRET_KEY` is `sk_test_…` in staging and `sk_live_…`
     in production — with lookup keys, that one variable alone decides which
     mode's Prices get charged.
6. **Staging E2E before go-live:** full checkout on
   `4242 4242 4242 4242`, confirm exactly one webmaster email per signup.
   Locally, the same test needs `stripe listen --forward-to
localhost:3000/api/stripe/webhook` running on the host.

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

| Question                    | Decision                                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Billing model               | **Stripe Subscriptions** — Customer + recurring Price + Subscription. Real rebilling.                                                                                                                            |
| Currency                    | **CAD.** `pricing.ts` currently says `usd`, which is wrong for an Ontario MSP. Locked in before any Stripe Price is created, because a Price's currency is immutable.                                            |
| Price references            | **`lookup_key`, not Price IDs.** Lookup keys are identical across test and live mode, so no `price_…` value ever enters env, secrets, or code — and a test-mode Price can't be pasted into production. See §3.1. |
| Price `tax_behavior`        | **`exclusive`**, set at creation. Immutable afterward; getting it wrong means recreating all 12 Prices once Stripe Tax is enabled (§12).                                                                         |
| `/checkout` "Next Steps" UI | Stripe card element only. No radio group. Secondary "Need invoicing or a custom plan? Contact us →" link.                                                                                                        |
| Brevo waitlist list 10      | Dropped from the contact path. `isWaitlist` param and `IS_WAITLIST` attribute deleted; all contact-form leads → list 9.                                                                                          |
| Resend vs Brevo             | Both fire in parallel, **both awaited**. Submission succeeds if **either** lands.                                                                                                                                |
| Onboarding                  | Now writes a Brevo contact (**reusing list 10**, the vacated waitlist list) _and_ emails the webmaster. Today it persists nothing at all.                                                                        |
| Paid signup notification    | Yes — via a **new Stripe webhook route**, so it fires even if the customer closes the tab.                                                                                                                       |
| Spam                        | Honeypot field + per-IP rate limit on the public form routes.                                                                                                                                                    |
| Resend account              | **Does not exist yet.** Account creation + domain verification is a blocking prerequisite.                                                                                                                       |
| Webmaster inbox             | `hi@boximity.ca` — the address the forms' own failure copy already points users at.                                                                                                                              |

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

Everything you create in Stripe exists in exactly one mode. A `price_…` created in test mode does not exist in live mode, and the webhook secret for staging is not the one for production. So:

- The 6 Prices in §3.1 are created **twice** — once in test mode (→ staging + local dev), once in live mode (→ production).
- The webhook is registered **three times** — Stripe CLI (local), test-mode endpoint (staging), live-mode endpoint (production) — yielding **three different `whsec_…` values**. `STRIPE_WEBHOOK_SECRET` is therefore environment-scoped, never shared.

**Price IDs are the exception, and we exploit it.** Rather than carrying twelve `price_…` IDs through env vars — six per mode, with a live deploy silently exploding on _"No such price"_ the moment someone pastes a test ID into production — every Price gets a **`lookup_key`**: a stable handle we choose, which is **allowed to be identical in both modes**. The code resolves plan+cycle → Price at runtime by lookup key, and because the Stripe client is already keyed to test or live by `STRIPE_SECRET_KEY`, it automatically gets the right-mode Price. **No Price IDs in env, in secrets, or in code.** The whole class of test/live price mixups becomes unrepresentable.

### 3.1 Stripe — create the recurring Prices (do this in BOTH test and live mode)

**Where:** Dashboard → **More** → **Product catalog** → **+ Add product**. _Not_ the Subscriptions section — that only lists subscriptions that already exist against real customers; it's a monitoring view, and you'll never touch it during setup.

The model: a **Product** is _what you sell_ ("Boximity Basic"); a **Price** is _the terms you sell it on_ (CA$99, monthly, recurring). One Product holds many Prices. So the shape is **3 Products × 2 Prices = 6 Prices per mode** (12 total), not 6 Products:

| Product           | Monthly Price (per seat)       | Annual Price (per seat)         |
| ----------------- | ------------------------------ | ------------------------------- |
| Boximity Basic    | CA$99.00 → `basic_monthly`     | CA$1,069.20 → `basic_annual`    |
| Boximity Standard | CA$249.00 → `standard_monthly` | CA$2,689.20 → `standard_annual` |
| Boximity Premium  | CA$449.00 → `premium_monthly`  | CA$4,849.20 → `premium_annual`  |

The `snake_case` values are the **lookup keys** — create them identically in test and live mode. Product names are customer-visible on invoices and receipts.

**Per-seat is not a setting.** There is no toggle to find. A Price of CA$99/month becomes per-seat purely because the _subscription item_ carries `quantity: employeeCount` and Stripe multiplies. Create each Price as a plain **Flat rate** recurring price; §5 supplies the quantity.

#### Two fields are permanent — get them right the first time

After creation, **only `metadata`, `nickname`, and `active` can be changed.** Currency, amount, and interval are frozen; "fixing" one means creating a replacement Price and setting the old one `active=false`.

1. **Currency → CAD.** It defaults to your account's default. Immutable afterward.
2. **`tax_behavior` → `exclusive`** (the "Include tax in price" checkbox — leave it _unchecked_). This is the one the original plan missed. It is immutable once set to `inclusive` or `exclusive`, and §12 flags GST/HST as an open question — if you leave it `unspecified` now, the day you enable Stripe Tax you get to recreate all twelve Prices. `exclusive` (tax added on top of CA$99) is correct for a B2B MSP quoting pre-tax, and costs nothing to set today.

#### Do it with the CLI, not by clicking

You have to do this twice, identically. Hand-clicking twelve Prices is how the two modes drift apart. The CLI defaults to test mode; add `--live` for production.

```bash
# TEST MODE. Re-run the whole block with `stripe --live ...` for production.
BASIC=$(stripe products create --name="Boximity Basic" --format=json | jq -r .id)
STANDARD=$(stripe products create --name="Boximity Standard" --format=json | jq -r .id)
PREMIUM=$(stripe products create --name="Boximity Premium" --format=json | jq -r .id)

stripe prices create --product=$BASIC --currency=cad --unit-amount=9900 \
  -d "recurring[interval]=month" --tax-behavior=exclusive \
  --lookup-key=basic_monthly --nickname="Basic / seat / month"
stripe prices create --product=$BASIC --currency=cad --unit-amount=106920 \
  -d "recurring[interval]=year" --tax-behavior=exclusive \
  --lookup-key=basic_annual --nickname="Basic / seat / year (10% off)"

stripe prices create --product=$STANDARD --currency=cad --unit-amount=24900 \
  -d "recurring[interval]=month" --tax-behavior=exclusive \
  --lookup-key=standard_monthly --nickname="Standard / seat / month"
stripe prices create --product=$STANDARD --currency=cad --unit-amount=268920 \
  -d "recurring[interval]=year" --tax-behavior=exclusive \
  --lookup-key=standard_annual --nickname="Standard / seat / year (10% off)"

stripe prices create --product=$PREMIUM --currency=cad --unit-amount=44900 \
  -d "recurring[interval]=month" --tax-behavior=exclusive \
  --lookup-key=premium_monthly --nickname="Premium / seat / month"
stripe prices create --product=$PREMIUM --currency=cad --unit-amount=484920 \
  -d "recurring[interval]=year" --tax-behavior=exclusive \
  --lookup-key=premium_annual --nickname="Premium / seat / year (10% off)"
```

Amounts are in cents. Annuals bake in the existing 10% discount (`unit × 12 × 0.9`, from `ANNUAL_DISCOUNT_MULTIPLIER`). Once Stripe owns the prices, that multiplier leaves the codebase — otherwise the discount lives in two places and they will drift.

**Note the assumption:** these figures are _unchanged_ from `PLAN_UNIT_PRICE_CENTS` — they are being re-denominated as CAD, not converted from USD. That assumes the pricing page (which displays a bare `$99.00` with no currency label) always meant Canadian dollars and the `"usd"` in code was the mistake. If those numbers were genuinely intended as USD, then switching to CAD is a **~35% price cut** and you need new figures before creating anything.

**Nothing to record.** No IDs to copy, no secrets to paste — that's the point of the lookup keys.

- [x] Test mode: 3 Products + 6 Prices, CAD, `tax_behavior=exclusive`, lookup keys as above _(done 2026-07-12 via CLI)_
- [ ] Live mode: same again, `stripe --live` — **BLOCKED:** the CLI's `rk_live_…` restricted key lacks Products write permission. Grant it write on Products in the Dashboard (or mint a fuller key), then re-run the block above with `--live`.
- [ ] Sanity check both: `stripe prices list --lookup-keys=basic_monthly` and `stripe --live prices list --lookup-keys=basic_monthly` each return exactly one active Price _(test mode passes; live pending)_

**Raising prices later:** create the new Price with `transfer_lookup_key=true` and it takes the handle over from the old one. Price change, no code deploy, no secret rotation.

### 3.2 Resend — account, domain, API keys

- [x] Create the Resend account (none exists today). _(done)_
- [x] Add `boximity.ca` and verify it — DKIM + SPF DNS records, added wherever `boximity.ca` DNS is hosted. _(verified 2026-07-12, sending enabled)_
- [ ] Mint **separate API keys per environment** (`dev`, `staging`, `production`). One key everywhere means one leak revokes everything; separate keys mean you can rotate staging without touching prod. _(`dotca-dev` minted 2026-07-12, sending-only, domain-scoped, in `.env.local`; smoke-tested. Staging/production keys deliberately deferred to GitHub-secrets time so the one-time-visible values go straight to their destination.)_
- [x] Sending domain: `noreply@boximity.ca` (`RESEND_FROM_EMAIL`). Destination: `hi@boximity.ca` (`WEBMASTER_EMAIL`) — the address the forms' own failure copy already points users at.

**Before the domain verifies,** Resend only delivers to the account owner's own address, and only from `onboarding@resend.dev`. That's enough to develop against — set `RESEND_FROM_EMAIL=onboarding@resend.dev` locally and swap it once DNS is green. Don't let it reach staging that way.

### 3.3 Stripe — register the webhook endpoints

**Where:** Dashboard → **Workbench** → **Webhooks** → **Create an event destination**. (Workbench replaced the old Developers dashboard; the direct link is `dashboard.stripe.com/webhooks`.) Scope = _Your account_; destination type = _Webhook endpoint_. Register it **once per mode** — a test-mode endpoint is invisible to live mode and vice versa.

| Environment | How                                                                          | Secret lands in                |
| ----------- | ---------------------------------------------------------------------------- | ------------------------------ |
| Local       | `stripe listen --forward-to localhost:3000/api/stripe/webhook`               | `.env.local`                   |
| Staging     | Workbench (**test mode**) → `https://staging.boximity.ca/api/stripe/webhook` | GitHub `staging` env secret    |
| Production  | Workbench (**live mode**) → `https://boximity.ca/api/stripe/webhook`         | GitHub `production` env secret |

`stripe listen` stands up its own ephemeral endpoint and prints its own `whsec_…`. It is **not** the same value as either dashboard endpoint's — don't cross-wire them. Reveal a dashboard endpoint's secret by clicking into it in Workbench → _Click to reveal_.

#### Events to enable

**Exactly one event is load-bearing:**

| Event                       | Why                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `invoice.payment_succeeded` | The only event the handler acts on. Gated on `billing_reason === "subscription_create"` so it fires on the **first** payment and not on renewals (`subscription_cycle`). |

**Do not enable `invoice.paid` as well.** It fires alongside `invoice.payment_succeeded` for the same card payment, so enabling both means **two webmaster emails per signup** unless the handler switches on `event.type`. Pick one; `invoice.payment_succeeded` is the one this plan is written against.

**Do not notify on `customer.subscription.created`.** Because §5 uses `payment_behavior: "default_incomplete"`, that event fires _before the customer has paid_, with `status: incomplete` — a card that then gets declined would still have emailed you a "new paid signup." The whole reason to hang the notification off the invoice is that the invoice is the thing that proves money moved.

**Worth enabling now, even if only logged/Sentry'd:**

| Event                           | Why                                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `invoice.payment_failed`        | §12 notes nobody is currently told when a renewal fails. Logging it costs nothing and closes the biggest hole in that list. |
| `customer.subscription.deleted` | Cancellations. Same reasoning — silence today.                                                                              |

If you enable these, **the route must return `200` for event types it does not handle.** A non-2xx makes Stripe retry and eventually mark the endpoint as failing.

#### A trap when you test it

§10 says to fire `stripe trigger invoice.payment_succeeded`. That trigger fabricates a **one-off invoice**, whose `billing_reason` is `manual` — so the `subscription_create` gate correctly rejects it and the handler no-ops. **This looks exactly like a broken webhook.** Log `billing_reason` on every received event so you can see the gate doing its job. To exercise the real path, run the actual checkout flow in test mode against `4242 4242 4242 4242` with `stripe listen` running — that produces a genuine `subscription_create` invoice.

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

**`src/lib/pricing.ts`** — the amount math goes away; Stripe owns prices now. Keep the plan/cycle/seat-count _validation_ (5–20 seats) and keep display prices for the UI. Replace `PLAN_UNIT_PRICE_CENTS` with a plan+cycle → **lookup key** map — a pure, hardcoded, non-secret constant, since the keys are identical in test and live mode (§3.1):

```ts
const PLAN_CYCLE_LOOKUP_KEY = {
  basic: { monthly: "basic_monthly", annual: "basic_annual" },
  standard: { monthly: "standard_monthly", annual: "standard_annual" },
  premium: { monthly: "premium_monthly", annual: "premium_annual" },
} as const;
```

**`src/lib/stripe.ts`** — add `resolvePriceId({ plan, cycle })`: map to the lookup key, then `stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 })` and return the one Price's `id`. Throw a loud, named error if it returns zero rows — that means the Prices were never created in whichever mode the current `STRIPE_SECRET_KEY` points at, and it should fail at checkout with a clear message rather than a Stripe-internal one. **Memoize the result in module scope**; Prices effectively never change, so this is one extra Stripe call per cold container, not per checkout.

**Replace `create-payment-intent` with `src/app/api/stripe/create-subscription/route.ts`:**

```
validate order (plan, cycle, seats)
  → resolvePriceId({ plan, cycle })            // lookup key → price_… , mode-correct by construction
  → stripe.customers.create({ email, name, phone, address, metadata })
  → stripe.subscriptions.create({
      customer,
      items: [{ price: <resolved price id>, quantity: employeeCount }],
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
- Handle `invoice.payment_succeeded`, gated on `billing_reason === "subscription_create"` — that fires on the first payment but _not_ on renewals (`subscription_cycle`), so you get one "new paid signup" email per customer rather than one every month.
- **Return `200` for every event type you don't handle** (`invoice.payment_failed`, `customer.subscription.deleted`, anything enabled later). A non-2xx makes Stripe retry and eventually disable the endpoint.
- **Log `billing_reason` on every event received**, handled or not. Without it, a gate that is correctly rejecting a `manual` invoice is indistinguishable from a broken webhook — see the testing trap in §3.3.
- Do **not** act on `customer.subscription.created`: with `payment_behavior: "default_incomplete"` it fires before payment, `status: incomplete`. A declined card would still have emailed you a "new paid signup."
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

New variables — **4 in total**, all of them server-side:

| Variable                | Scope       | Notes                                                                   |
| ----------------------- | ----------- | ----------------------------------------------------------------------- |
| `RESEND_API_KEY`        | per-env     | Separate key per environment (§3.2); starts `re_`                       |
| `RESEND_FROM_EMAIL`     | per-env     | `noreply@boximity.ca`; `onboarding@resend.dev` locally pre-verification |
| `WEBMASTER_EMAIL`       | shared      | `hi@boximity.ca`                                                        |
| `STRIPE_WEBHOOK_SECRET` | **per-env** | Three different values (§3.3); starts `whsec_`                          |

**There are no `STRIPE_PRICE_*` variables.** An earlier draft of this plan carried six of them (twelve GitHub secrets across two environments, plus six `.env.local` lines). The lookup-key decision in §3.1 deletes all of it: plan+cycle → lookup key is a hardcoded non-secret constant in `pricing.ts`, and the Price ID is resolved at runtime against whichever mode `STRIPE_SECRET_KEY` points at. Beyond the reduced surface, this **eliminates the single most likely production failure** in the original plan — a test-mode Price ID pasted into the production environment, discovered by the first real customer.

**None of these are `NEXT_PUBLIC_*`** — they're read only on the server (route handlers). That has a consequence worth stating plainly: they are **runtime** config, not build-time. They never become Docker build args, they never enter the image, and **changing one requires only a redeploy, not a rebuild** — which keeps the build-once/promote-the-image model in `deploy.yml` intact. The Dockerfile stays untouched, consistent with its own comments about never declaring secrets there.

### 9.1 Local dev

The dev container bind-mounts the repo at `/app` (`docker-compose.dev.yml:12`), so Next.js reads `.env.local` straight from the working tree. **No `docker-compose.dev.yml` change is needed** — add the vars to `.env.local` and `just dev-restart`. The block, verbatim:

```bash
# Email redundancy (Resend)
RESEND_API_KEY=re_...                      # dev key from §3.2
RESEND_FROM_EMAIL=onboarding@resend.dev    # → noreply@boximity.ca once DNS verifies
WEBMASTER_EMAIL=hi@boximity.ca

# Stripe webhook (test mode)
STRIPE_WEBHOOK_SECRET=whsec_...            # printed by `stripe listen`, not the dashboard
```

That's the whole diff. Price IDs are resolved by lookup key at runtime (§3.1), so `STRIPE_SECRET_KEY` being an `sk_test_…` is the _only_ thing that makes local dev use test-mode prices — there is no second place to get the mode wrong.

- [x] `.env.example` at the repo root is the committed reference for this block (added alongside this PRD; `.gitignore` now carves it out of the `.env*` rule). Keep it authoritative.
- [x] Replace the inline `.env.local` heredoc in `scripts/setup-local-dev.sh` (`:227-247`) with `cp .env.example .env.local` — two templates of the same file will drift, and the heredoc already drifted once (`STRIPE_PUBLISHABLE_KEY`, below).
- [x] Add the 4 vars to the `just validate` guard in the `justfile` (`:77-84`) and to `scripts/validate-secrets.sh` / `scripts/check-secret-formats.sh` — format checks are cheap and catch paste errors: `RESEND_API_KEY` starts `re_`, `STRIPE_WEBHOOK_SECRET` starts `whsec_`.
- [x] Document the `stripe listen` loop in `docs/local-development-setup.md` — it runs on the **host**, forwarding to the published port 3000, and must be running for any webhook work.
- [x] Update `README.md` env table.

**Fix the latent bug first (it blocks Phase 2 entirely):** `getStripe()` reads `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, but `scripts/setup-local-dev.sh:240`, the README, `docs/local-development-setup.md`, and the `justfile` all write and validate `STRIPE_PUBLISHABLE_KEY` — no `NEXT_PUBLIC_` prefix, so the client never sees it. Ansible maps it correctly for deploys, so **only local dev is broken**, which is strong evidence the payment path has never once been exercised in dev. Phase 2 is undebuggable until this is fixed.

### 9.2 Staging / production — the six hops of a secret

There is no Ansible Vault in this path and no secrets file on the droplet. Every app secret rides from a **GitHub Environment secret** into a generated **Ansible inventory** and out into the container's `environment:` block. Adding one variable means touching all six hops; miss any one and it arrives as an **empty string, silently** (every hop uses `default('')` / `${VAR:-}`), which for `STRIPE_WEBHOOK_SECRET` means every webhook 400s and the "new paid signup" email simply never arrives.

#### GitHub secrets to create (hop 1, the checklist)

**On naming:** the deploy job runs under `environment: ${{ needs.detect-environment.outputs.environment }}` (`deploy.yml:422`), so a secret stored in the `staging` environment and one stored in the `production` environment are **already separate secrets even under the same name** — GitHub resolves whichever environment the job runs in. That's how `BREVO_API_KEY` and `STRIPE_SECRET_KEY` work today, and the new secrets follow it. The repo does carry an older pattern — suffixed names like `SENTRY_DSN_STAGING` / `SENTRY_DSN_PRODUCTION`, selected by an inline conditional in `deploy.yml:382` — but that predates the environment scoping and shouldn't be extended. **Do not create suffixed variants of the names below.** Creating `STRIPE_WEBHOOK_SECRET_STAGING` at the repo level would be invisible to hop 3, which reads `secrets.STRIPE_WEBHOOK_SECRET`.

Create under **Settings → Environments → `staging` → Environment secrets**, then repeat under **`production`** with the production values:

**Four secrets, created twice** — once in each environment:

| Secret name             | `staging` value                                            | `production` value                                  |
| ----------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `RESEND_API_KEY`        | Resend key labeled _staging_ (§3.2)                        | Resend key labeled _production_ — a different key   |
| `RESEND_FROM_EMAIL`     | `noreply@boximity.ca`                                      | `noreply@boximity.ca`                               |
| `WEBMASTER_EMAIL`       | `hi@boximity.ca`                                           | `hi@boximity.ca`                                    |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from the **test-mode** Workbench endpoint (§3.3) | `whsec_…` from the **live-mode** Workbench endpoint |

`RESEND_FROM_EMAIL` and `WEBMASTER_EMAIL` happen to hold the same value in both environments, but they still live in both — there is no repo-level fallback in this pipeline, and keeping them env-scoped means staging can later point at a test inbox without touching prod.

**`STRIPE_SECRET_KEY` now carries the whole test/live distinction for pricing.** With Price IDs resolved by lookup key, the mode of that one key is what decides which Prices a subscription is created against. Verify it directly: `sk_test_…` in the `staging` environment, `sk_live_…` in `production`. A live key in staging would create **real subscriptions and charge real cards** from the staging site. Also confirm `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…` / `pk_live_…`) — see the two verification items at the end of this section.

| #   | File                                                                      | What to add                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GitHub → Settings → Environments → `staging` **and** `production`         | The 4 secrets themselves, under the exact names from the table above. Different values per environment.                                                                                            |
| 2   | `.github/workflows/environments/{staging,production}.yml`                 | The 4 names in the `secrets:` list (the manifest of what the env expects).                                                                                                                         |
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
```

**Hop 4 — `action.yml` inventory heredoc** (guard checks take the same names; `${VAR:-}` form matches the existing `BREVO_API_KEY` line):

```
RESEND_API_KEY=${RESEND_API_KEY:-}
RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL:-}
WEBMASTER_EMAIL=${WEBMASTER_EMAIL:-}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-}
```

**Hop 5 — both playbooks' `vars:` blocks:**

```yaml
resend_api_key: "{{ RESEND_API_KEY | default('') }}"
resend_from_email: "{{ RESEND_FROM_EMAIL | default('') }}"
webmaster_email: "{{ WEBMASTER_EMAIL | default('') }}"
stripe_webhook_secret: "{{ STRIPE_WEBHOOK_SECRET | default('') }}"
```

**Hop 6 — `docker-compose.yml.j2` `environment:` list:**

```yaml
- RESEND_API_KEY={{ resend_api_key }}
- RESEND_FROM_EMAIL={{ resend_from_email }}
- WEBMASTER_EMAIL={{ webmaster_email }}
- STRIPE_WEBHOOK_SECRET={{ stripe_webhook_secret }}
```

Then: `docs/secrets-rotation-guide.md` (rotation procedure for the new keys) and `scripts/validate-environment.sh`.

**Two things to verify while you're in here** (both pre-existing, both bite Phase 2):

1. `deploy.yml:377,466` reads `secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, but `environments/staging.yml` declares that name under **`variables:`**, not `secrets:`. If it isn't _also_ set as a real environment secret, the publishable key reaches the Docker build empty and the card element never mounts. Confirm before Phase 2 goes to staging.
2. `environments/production.yml` has a **placeholder** live publishable key (`pk_live_…XXXXXXXX`). It must be replaced with the real one before production takes a card.

**A note on how these secrets travel:** hop 4 writes them as plaintext inventory vars into `inventory/deploy.ini` on the runner. That's exactly how `BREVO_API_KEY` and `STRIPE_SECRET_KEY` already travel, so this adds no new exposure class — but it does mean `STRIPE_WEBHOOK_SECRET` and the live Resend key inherit that posture, and the runner's `Cleanup sensitive files` step (`action.yml:213`) removes the SSH key and vault password but **not** `deploy.ini`. Worth adding it there while you're editing the file.

---

## 10. Testing

- **Unit:** `notify.ts` (Resend mocked), `brevo.ts`, the contact route across the full ok/fail matrix (Brevo × Resend), the onboarding route, `resolvePriceId` (lookup-key → Price, including the zero-rows error path), webhook signature verification and the `billing_reason` gate, honeypot, rate limiter.
- **Delete** the waitlist tests; update `checkout-page.test.tsx`, `checkout-page-stripe.test.tsx`, `api-contact.test.ts`, `stripe.lib.test.ts`.
- Jest coverage thresholds (65% branches/functions, 70% lines/statements) must still pass.
- **E2E:** full checkout against Stripe test card `4242 4242 4242 4242`; assert the waitlist is gone.
- **Webhook — read this before you conclude it's broken.** `stripe trigger invoice.payment_succeeded` fabricates a **one-off** invoice with `billing_reason: manual`, so the `subscription_create` gate correctly rejects it and nothing is emailed. That is the gate working, not a failure. Log `billing_reason` (§7) so you can see it. The only faithful test of the real path is a genuine checkout in test mode with `stripe listen` running — which is what produces a `subscription_create` invoice.
- **Lookup keys resolve per mode:** a test asserting `resolvePriceId` should stub `prices.list`, not hit Stripe. But do run the §3.1 sanity check (`stripe prices list --lookup-keys=…`, with and without `--live`) as a deploy-time smoke test — it's the one thing that proves both modes are populated.

---

## 11. Sequencing and the go-live gate

**Start the Resend DNS verification (§3.2) today, before writing any code.** It's the only step with a wall-clock delay you can't compress, and every email test is blocked behind it. Everything else in §3 is a matter of minutes.

Phases 3–5 (email redundancy, webhook, spam) are independent of 1–2 (checkout) and can land first — they carry no risk of taking money.

**Phases 1 and 2 must ship together.** Phase 1 alone exposes a live card form wired to a one-time charge, which is precisely the bug this plan exists to avoid.

Order of operations across environments:

1. **Local** — test-mode Prices created, `stripe listen` running, Resend dev key, `sk_test_…`. Fix the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` bug (§9.1) _first_ or none of this is debuggable.
2. **Staging** — test-mode webhook endpoint + its own `whsec_`, staging Resend key, `sk_test_…`. Full E2E on `4242 4242 4242 4242`. Confirm one webmaster email per signup, not one per retry.
3. **Production** — live-mode webhook endpoint + its own `whsec_`, prod Resend key, `sk_live_…`, real `pk_live_…` publishable key.

**The live-mode Prices must exist before the first production checkout, even though no secret references them.** That's the one cost of lookup keys: nothing in the deploy will fail if you forget to run the `stripe --live` half of §3.1 — the miss surfaces as a failed checkout for a real customer. Run the sanity check (`stripe --live prices list --lookup-keys=basic_monthly`) as part of the go-live gate; it is the whole verification.

Live keys are the last switch flipped, and flipping them is the moment the site starts taking real money.

---

## 12. Out of scope (but you should know)

- **Sales tax.** Now that billing is explicitly CAD to Canadian customers, GST/HST is unambiguously in play (13% in Ontario). Stripe Tax can handle it, but nothing in this plan does, and the Prices above are tax-exclusive. This is a compliance question, not a technical footnote — worth answering before you charge anyone.
- **Subscription management for customers** (upgrade, downgrade, cancel, change seat count). Stripe's billing portal is the cheap answer when you want it.
- **Dunning / failed renewal payments.** Stripe retries on its own; nobody is currently notified when a renewal fails.
- Auto-reply / thank-you emails to the person who submitted a form.
- Migrating the existing Brevo list-10 waitlist contacts.
