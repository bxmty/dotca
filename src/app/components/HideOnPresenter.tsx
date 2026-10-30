"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SDR_PRESENTER_PATH } from "@/lib/sdr-console-route";

/**
 * Drops the site's links, CTAs and contact details from the SDR presenter tab,
 * which a prospect sees on a shared screen (#710, decisions 9 and 9a). Only this
 * gate is client code: what it wraps stays server-rendered on every other page.
 * The root layout can't read the path itself without making every page dynamic.
 */
export default function HideOnPresenter({ children }: { children: ReactNode }) {
  return usePathname() === SDR_PRESENTER_PATH ? null : children;
}
