---
tags:
  - deliverable
  - webmaster
  - marketing
---

# Web Copy Change Request — for the Webmaster

**From:** Matt Mattice, Boximity
**Date:** 2026-08-02
**What this is:** every change to the live site's copy that's been decided and is ready to build, in priority order. Where the exact replacement text is settled, it's given verbatim — use it as-is. Where only the decision (not the wording) is settled, that's called out so nothing gets guessed on your end. A few items are explicitly **not ready** — flagged so they don't get built on spec.

**Why now, in one paragraph:** Boximity just closed a positioning decision — the niche is businesses whose work happens away from the desk (fleets, warehouses, field crews, and site-going technical firms like engineering and architecture), not a grab-bag of law/accounting/marketing-agency verticals. Alongside that, a full claims audit found several site claims that are false or unverifiable and need to come off regardless of the repositioning. Both threads are bundled here since a lot of it touches the same pages.

---

## Priority 1 — False/misleading claims, site-wide (do first, no design work needed)

These are plain text swaps. Reasoning: a claim that can't survive a direct question on a sales call shouldn't be on the site — full audit in the source doc below.

### 1a. "Trusted by [X] since 2020" — remove everywhere it appears

Boximity started operating **April 2019**, and "since 2020" undercounts anyway. Currently live, verbatim, on:

- `services-managed-it-services-ontario.md` (line 30) — **fix this one directly**, this page stays live
- `services-it-services-for-law-firms.md`, `services-it-services-for-accounting-firms.md`, `services-it-services-for-marketing-agencies.md` — **don't bother fixing, these three pages are being retired** (see Priority 2)
- `services-it-services-for-architecture-firms.md` — folded into that page's rebuild (Priority 4), not a standalone fix

For the Ontario page, just delete the line. Nothing needs to replace it.

### 1b. "Join hundreds of [X] that have eliminated IT headaches" — remove everywhere

Real number: **~5 clients served, ever.** Same distribution as 1a — fix on the Ontario page, skip on the three retiring pages, handle in the architecture rebuild.

Ontario page (`services-managed-it-services-ontario.md`, closing section) — replace:

> Join hundreds of Ontario businesses that have eliminated IT headaches and regained focus on what matters most - growing their business. Start with a free IT assessment today.

with:

> We're a young Ontario MSP building our client base — here's exactly what that means for you: [see our approach]. Start with a free IT assessment today.

(The bracketed link can point wherever "our approach" / process content lands — not prescribing a URL here.)

### 1c. Unverified response-time claims on the Ontario coverage cards

`services-managed-it-services-ontario.md`, "Managed IT Services Ontario Coverage" section:

- Toronto card: **"Response: < 2 hours"** — no operational basis, remove
- Hamilton card: **"Response: < 3 hours"** — no operational basis, remove
- London card: **"Response: < 3 hours"** — no operational basis, remove

(The Ottawa card was already fixed in an earlier pass — it now correctly reads "remote support only," no response-time figure. Toronto/Hamilton/London still need the same treatment.) Replace each with a plain description of what's covered remotely/onsite, no time figure — same pattern as the Ottawa card already shows on the page today.

### 1d. "With decades of experience in corporate technology solutions" — home page

Home page (`home.md`), under "Our Small Business Cloud Bundle": this line currently reads as a **company** claim, but it's actually the **founder's** personal background (real: 19 years running an app-support business, since 2005) — not Boximity's corporate track record. Replace:

> With decades of experience in corporate technology solutions, we understand the rapid pace of technological advancement. Our team stays ahead of the latest developments, ensuring your business has the most effective solutions available.

with:

> Our founder has spent 19 years running application development and support for other businesses — that background is why we understand how fast technology moves, and why we build solutions that actually fit how you work, not the other way around.

**Skip if the home page rebuild (Priority 3) is happening in the same pass** — this section gets replaced wholesale there anyway. Only fix it standalone if the rebuild is delayed.

---

## Priority 2 — Retire three vertical pages (pure deletion, no content to write)

**Retire immediately, no replacement content needed:**

- `/services/it-services-for-law-firms`
- `/services/it-services-for-accounting-firms`
- `/services/it-services-for-marketing-agencies`

**Why:** the business no longer markets to these segments at all — they're outside the new niche. Leaving them live actively contradicts the "we structurally don't chase certain segments" positioning that's part of the new pitch (a boundary the site itself doesn't honor isn't a real boundary).

**Mechanics:**

- 301 redirect each to `/services/managed-it-services-ontario` (or the home page, whichever you'd normally use for a retired-vertical redirect) — don't just 404 them, they likely have inbound links/SEO weight worth not wasting.
- Pull them from any nav/sitemap/internal links.
- No new copy required — this is subtraction only.

---

## Priority 3 — Home page rewrite

The messaging decisions below are final; the layout/visual implementation is yours to build. Everything in quotes is exact, approved copy.

**Above-the-fold headline** — replace _"Make Your Whole Team Tech-Savvy Without the Headache"_ (and the `<title>`/meta description built around "Enterprise IT Solutions for Small Businesses") with:

> **"IT that just works — for businesses whose work happens away from the desk."**

**One-liner** (use as a subhead, or wherever the site currently runs the "Stop wasting time..." sentence):

> "For businesses that live outside the office, we replace break-fix firefighting with technology that just works — one flat price, no surprises."

**Primary CTA:** **"Get a Business-First IT Assessment"** (replaces "Get Your IT Assessment" as the primary button)
**Secondary CTA:** "See Pricing Options" stays, but demoted to the visually quieter of the two buttons — it's a supporting link now, not co-equal with the primary CTA.

**Villain section** — rename the existing three-bullet section (currently "The Technology Challenge Small Businesses Face Today") to:

> **"The Reactive IT Trap"**

Keep the same three bullets (Security Threats / Wasted Time / Employee Frustration) but frame the intro line around reactivity — technology only getting attention after it breaks — rather than presenting them as three unrelated risks.

**Add one internal-problem line**, placed near the villain section or in the "Our Small Business Cloud Bundle" intro copy:

> "...without really understanding the business impact — or being forced into decisions that don't fit how you actually work."

**Hero image guidance** (if/when hero imagery is refreshed — not urgent, but don't spend new photo budget on the current imagery direction): move away from office/boardroom/server-rack/headset stock photography. Target images: a dispatcher or fleet owner checking a phone or tablet mid-yard, a technician on-site at a client's shop or job site (not a data center), a truck cab, warehouse floor, or inspection/survey site as backdrop. Through-line: "away from the desk, in control anyway."

**Success/benefit list** — trim the current 7-item list to these 3 (drop the other four — they're generic and don't tie to anything specific about Boximity):

- **Greater Confidence in Decision-Making**
- **Peace of Mind from Proactive Protection**
- **Enhanced Security**

**"Real Cost of Inadequate Technology" stat block** — leave as-is for now; not part of this pass (not flagged in the claims audit as false, just not yet re-sourced against the new niche).

**Guarantee section — new, add if not already on the page.** Three items, exact language:

1. _"Every recommendation comes with a plain-language reason you can repeat back — if you can't, the conversation is free."_
2. _"No line item you weren't told about in advance — or that line item is free."_
3. _"A free written second opinion on any vendor quote or existing IT contract."_

**What replaces the response-time claim (don't add a response-time number back in):** the site should NOT publish a specific minutes/hours response-time figure anywhere as a headline claim. Instead, when a metric is wanted, use: **two-nines uptime** (device online/checked-in percentage during business hours) and **quarter-over-quarter reduction in the client's risk-register findings**. Neither of these has final published wording yet from your end — flag back to me if the design needs the exact phrasing before you build it, rather than guessing.

---

## Priority 4 — Rebuild the Architecture page

`services-it-services-for-architecture-firms.md` is being kept, but rebuilt from scratch — it's not a copy-edit of the current page, don't just patch the "since 2020"/"hundreds of" lines and call it done.

**Status: content not yet drafted on my end.** What's decided is the sequencing (architecture is next after the three retirements) and the general positioning (part of the "work happens away from the desk" / site-going technical-firms cluster, alongside engineering, surveying, environmental consulting, and testing labs). The actual page copy — headline, FAQ, feature list — hasn't been written yet. **Hold this page** until I send finished copy; don't build from the current page's content as a starting template, since its claims (client counts, "since 2020," the CPA/law-firm-style generic vertical framing) are exactly what's being retired.

**Two more pages are planned after that** (not yet drafted either):

- An **engineering services** vertical page — new, doesn't exist today
- A **batched page** covering surveying, environmental consulting, and testing labs together

Sequencing only, for your planning purposes: retirements + architecture first, engineering second, the batched page third. I'll send copy for each as it's ready — no need to hold a slot open or guess at timing beyond that order.

---

## Priority 5 — Onboarding form field fix

`onboarding.md`, Step 1, "Number of Employees" dropdown currently reads:

```
- Select
- 1-10
- 11-50
- 51-200
- 201-500
- 501+
```

The business's actual target range is 5–25 employees. Replace the options with something that actually resolves within that band rather than the current enterprise-scale buckets — exact bucket boundaries are up to you/design, but nothing in the list should top out anywhere near 501+. A reasonable version:

```
- Select
- 5-10
- 11-25
- 26-50
- 51+
```

(If you'd rather keep a "51+" catch-all bucket for the rare oversized lead, that's fine — the point is the top of the list shouldn't imply Boximity serves 500-person companies.)

---

## Priority 6 — Stale reference doc

`software-bundles.md` (internal pricing reference, feeds marketing copy) still lists **Premium Plan — $449.00** as a flat price. The live pricing and checkout pages already moved Premium to a custom-quote flow (margin risk at that flat price was confirmed real, not just a guess) — this reference doc wasn't updated to match and will mislead whoever pulls copy from it next. Either delete the Premium row's flat price and mark it "custom quote — contact us" (matching `pricing.md`/`checkout.md`), or pull the whole doc if it's no longer the canonical reference either page actually pulls from — your call on which, just don't leave the two out of sync.

---

## Explicitly NOT ready — don't build these yet

- **Testimonials / case study.** None exist yet — templates are built on my end, but no real client has been asked yet, so there's nothing true to publish. Don't add a testimonials section with placeholder or invented content.
- **Any specific response-time number.** Confirmed there isn't one to publish (see Priority 3) — don't backfill with a plausible-sounding figure.
- **A published dollar-figure market-size claim** ("$XM addressable market" style copy) — the business-count side of this was re-verified, but there's no honest per-account revenue assumption yet to turn it into a dollar claim. Don't publish one.
- **Engineering and surveying/environmental/testing vertical pages** — sequencing is set (Priority 4), copy is not written.

---

## Quick reference — what's already fixed, don't redo

- Ontario page's geography tagline (onsite-radius wording, Ottawa card) — already corrected in a prior pass.
- Standard pricing sheet's non-GTA surcharge line — already removed.
- Checkout and live pricing pages already route Premium to a custom quote, not a flat $449 checkout.

If anything in this doc conflicts with what you find live on the site, the live site is probably stale — ping me rather than guessing which is current.
