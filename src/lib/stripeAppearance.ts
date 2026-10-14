import type { Appearance, CssFontSource } from "@stripe/stripe-js";
import type { ColorScheme } from "./useColorScheme";

// The Payment Element renders inside Stripe's iframe, where the page's CSS
// variables don't reach, so these are literal copies of the Technical Manual
// tokens in globals.css (one set per scheme). stripeAppearance.lib.test.ts
// pins them to that file, so a token change there fails the suite until it
// lands here too.
type StripeTokens = {
  cell: string;
  ink: string;
  muted: string;
  field: string;
  cta: string;
  fig: string;
  danger: string;
};

const tokensByScheme: Record<ColorScheme, StripeTokens> = {
  light: {
    cell: "#ffffff",
    ink: "#191a1c",
    muted: "#555c67",
    field: "#7d8590",
    cta: "#436d97",
    fig: "#436d97",
    danger: "#d7263d",
  },
  dark: {
    cell: "#1c1e22",
    ink: "#e6e7e9",
    muted: "#9ea4ad",
    field: "#6e7583",
    cta: "#7b99b6",
    fig: "#7b99b6",
    danger: "#ff7a85",
  },
};

/**
 * Chivo for the iframe. next/font self-hosts it for the page, but the
 * iframe can't see those files, so Stripe loads it from Google Fonts.
 */
export const STRIPE_FONTS: CssFontSource[] = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Chivo:wght@400;600&display=swap",
  },
];

/**
 * Stripe Elements appearance for a colour scheme: the site's fields (cell
 * fill, a 3:1 --field edge, 2 px corners, 16 px text, a fig focus ring, a
 * danger edge and inset bar when invalid) and its 14 px semibold labels.
 */
export function getStripeAppearance(scheme: ColorScheme): Appearance {
  const { cell, ink, muted, field, cta, fig, danger } = tokensByScheme[scheme];
  return {
    theme: "stripe",
    variables: {
      colorPrimary: cta,
      colorBackground: cell,
      colorText: ink,
      colorTextSecondary: muted,
      colorTextPlaceholder: muted,
      colorDanger: danger,
      fontFamily: "Chivo, Helvetica, Arial, sans-serif",
      fontSizeBase: "16px",
      borderRadius: "2px",
    },
    rules: {
      ".Label": { fontSize: "14px", fontWeight: "600", color: ink },
      ".Input": {
        border: `1px solid ${field}`,
        boxShadow: "none",
        padding: "11px 12px",
      },
      ".Input:focus": {
        borderColor: fig,
        outline: `2px solid ${fig}`,
        outlineOffset: "-1px",
        boxShadow: "none",
      },
      ".Input--invalid": {
        borderColor: danger,
        boxShadow: `inset 3px 0 0 ${danger}`,
      },
      ".Error": { fontSize: "14px", color: danger },
      ".Tab": { border: `1px solid ${field}`, boxShadow: "none" },
      ".Tab--selected": { borderColor: fig, boxShadow: `0 0 0 1px ${fig}` },
    },
  };
}
