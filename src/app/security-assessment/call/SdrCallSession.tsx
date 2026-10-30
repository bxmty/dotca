"use client";

import { createContext, useContext, useMemo } from "react";

type SdrCallSessionValue = { sdrName: string };

const SdrCallSessionContext = createContext<SdrCallSessionValue | null>(null);

/** The SDR's name, for console components. The token stays in an httpOnly cookie. */
export function useSdrCallSession(): SdrCallSessionValue {
  const session = useContext(SdrCallSessionContext);
  if (!session) {
    throw new Error("useSdrCallSession must be used inside SdrCallSession");
  }
  return session;
}

export function SdrCallSession({
  sdrName,
  children,
}: SdrCallSessionValue & { children: React.ReactNode }) {
  const session = useMemo(() => ({ sdrName }), [sdrName]);

  return (
    <SdrCallSessionContext.Provider value={session}>
      {children}
    </SdrCallSessionContext.Provider>
  );
}
