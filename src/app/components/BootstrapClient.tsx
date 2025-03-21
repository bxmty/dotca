"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Dynamic import of Bootstrap JS on the client side only
    import("bootstrap/dist/js/bootstrap.bundle.min.js" as any);
    
    // Also add a class to body when the component mounts
    // to make it easier to detect client-side rendering
    document.body.classList.add('bootstrap-loaded');
    
    // Set theme based on system preference
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModePreference.matches) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
    
    // Listen for changes in system dark mode preference
    const handleThemeChange = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute('data-bs-theme', e.matches ? 'dark' : 'light');
    };
    
    darkModePreference.addEventListener('change', handleThemeChange);
    
    return () => {
      darkModePreference.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return null;
}