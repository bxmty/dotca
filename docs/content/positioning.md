# Positioning and copy rules

Source of truth for site copy. Read before changing any page, meta, og-image, JSON-LD, plan blurb or blog post. Origin: #766, #767 (decisions 2026-11-09 to 2026-11-11).

## Buyer and category

- **Buyer:** firms whose work runs on several business systems that do not talk (dispatch, ERP, accounting, CRM, CAD): trucking, warehousing, construction, engineering and architecture, manufacturing, wholesale.
- **Size is a targeting filter, never public copy.** The 25-100 staff range lives in the playbook and the prospect-list filters. No headcount range, and no "around N staff", in any page, meta, JSON-LD, og-image or post. Describe the audience by situation ("firms that run on several business systems") and by the systems it runs.
- **Category:** managed IT that connects your business.
- **One-liner:** "Enter it once. Get it right. Bill it on time. Managed IT that connects your business." It is the meta description (home, layout, manifest). The home H1 is the outcome line, the lead says who and what.
- **Lead with** integration outcomes. Compliance and cyber-fear statistics stay secondary.

## Names and sizes

- **Offer name:** Comprehensive Cloud Stack (title case). The old name is retired.
- **Minimum:** 5 users stays on the offer card ("per month for 5 users"). It is a minimum, not a per-user rate.
- **Retired terms:** `Cloud 5 Pack`, "away from the desk", "Small Business Cloud Bundle", "Limited Time Offer", team sizes 5-10 / 5-15 and "5-user team" as an audience. Exceptions: `content/blog/fractional-cto.md`, the onboarding team-size dropdown, `docs/` and `tasks/` history.

## Prices

- The home page shows no price.
- Prices live in `src/lib/plan-catalog.ts` (display) and Stripe Prices (charged). Copy changes never edit a price.
- A price inside a blog post is an assumption and says so. Do not state a per-user rate that the pricing page does not publish.

## Claims

- **Proof case:** one anonymised client (logistics; TMS, accounting suite, GPS tracking; invoice the day it delivers), shared with their permission, reference calls allowed. It carries no invented metric.
- **Platforms named:** Microsoft 365, Salesforce, Sage Intacct. Name a platform only after it has been connected for a client.
- **Assessment:** free, 30 minutes to an hour, covers IT and security. It does not cover integration; connections are scoped and quoted separately, after it.
- **Responsibility:** "we monitor the connections we build, fix our side, and coordinate with the vendor when the cause is theirs." Promise no more than that.
- **Numbers in posts:** every figure carries a source or is labelled an assumption. A shared assumption (hourly rate, firm size, price per user) is identical in every post.

## Where the copy lives

- Rendered copy: each service route's `content.ts(x)` and `page.tsx` (meta, JSON-LD), `src/app/page.tsx`, the shared `ServiceLandingPage`, the service og-images, `src/lib/plan-catalog.ts`.
- `content/pages/*.md` are text copies. Nothing renders them. Update the `.md` and the rendered file in the same commit, so the two stay in step.

## Done when a copy change ships

1. `rg -i "cloud 5 pack|\b5[-–](10|15)\b|away from the desk" src content` returns only the exceptions above and the retired-copy assertion in `src/tests/page.test.tsx`. The `\b` matters: a bare `5-10` also matches "25-100".
2. `rg -i "25[–-]100|around 100 staff" src content` returns nothing.
3. `npm run check` passes, with tests updated where they assert the old copy.
4. The `.md` mirror matches the rendered text.
