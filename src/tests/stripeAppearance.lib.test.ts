/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getStripeAppearance } from "@/lib/stripeAppearance";

// The Payment Element renders in Stripe's iframe, where the page's CSS
// variables don't reach, so the mapping carries the token values as
// literals. These tests pin those literals to globals.css.

const css = readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

/** `--name: value;` pairs of the first `:root { ... }` block after `from`. */
function readRootTokens(from: number): Record<string, string> {
  const start = css.indexOf(":root {", from);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim().toLowerCase(),
    ]),
  );
}

const lightTokens = readRootTokens(0);
const darkTokens = {
  ...lightTokens,
  ...readRootTokens(css.indexOf("@media (prefers-color-scheme: dark)")),
};

describe("getStripeAppearance", () => {
  it.each([
    ["light", lightTokens],
    ["dark", darkTokens],
  ] as const)("maps the %s tokens to Stripe variables", (scheme, tokens) => {
    const { variables } = getStripeAppearance(scheme);

    expect(variables).toEqual(
      expect.objectContaining({
        colorPrimary: tokens.cta,
        colorBackground: tokens.cell,
        colorText: tokens.ink,
        colorTextSecondary: tokens.muted,
        colorDanger: tokens.danger,
        borderRadius: "2px",
        fontSizeBase: "16px",
      }),
    );
    expect(variables?.fontFamily).toMatch(/^Chivo,/);
  });

  it("returns distinct light and dark variable sets", () => {
    const light = getStripeAppearance("light").variables;
    const dark = getStripeAppearance("dark").variables;

    expect(light).not.toEqual(dark);
    expect(light?.colorBackground).not.toBe(dark?.colorBackground);
    expect(light?.colorText).not.toBe(dark?.colorText);
  });

  it.each(["light", "dark"] as const)(
    "draws %s inputs like the site's fields: a --field edge and a danger bar when invalid",
    (scheme) => {
      const tokens = scheme === "light" ? lightTokens : darkTokens;
      const { rules } = getStripeAppearance(scheme);

      expect(rules?.[".Input"]).toEqual(
        expect.objectContaining({ border: `1px solid ${tokens.field}` }),
      );
      expect(rules?.[".Input:focus"]).toEqual(
        expect.objectContaining({ borderColor: tokens.fig }),
      );
      expect(rules?.[".Input--invalid"]).toEqual(
        expect.objectContaining({
          borderColor: tokens.danger,
          boxShadow: `inset 3px 0 0 ${tokens.danger}`,
        }),
      );
    },
  );
});
