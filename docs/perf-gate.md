# Perf gate

A manually run Lighthouse gate for releases that can move page weight or
Core Web Vitals (first use: the Collapse release, #615). It measures staging
before and after a deploy and compares the two against the cutover budget
from msp-playbook#163. It is not run in CI on purpose: shared runners are too
noisy for millisecond budgets.

- Script: `scripts/perf-gate.ts` (run by Node 24's built-in TypeScript
  support, no build step), exposed as `npm run perf:gate`.
- Gate logic (matrix, medians, thresholds, Markdown table): `src/lib/perfGate.ts`,
  unit tested in `src/tests/perfGate.lib.test.ts`.

## Prerequisites

- `npm ci` (installs the pinned `lighthouse` and `puppeteer-core`).
- A Chrome or Chromium binary, passed as `--chrome-path` or `CHROME_PATH`.
  The one Playwright installs works:
  `export CHROME_PATH=$(ls -d ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome | tail -1)`
- A quiet machine. Close other heavy work; runs are sequential and take a
  while (12 configurations x 5 passes is 60 Lighthouse runs).

## Procedure: before, deploy, after

Run before and after on the same machine, as close together as possible.
`compare` warns when the two sides are more than 24 h apart.

1. **Before.** With staging on the pre-change commit:

   ```sh
   npm run perf:gate -- measure \
     --base-url https://<staging-host> \
     --out perf/before.json \
     --commit <pre-change sha>
   ```

2. **Deploy** the change to staging.

3. **After.**

   ```sh
   npm run perf:gate -- measure \
     --base-url https://<staging-host> \
     --out perf/after.json \
     --commit <post-change sha>
   ```

4. **Compare** and paste the output into the PR:

   ```sh
   npm run perf:gate -- compare \
     --before perf/before.json \
     --after perf/after.json \
     --bytes-ref perf/baseline-pre-collapse.json
   ```

   Leave out `--bytes-ref` when there is no frozen reference yet; the net
   total check then shows `SKIP` instead of failing.

## Rerunning one configuration

When `compare` fails, its output ends with a ready-made rerun command. To
rerun by hand, name the failing configurations with `--only` (repeatable)
and point `--out` at the existing after file:

```sh
npm run perf:gate -- measure \
  --base-url https://<staging-host> \
  --out perf/after.json \
  --only mobile-light:/pricing --only mobile-dark:/pricing
```

That takes fresh passes (5 by default) for just those configurations and
merges them into `perf/after.json`. Every other configuration keeps its
original numbers and timestamp. Then run `compare` again.

Gate rule (applied by a human, not the script): one rerun is allowed. A
failure after the rerun blocks the release unless the CEO waives it in the PR.

Run `npm run perf:gate` with no arguments to print usage and every
configuration key.

## What is measured

| Configurations                   | Routes                                                                    |
| -------------------------------- | ------------------------------------------------------------------------- |
| Mobile light, desktop light      | `/`, `/services/managed-it-services-ontario`, `/pricing`, `/blog/backups` |
| Mobile dark                      | `/`, `/pricing`                                                           |
| Mobile light, font files blocked | `/`, `/pricing`                                                           |

Each configuration gets 5 passes, and every threshold is applied to the
median. The JSON keeps the raw value from every pass alongside the medians.
`--passes` can lower the count for a quick local smoke run. `compare` then
warns that a side has fewer than 5 passes, so don't use those numbers for a
gate verdict.

## Thresholds

| Metric     | Mobile (light and dark)         | Desktop                        |
| ---------- | ------------------------------- | ------------------------------ |
| Perf score | ≥ before − 3                    | ≥ 98                           |
| LCP        | ≤ before + 150 ms and ≤ 2000 ms | ≤ before + 100 ms and ≤ 800 ms |
| TBT        | ≤ before + 50 ms                | ≤ 50 ms                        |
| CLS        | ≤ 0.02                          | ≤ 0.02                         |
| FCP        | ≤ before + 150 ms               | ≤ before + 100 ms              |

**Byte budgets** are checked once per route, from the mobile light run,
using compressed transfer size (1 KiB = 1024 bytes):

- Net total (CSS + JS + fonts) ≤ the `--bytes-ref` file's value. It counts
  only first-party requests, meaning the same hostname as the page. GTM and
  every other third-party request are left out.
- The CSS and font caps below count every origin, so a font from a
  third-party CDN still counts toward the font budget.
- CSS ≤ 35 KiB.
- First-party JS ≤ before.
- Fonts ≤ 60 KiB and ≤ 2 font files.

**Font-blocked pass:** only CLS ≤ 0.02 and "every pass still paints" are
gated. Lighthouse's `blockedUrlPatterns` blocks `*.woff2`, `*.woff`, `*.ttf`,
`*.otf` and `fonts.gstatic.com`. A warning appears if font bytes still loaded,
because that means the block missed and the pass tested nothing.

**Dark mode:** `prefers-color-scheme: dark` is emulated with Puppeteer's
`emulateMediaFeatures` on the page Lighthouse drives. After each pass, the
script reads the computed `<body>` background colour (falling back to
`<html>` when the body is transparent). If that colour isn't dark, the
measurement stops with an error. `compare` also fails a dark configuration
unless both the before run and the after run were proven dark.

**LCP element** (report only): recorded on every pass. The warnings list
flags a run on `/` or the service page where the LCP element isn't the H1.

## Exit codes

| Code | Meaning                                                                                 |
| ---- | --------------------------------------------------------------------------------------- |
| 0    | `measure` finished, or `compare` passed                                                 |
| 1    | `compare` found at least one failing check                                              |
| 2    | Usage error, or `measure` aborted (no Chrome, Lighthouse error, dark render not proven) |
