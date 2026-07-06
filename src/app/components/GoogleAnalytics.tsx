"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initGA, pageview } from "../../lib/gtag";

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

    const url = searchParams?.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    pageview(url);
  }, [pathname, searchParams]);

  // This is a utility component with no visual rendering
  return null;
}
