"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initGA, pageview } from "../../lib/gtag";
import { isSdrConsoleRoute } from "../../lib/sdr-console-route";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Configure GA once on mount. Configuration never sends a page_view;
  // the navigation effect below is the only source of page_view events.
  useEffect(() => {
    initGA();
  }, []);

  // Track exactly one page view per navigation (including the initial load).
  useEffect(() => {
    if (!pathname) return;
    // The console's first render still has its signed link in the query, and
    // staff calls aren't site traffic: send nothing for these routes (#711).
    if (isSdrConsoleRoute(pathname)) return;

    const url = searchParams?.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    pageview(url);
  }, [pathname, searchParams]);

  // This is a utility component with no visual rendering
  return null;
}
