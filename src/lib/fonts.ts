import { Chivo, Chivo_Mono } from "next/font/google";

// Shared by the App Router root layout and the Pages Router _app, so both
// routers load the same two variable files. Only Chivo is preloaded;
// adjustFontFallback sizes the fallback to Chivo's metrics so the 60 px hero
// doesn't shift when the web font swaps in.

export const chivo = Chivo({
  subsets: ["latin"],
  variable: "--font-chivo",
  display: "swap",
  adjustFontFallback: true,
});

export const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  variable: "--font-chivo-mono",
  display: "swap",
  preload: false,
});

/** Class names that define --font-chivo and --font-chivo-mono on an element. */
export const fontVariableClassNames = `${chivo.variable} ${chivoMono.variable}`;

/**
 * The same variables as a :root rule, for the Pages Router, where _app has
 * no <html> element to put the class names on.
 */
export const rootFontVariablesCss = `:root {
  --font-chivo: ${chivo.style.fontFamily};
  --font-chivo-mono: ${chivoMono.style.fontFamily};
}`;
