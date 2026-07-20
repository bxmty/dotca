"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Dynamic import of Bootstrap JS on the client side only
    import("bootstrap/dist/js/bootstrap.bundle.min.js");

    // Also add a class to body when the component mounts
    // to make it easier to detect client-side rendering
    document.body.classList.add("bootstrap-loaded");

    // The initial theme is set before first paint by an inline script in
    // layout.tsx; this only keeps it in sync with the OS preference.
    const darkModePreference = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    // Listen for changes in system dark mode preference
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
