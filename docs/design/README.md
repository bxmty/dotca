# Design reference: Technical Manual system

This folder is the design reference for the Tailwind cutover. It replaces Bootstrap with the
Technical Manual system: Chivo + Chivo Mono, a neutral ground, queen blue as the one accent,
and a pale-purple highlight in both modes. Build tickets reference this folder rather than the
original drafts.

| File                                                     | What it is                                                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`brand-sheet.html`](brand-sheet.html)                   | Settled decisions, the type scale, light/dark tokens with contrast ratios, logo plates and clear space, the favicon set |
| [`component-spec.html`](component-spec.html)             | Every component boximity.ca needs, mapped to the dotca routes that use it, with the Tailwind v4 `@theme` build notes    |
| [`logo/boximity-lockup.svg`](logo/boximity-lockup.svg)   | Logo 2.0 horizontal lockup, knockout geometry, `fill="currentColor"`                                                    |
| [`logo/boximity-isotype.svg`](logo/boximity-isotype.svg) | Logo 2.0 isotype (favicon source), knockout geometry, `fill="currentColor"`                                             |

Open the HTML files in a browser. Each one is set in the system it describes, so switching
the OS between light and dark shows both modes. The Component Spec also has a theme switch.

## Snapshot

Taken 2026-10-05 from the final drafts: Brand Sheet version 3 and Component Spec version 4.
These are frozen copies. If the system changes, update these files in the same PR as the code
change.

**One amendment** was applied to the Component Spec when the snapshot was taken (decision 5
of the cutover plan, 2026-10-03): **a key figure's source line is optional, not required.**
The component renders the line when a source exists and lays out cleanly without one. All four
home-page stats stay.

## Logo

Both SVGs come from the White artwork's knockout geometry with classes stripped and
`fill="currentColor"`, so the theme colours them (`--logo`: oxford `#03194A` in light,
cultured `#F8F9FB` in dark, cultured on the oxford footer band). The lockup is 34 px tall in the
nav, with clear space equal to the cap height of the B on all sides and a minimum width of
40 px.

## Favicon set

`logo/favicon/` holds the favicon sources from the favicon build
([msp-playbook#180](https://github.com/mega-mattice/msp-playbook/pull/180),
`outputs/brand/favicon-build/`). The site's icons are built from them:

| Site file                                    | Source                                             | Notes                                                                                                               |
| -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/app/icon.svg`                           | `favicon-small.svg` + `favicon-full.svg`           | Adaptive: oxford, cultured under `prefers-color-scheme: dark`. Heavy-Y cube below 48 px, full detail from 48 px up. |
| `src/app/favicon.ico`                        | `favicon-small.svg` (16, 32), `tile-full.svg` (48) | The pin on a transparent background at 16 and 32 px; the oxford tile at 48 px.                                      |
| `src/app/apple-icon.png`                     | `tile-full.svg`                                    | 180 px                                                                                                              |
| `public/icon-192.png`, `public/icon-512.png` | `tile-full.svg`                                    | Manifest icons; the 512 also serves as the maskable icon (the pin sits inside the safe zone).                       |

The rasters were rendered with `sharp` (librsvg), the copy Next already installs. The size
variants are candidates until checked in real browser tabs in light and dark.
