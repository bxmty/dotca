# Frontend Theme & Contrast Audit

**Date:** 2026-07-11
**Scope:** `src/app/globals.css`, `src/app/layout.tsx`, `src/app/components/BootstrapClient.tsx`, all page components
**Stack:** Bootstrap 5.3.8 (CSS custom-property color modes), Next.js 16 App Router

---

## TL;DR

Light mode isn't just low-contrast — **there are blocks of text that are effectively invisible in light mode**, at contrast ratios of 1.05:1 and 1.47:1 (a 1.0:1 ratio is literally the same colour). This is the cause of the "tough to read" complaint, and it's a bug, not a tuning problem.

The root cause is a single pattern in `globals.css`: the `.bg-alt` dark band forces all descendant text to near-white using descendant selectors, but that forcing **leaks into nested white cards and accordions**, which keep their white background in light mode. The text goes white; the surface stays white.

Dark mode has no invisible text, but it has real contrast failures — most notably `text-success` (used **125 times**, mostly as feature checkmarks) at **2.94:1** on cards.

Underneath both is a theming architecture that fights itself: two parallel theme mechanisms, ~40 `!important` declarations, and no user-facing theme toggle at all.

**Priority order:** P0 (invisible text) → P1 (contrast) → P2 (architecture). P0 and P1 are cheap and high-impact. P2 is the durable fix and makes most of the P0/P1 patches unnecessary.

---

## How theming works today

Worth stating plainly, because two of the bugs fall straight out of it.

1. `layout.tsx:89` server-renders `<html lang="en" data-bs-theme="auto">`.
2. `BootstrapClient.tsx:15-22` runs a `useEffect` **after hydration**, reads `prefers-color-scheme`, and rewrites the attribute to `"dark"` or `"light"`.
3. `globals.css` *also* has raw `@media (prefers-color-scheme: dark)` blocks that apply independently of the attribute.

There is **no theme toggle and no persistence** anywhere in `src/` — I grepped for `toggleTheme`, `setTheme`, `ThemeToggle`, and `localStorage` and found nothing. The site follows the OS setting only; a user cannot choose. Worth confirming that's intentional.

---

## P0 — Text that is invisible in light mode

### P0-1. `.bg-alt` colour forcing leaks into nested light surfaces

`globals.css:90-97` forces every `p`, `h2`, `h3`, `li`, and `a` inside a `.bg-alt` section to `#f8f9fa`:

```css
.bg-alt p, .bg-alt .text-body, .bg-alt h2,
.bg-alt h3, .bg-alt li, .bg-alt a {
  color: #f8f9fa !important;
}
```

These are **descendant** selectors, so they cross into nested components that have their own background. In light mode Bootstrap resolves `--bs-card-bg: var(--bs-body-bg)` → `#fff` and `--bs-accordion-bg: var(--bs-body-bg)` → `#fff` (verified in `node_modules/bootstrap/dist/css/bootstrap.min.css`). So the card stays white and its text turns near-white.

| Element | Colour | Surface | Contrast | Verdict |
|---|---|---|---|---|
| `.bg-alt p` / `h3` / `li` / `a` | `#f8f9fa` | white card `#fff` | **1.05:1** | Invisible |
| `.bg-alt .text-secondary` | `#d1d5db` | white accordion `#fff` | **1.47:1** | Invisible |
| *(same colours on the actual `#2b3035` band)* | | | 12.63:1 / 9.04:1 | Fine |

There's a partial patch at `globals.css:100-119` — but it's `.bg-alt .card.bg-white`, which only matches cards that carry an explicit `.bg-white` class. **A plain `.card` is already white in light mode and is not matched.**

Affected — plain `.card` (no `.bg-white`, no `.bg-dark`) nested inside a `.bg-alt` section:

| File | White cards in `.bg-alt` |
|---|---|
| `src/app/services/managed-it-services-ontario/page.tsx` | 13 |
| `src/app/page.tsx` | 5 |
| `src/app/services/it-services-for-accounting-firms/page.tsx` | 4 |
| `src/app/services/it-services-for-architecture-firms/page.tsx` | 4 |
| `src/app/services/it-services-for-law-firms/page.tsx` | 4 |
| `src/app/services/it-services-for-marketing-agencies/page.tsx` | 4 |

Concrete example — `src/app/services/it-services-for-accounting-firms/page.tsx:374-388`. The card sits inside the `.bg-alt` section opened at line 353:

```jsx
<div className="card border-primary">
  <div className="card-body">
    <h4 className="h5 mb-3">Accounting-First Technology Approach</h4>  {/* visible: h4 not in the rule */}
    <p className="mb-0">Unlike traditional IT companies…</p>            {/* #f8f9fa on #fff → 1.05:1 */}
  </div>
</div>
```

Note the tell: `h4` isn't in the forced list so the heading renders normally, while the paragraph under it vanishes. That "heading with no body text" symptom is the signature of this bug — worth checking the live site for it.

### P0-2. Pricing FAQ answers are invisible in light mode

Same root cause, separate instance. `src/app/pricing/page.tsx:158` opens a `.bg-alt` section; the FAQ accordion at line 165 lives inside it. Each answer is `<div className="accordion-body text-secondary">` (lines 182, 205, 229, 252).

`globals.css:112` forces `.bg-alt .text-secondary` → `#d1d5db`, and the accordion body's background stays `#fff` in light mode → **1.47:1**. All four FAQ answers on the pricing page are unreadable in light mode. The accordion *buttons* are fine (Bootstrap sets `--bs-accordion-btn-color` on the button itself, which wins), so the FAQ looks like it has questions and no answers.

### Fix for both

Don't hand-force descendant colours. Bootstrap 5.3 supports **nested colour modes**: `[data-bs-theme=dark]` is a complete 1695-character token redeclaration, so it works on *any* element, not just `:root`. Mark the band as a dark region and let Bootstrap theme everything inside it — cards, accordions, borders, and muted text all flip together, and nested surfaces get dark backgrounds so their text is *correctly* light.

```jsx
<section className="py-5 py-md-7 bg-alt" data-bs-theme="dark">
```

```css
/* replaces globals.css:83-138 in its entirety */
.bg-alt {
  --bs-body-bg: #2b3035;
  --bs-card-bg: #343a40;
  background-color: var(--bs-body-bg);
  color: var(--bs-body-color);
}
```

Every `!important` descendant rule under `.bg-alt` — and the `.card.bg-white`, `.card-body.bg-dark`, and `.text-secondary` patches stacked on top of them — can then be deleted. This is the single highest-leverage change in this audit.

---

## P1 — Contrast failures (WCAG AA = 4.5:1 normal text, 3:1 large/UI)

All ratios computed from the actual resolved token values.

### P1-1. `text-success` on dark surfaces — 125 usages

`#198754` is the same green in both themes and was never adjusted for dark surfaces:

| Surface | Contrast | Verdict |
|---|---|---|
| `#fff` (light body) | 4.53:1 | AA (barely) |
| `#f8f9fa` (`bg-light`) | 4.30:1 | **Fails AA** |
| `#212529` (dark body) | 3.40:1 | **Fails AA** |
| `#2b3035` (`bg-alt` / dark card) | **2.94:1** | **Fails AA and the 3:1 UI floor** |

It's explicitly *exempted* from the `.bg-alt` colour forcing (`span:not(.text-success)` at `globals.css:107`), which strongly suggests someone hit this, noticed the green was wrong, and carved it out rather than fixing the colour.

These are the feature checkmarks throughout the marketing pages — e.g. `src/app/page.tsx:387-473`, inside the `.bg-alt` section opened at line 377. This is the most-repeated visual element on the site and it's the worst-contrast one.

**Fix:** use Bootstrap's theme-aware `.text-success-emphasis`, which resolves to `#0a3622` in light (12:1) and `#75b798` in dark (**6.60:1** on body, **5.70:1** on cards). If the brand green must be preserved on light backgrounds, at minimum override `--bs-success-text-emphasis` for dark. Adopting the P0 `data-bs-theme` fix makes this a pure find-and-replace.

### P1-2. `.text-secondary` is the wrong class — 69 usages

This is the main reason light-mode body copy reads as washed out. Bootstrap 5.3 has two similar-sounding utilities that are **not** interchangeable:

| Class | Resolves to | On `#fff` | On `#f8f9fa` |
|---|---|---|---|
| `.text-secondary` *(in use)* | `#6c757d` — flat grey, **not theme-aware** | 4.69:1 | **4.45:1 — fails AA** |
| `.text-body-secondary` *(intended)* | `rgba(33,37,41,.75)` — theme-aware | **6.73:1** | **6.58:1** |

`.text-secondary` is meant for the *secondary brand colour*, not secondary text. It scrapes past AA on pure white and **fails outright on any tinted surface** (`bg-light`, `bg-body-tertiary`). Bootstrap 5.3 deprecated `.text-muted` in favour of `.text-body-secondary` for exactly this reason — and notably the 30 `.text-muted` usages in this codebase are *fine* (7.31:1 in dark), because that class does resolve to the theme-aware token.

**Fix:** replace `.text-secondary` → `.text-body-secondary` sitewide. Purely mechanical, no visual redesign, and it also lets you delete the `.text-secondary` overrides at `globals.css:113, 164, 214` since the replacement is theme-aware by construction.

Affected: `pricing/page.tsx`, `onboarding/page.tsx`, `checkout/page.tsx`, `checkout/confirmation/page.tsx`, `components/Footer.tsx`, and all five `services/*` pages.

### P1-3. `text-warning` / `text-info` are unreadable as text

| Class | Colour | On `#fff` |
|---|---|---|
| `.text-warning` | `#ffc107` | **1.63:1** |
| `.text-info` | `#0dcaf0` | **1.96:1** |

These are fine as *fills* (e.g. `btn-warning` with black text is 12.88:1) but never legible as text on white. Low usage — audit each occurrence and switch to `.text-warning-emphasis` / `.text-info-emphasis` where they're being used as text.

---

## P2 — Theming architecture

These don't produce visible bugs today, but they're why the CSS is hard to fix safely, and two of them will bite the moment a theme toggle is added.

### P2-1. Theme flash on first paint (FOUC)

`layout.tsx:89` ships `data-bs-theme="auto"` in the SSR HTML. **Bootstrap has no `auto` value** — it only defines `:root,[data-bs-theme=light]` and `[data-bs-theme=dark]`, so `auto` silently renders as **light**. `BootstrapClient` only corrects it after hydration.

A dark-mode user therefore gets a full-brightness white page for the duration of the JS load, then a flash to dark. On a marketing site this is the first thing a visitor sees.

**Fix:** a small blocking inline script in `<head>` that sets `data-bs-theme` from `localStorage` ?? `matchMedia` *before* first paint. This is the standard Bootstrap 5.3 colour-mode pattern and it replaces the `useEffect` entirely.

### P2-2. Dead CSS: the `[data-bs-theme="auto"]` block stops applying after hydration

`globals.css:27-47` scopes real theme tokens to `[data-bs-theme="auto"]`:

```css
@media (prefers-color-scheme: dark) {
  [data-bs-theme="auto"] {
    --bs-tertiary-bg: #2b3035;
    --bs-link-color: #8bb9fe;      /* 7.69:1 — good value, never applied */
    --bs-link-hover-color: #a7c7fd;
    /* … */
  }
}
```

But `BootstrapClient` rewrites the attribute from `auto` to `dark` on mount, so **this entire block matches only pre-hydration and then goes dead**. The hand-tuned link colours never reach the user; Bootstrap's defaults (`#6ea8fe`) win instead. Either scope these to `[data-bs-theme="dark"]` or drop them.

### P2-3. Two competing theme mechanisms

`globals.css` styles dark mode **twice**: once via raw `@media (prefers-color-scheme: dark)` (lines 21-48, 153-181) and once via `[data-bs-theme="dark"]` (lines 184-247). They overlap and partially contradict — `.text-secondary`, `.bg-dark`, and `.card-body.bg-dark` are each defined in both.

The media-query versions key off the **OS setting** and ignore the attribute. So the instant anyone adds a theme toggle (P2-4), a user on a dark OS who picks light mode will get light Bootstrap components with dark-mode overrides bleeding through — reintroducing exactly the invisible-text class of bug from P0. **Consolidate on `[data-bs-theme]` only**; it's the mechanism Bootstrap 5.3 is built around and it's the one that respects an explicit user choice.

### P2-4. No theme toggle exists

Confirmed: no `toggleTheme` / `setTheme` / `ThemeToggle` / `localStorage` anywhere in `src/`. The site is OS-preference-only. If a user-selectable theme is wanted, it needs P2-1 and P2-3 done first — otherwise it will surface the bugs above.

### P2-5. `!important` cascade war

`globals.css` carries roughly 40 `!important` declarations, nearly all of them patching a symptom of P0-1 — forced colour leaks into a nested surface, so a more specific forced colour is added to claw it back. `.card-body.bg-dark { color: #f8f9fa !important }` is declared **twice** in the same `[data-bs-theme="dark"]` block (lines 225-227 and 244-246), which is a good sign the file has become hard to reason about.

Adopting the P0 `data-bs-theme` region fix lets most of this file be deleted rather than debugged.

---

## Suggested order of work

1. **P0-1 / P0-2** — convert `.bg-alt` to a `data-bs-theme="dark"` region; delete the descendant-forcing rules. Fixes all invisible text in one change and removes most of `globals.css`.
2. **P1-2** — sitewide `.text-secondary` → `.text-body-secondary`. Mechanical; biggest win for general light-mode readability.
3. **P1-1** — `text-success` → `text-success-emphasis` (125 sites; find-and-replace once step 1 lands).
4. **P2-1 / P2-2 / P2-3** — blocking theme script in `<head>`, consolidate on `[data-bs-theme]`, delete the dead `auto` block and the duplicated media queries.
5. **P1-3** — audit `text-warning` / `text-info` used as text.
6. **P2-4** — add a theme toggle, if wanted. Only safe after step 4.

Steps 1-3 address essentially all of the reported readability problem. Steps 4-6 are the durable cleanup.

---

## Appendix — verification method

Ratios are WCAG 2.1 relative-luminance, computed from token values read out of `node_modules/bootstrap/dist/css/bootstrap.min.css` (not assumed), with `rgba()` values alpha-composited against their actual backing surface. Thresholds: **4.5:1** normal text, **3:1** large text / UI components.

Every class recommended above was confirmed to exist in Bootstrap 5.3.8:
`.text-body-secondary`, `.text-success-emphasis`, `.text-body-emphasis`, `.bg-body-tertiary` — all present.
