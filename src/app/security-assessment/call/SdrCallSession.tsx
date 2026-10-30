"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { SDR_TOKEN_PARAM } from "@/lib/sdr-console-route";

type SdrCallSessionValue = { sdrName: string; token: string };

const SdrCallSessionContext = createContext<SdrCallSessionValue | null>(null);

/** The SDR's name and signed token, for console components and API calls. */
export function useSdrCallSession(): SdrCallSessionValue {
  const session = useContext(SdrCallSessionContext);
  if (!session) {
    throw new Error("useSdrCallSession must be used inside SdrCallSession");
  }
  return session;
}

/**
 * Removes the token from the address bar on load, in case the wrong tab gets
 * shared, and holds it in memory. Never write it to web storage.
 */
export function SdrCallSession({
  sdrName,
  token,
  children,
}: SdrCallSessionValue & { children: React.ReactNode }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(SDR_TOKEN_PARAM)) return;
    url.searchParams.delete(SDR_TOKEN_PARAM);
    window.history.replaceState(null, "", url);
  }, []);

  const session = useMemo(() => ({ sdrName, token }), [sdrName, token]);

  return (
    <SdrCallSessionContext.Provider value={session}>
      {children}
    </SdrCallSessionContext.Provider>
  );
}
