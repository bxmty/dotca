"use client";

import { useSyncExternalStore } from "react";

export type ColorScheme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The query list, or undefined where matchMedia is missing (jsdom, old browsers). */
function getDarkQueryList(): ReturnType<typeof window.matchMedia> | undefined {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(DARK_QUERY)
    : undefined;
}

function subscribe(onChange: () => void): () => void {
  const queryList = getDarkQueryList();
  queryList?.addEventListener("change", onChange);
  return () => queryList?.removeEventListener("change", onChange);
}

const getSnapshot = (): ColorScheme =>
  getDarkQueryList()?.matches ? "dark" : "light";

// The server has no OS scheme to read; light matches the tokens' default.
const getServerSnapshot = (): ColorScheme => "light";

/**
 * The OS colour scheme, the same one globals.css switches the tokens on,
 * kept current while the page is open. For surfaces the tokens can't reach,
 * such as Stripe's iframe.
 */
export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
