/**
 * @jest-environment node
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "tailwindcss";

// Compiles the real globals.css through Tailwind, the same way the PostCSS
// plugin does, so these tests pin the token contract later tickets build on.

const STYLESHEET_PATH = path.join(process.cwd(), "src/app/globals.css");
const TAILWIND_DIR = path.dirname(require.resolve("tailwindcss/package.json"));

async function loadStylesheet(id: string, base: string) {
  const resolved =
    id === "tailwindcss"
      ? // Not require.resolve: next/jest maps .css requests to a style mock.
        path.join(TAILWIND_DIR, "index.css")
      : path.resolve(base, id);
  return {
    path: resolved,
    base: path.dirname(resolved),
    content: await readFile(resolved, "utf8"),
  };
}

async function buildCss(candidates: string[]): Promise<string> {
  const css = await readFile(STYLESHEET_PATH, "utf8");
  const compiler = await compile(css, {
    base: path.dirname(STYLESHEET_PATH),
    loadStylesheet,
  });
  return compiler.build(candidates);
}

/** Declarations of the first rule whose selector is exactly `selector`. */
function readRule(css: string, selector: string, from = 0): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|[\\s}])${escaped}\\s*\\{([^}]*)\\}`).exec(
    css.slice(from),
  );
  if (!match) throw new Error(`No rule for ${selector}`);
  return match[1];
}

function readDarkRootRule(css: string): string {
  const darkAt = css.indexOf("@media (prefers-color-scheme: dark)");
  if (darkAt === -1) throw new Error("No dark-scheme media block");
  return readRule(css, ":root", darkAt);
}

describe("Tailwind theme tokens", () => {
  it("generates nothing for Tailwind's default colours, text sizes and radii", async () => {
    const css = await buildCss([
      "text-xl",
      "text-sm",
      "bg-red-500",
      "text-blue-500",
      "rounded-lg",
      "rounded-md",
    ]);

    for (const name of [
      ".text-xl",
      ".text-sm",
      ".bg-red-500",
      ".text-blue-500",
      ".rounded-lg",
      ".rounded-md",
    ]) {
      expect(css).not.toContain(name);
    }
  });

  it("exposes the eight-step brand type scale", async () => {
    const scale = {
      "text-label": "12px",
      "text-small": "14px",
      "text-body": "16px",
      "text-prose": "18px",
      "text-h3": "20px",
      "text-h2": "28px",
      "text-section": "42px",
      "text-display": "60px",
    };
    const css = await buildCss(Object.keys(scale));

    for (const [utility, size] of Object.entries(scale)) {
      expect(readRule(css, `.${utility}`)).toContain(`font-size: ${size}`);
    }
  });

  it("maps brand colour utilities onto the scheme-switching raw variables", async () => {
    const css = await buildCss([
      "bg-cell",
      "text-ink",
      "border-rule",
      "text-logo",
    ]);

    expect(readRule(css, ".bg-cell")).toContain(
      "background-color: var(--cell)",
    );
    expect(readRule(css, ".text-ink")).toContain("color: var(--ink)");
    expect(readRule(css, ".border-rule")).toContain(
      "border-color: var(--rule)",
    );
    expect(readRule(css, ".text-logo")).toContain("color: var(--logo)");
  });

  it("has the 2px control radius as the only radius", async () => {
    const css = await buildCss(["rounded-ctl"]);

    expect(readRule(css, ".rounded-ctl")).toContain("border-radius: 2px");
  });

  it("switches the raw tokens with the OS colour scheme", async () => {
    const css = await buildCss([]);

    const light = readRule(css, ":root");
    expect(light).toMatch(/--bg:\s*#F8F9FB/i);
    expect(light).toMatch(/--ink:\s*#191A1C/i);
    expect(light).toMatch(/--logo:\s*#03194A/i);

    const dark = readDarkRootRule(css);
    expect(dark).toMatch(/--bg:\s*#16171A/i);
    expect(dark).toMatch(/--ink:\s*#E6E7E9/i);
    expect(dark).toMatch(/--logo:\s*#F8F9FB/i);
    expect(dark).toMatch(/color-scheme:\s*dark/);
  });

  it("keeps the pale-purple highlight the same in both schemes", async () => {
    const css = await buildCss([]);

    expect(readRule(css, ":root")).toMatch(/--hl:\s*#E9DDE9/i);
    expect(readDarkRootRule(css)).not.toContain("--hl");
  });

  it("makes .hl a light-token island, so it stays light in dark mode", async () => {
    const css = await buildCss([]);

    const island = readRule(css, ".hl");
    expect(island).toMatch(/--ink:\s*#191A1C/i);
    expect(island).toMatch(/--cta:\s*#436D97/i);
    expect(island).toMatch(/background:\s*var\(--hl\)/);
    expect(island).toMatch(/color-scheme:\s*light/);
  });

  it("colours the logo cultured and the focus accent band-fig on the oxford band", async () => {
    const css = await buildCss([]);

    const band = readRule(css, ".bg-band");
    expect(band).toMatch(/--logo:\s*var\(--band-ink\)/);
    expect(band).toMatch(/--fig:\s*var\(--band-fig\)/);
  });
});
