# #767 copy draft: for owner sign-off

Status: DRAFT. Nothing here is applied. Mark each block OK / EDIT, then an agent applies it.
Buyer: 25-100 staff, several business systems that don't talk. One-liner: "Enter it once. Get it right. Bill it on time. Managed IT that connects your business."
Prices unchanged. "5 users" stays the minimum on the offer card.

## 1. Home: replace "What You'll Experience" and "The Real Cost" (item 1)

Replaces both sections in `src/app/page.tsx` (`experienceItems`, `costFigures`) and `content/pages/home.md`.

**Section title:** What changes when your systems connect

Outcome items (TickList):

- Data entered once. It reaches dispatch, accounting and the CRM without retyping.
- Invoices go out the day the job closes, not when someone finds time to key it in.
- Mistakes get caught by your systems before the customer sees them.
- Nothing stalls when someone is away: the process lives in the systems, not in one person's head.
- One team answers for the whole stack, including the integrations between your systems.

**Second heading (replaces "Real Cost"):** What disconnected systems cost you
Replace the breach-cost stat grid with 3 plain statements, no invented figures:

- Hours every week retyping the same information.
- Billing that lags the work by days.
- Errors that surface only after the customer does.

DECIDED: statements only, no stat grid.

## 2. Proof block (item 2, new, home)

Placement: after "What changes" and before "Our Guarantees".

**Heading:** A client, in their words of work (anonymised)

> A logistics firm with around 100 staff. Before: the TMS, the accounting suite and GPS tracking each kept their own copy of the job, and someone retyped it. Now: the job is entered once, and the invoice goes out the day it delivers.

**Line under it:** Reference call available on request.
**CTA:** Book a reference call (link: contact form `#contact`, or assessment link?)

DECIDED: no metric (none supplied, none invented). Check with the client that "100 staff" is not identifying enough to need rounding, e.g. "around 100".

## 3. Managed IT services page (item 3)

File: `src/app/services/managed-it-services-ontario/content.tsx` (+ `page.tsx` meta, `content/pages/services-managed-it-services-ontario.md`).

**Hero lead:** Managed IT for Ontario firms with 25-100 staff, built to connect the systems you already run. Enter it once, get it right, bill it on time, with our Comprehensive Cloud Stack.

**Key Components tiles:** Security, Monitoring, Backup, Support, Cloud, **Integration** (new, 🔗), and drop Compliance from the grid (keep it as a line inside the Security group).

**Offer intro:** "Everything your team needs, starting at 5 users:" (price unchanged)

**"Can you work with our existing IT setup?" FAQ:**

> Yes, and that is the point. We are vendor-neutral. We connect what you already run, whether that is dispatch, ERP, accounting, CRM or CAD, instead of asking you to replace it. Each fix is scoped and priced before you spend anything, so you decide which connections are worth it.

**Coverage cards** (regions unchanged: Ontario-wide remote; onsite within ~90 min of Whitby):

- Toronto: "Firms across the GTA with several systems that don't talk. Onsite and remote support." (drop professional services / financial institutions)
- Ottawa: "Operations-heavy firms that need their systems connected and supported. Remote support only." (drop government/compliance)
- Hamilton: "Manufacturing, wholesale and logistics firms with dispatch, ERP and accounting to connect. Onsite and remote support."
- London: "Firms in construction, agriculture and distribution running separate systems for jobs and billing. Onsite and remote support." (drop healthcare/compliance)

DECIDED: generic cards, as written above.

**Other service-page lines** ("small to medium-sized businesses", "small businesses" in FAQ/what): reword to "firms with 25-100 staff". Same pass on the "Why" cards is optional; I'd leave the four cards.

## 4. Architecture firms page (item 4)

File: `src/app/services/it-services-for-architecture-firms/content.ts` (+ `page.tsx`, `.md`).

**Hero lead:** Managed IT for architecture firms that connects CAD/BIM to project accounting. Enter the project once, and it reaches time tracking, billing and invoicing.

**New lead "why" card** (first position): **Connect design to billing.** Project data lives in CAD/BIM and again in project accounting. We connect the two, so hours, milestones and invoices follow the model instead of being retyped.

Keep the CAD security / collaboration cards after it. Replace "small to medium-sized architectural practices" with "firms with 25-100 staff".

## 5. Pricing page tier blurbs (item 5)

File: `src/lib/plan-catalog.ts` (display text only, no prices).

- Basic (currently "Ideal for startups and freelancers looking to secure their digital assets"): **Essential security and Microsoft 365, managed for you.** (audience hidden)
- Standard (currently "Perfect for small teams needing essential IT security and communication tools"): **Managed IT for a growing team, with help connecting the systems you already run.**

DECIDED: hide the audience.

## 6. Blog posts (item 7)

Frame change only. I will not alter facts or prices in the posts.

| Post                     | Change                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enterprise-security.md` | Title "...for 5-10 Person Firms" becomes "...for 25-100 Person Firms". Body: "5-10 person" to "25-100 person" in 3 places. Break-even claim (line ~150) needs review: it was argued for 5-10 staff.                                              |
| `diy-law.md`             | Line 65 "5-10 person professional services firms" becomes "firms with 25-100 staff". Cost maths ($146,400 etc.) is sized to a small firm: **DECIDED: reframe the body to 25-100 staff** (cost maths recalculated, not just retitled; see below). |
| `ms-business-premium.md` | Already renamed. Remove any size framing; add one paragraph on connecting M365 to the line-of-business systems.                                                                                                                                  |
| `ai-law.md`              | "A 5-10 person law firm can realistically deploy this" becomes "A 25-100 person firm". Not in the issue list. Include?                                                                                                                           |
| `fractional-cto.md`      | Untouched, as the issue says.                                                                                                                                                                                                                    |

## Decisions (2026-11-11)

1. Proof case: logistics, 100 staff, TMS + accounting suite + GPS, invoice the day it delivers. No metric.
2. Home outcome section: statements only.
3. Coverage cards: generic.
4. Basic tier blurb: audience hidden.
5. `diy-law.md` and `enterprise-security.md`: reframe in place for 25-100 staff.
6. `ai-law.md`: included.

Reframing 5 means the cost figures ($146,400, $18,720, $1,225/month, break-even) are sized to a small firm and must be recomputed for 25-100 staff or removed. Any new figure needs a source or a stated assumption. Flag each one for your review before it ships. `diy-law.md` also quotes "Comprehensive Cloud Stack for Law Firms: $1,225/month", which is a price: do not change it without a decision.
