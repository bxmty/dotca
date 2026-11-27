"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SDR_PRESENTER_PATH } from "@/lib/sdr-console-route";
import { isServiceRequestPage } from "@/lib/service-request-route";

/**
 * Picks the site's chrome for the path. The SDR presenter tab, which a
 * prospect sees on a shared screen, gets none (#710, decisions 9 and 9a). A
 * service request page gets `intake`: no link out, so the requester completes
 * and submits. Only this gate is client code: what it wraps stays
 * server-rendered. The root layout can't read the path itself without making
 * every page dynamic.
 */
export default function SiteChrome({
  children,
  intake,
}: {
  children: ReactNode;
  intake: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === SDR_PRESENTER_PATH) return null;
  if (pathname !== null && isServiceRequestPage(pathname)) return intake;
  return children;
}
