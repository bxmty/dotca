"use client";

import { useEffect } from "react";

/**
 * Keeps `data-bs-theme` on <html> in sync with the OS color scheme. The
 * initial theme is set before first paint by an inline script in layout.tsx.
 */
export default function ThemeSync() {
  useEffect(() => {
    const darkModePreference = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    const handleThemeChange = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute(
        "data-bs-theme",
        e.matches ? "dark" : "light",
      );
    };

    darkModePreference.addEventListener("change", handleThemeChange);

    return () => {
      darkModePreference.removeEventListener("change", handleThemeChange);
    };
  }, []);

  return null;
}
