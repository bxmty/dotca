import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { readSdrName } from "@/lib/sdr-session";
import { loadQuizConfig, loadSdrContent } from "@/lib/security-assessment";
import { SDR_SESSION_COOKIE } from "@/lib/sdr-console-route";
import CallConsole from "./CallConsole";
import { SdrCallSession } from "./SdrCallSession";

export const metadata: Metadata = {
  title: "Discovery call console",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  // The parent layout points these at the public quiz.
  alternates: { canonical: null },
  openGraph: null,
};

/**
 * The session cookie is the only way in: src/proxy.ts turns a valid link into
 * the cookie before this page renders. Never pass the token to the client.
 */
export default async function CallConsolePage() {
  const token = (await cookies()).get(SDR_SESSION_COOKIE)?.value;
  const sdrName = readSdrName(token);
  if (sdrName === undefined) notFound();

  return (
    <SdrCallSession sdrName={sdrName}>
      <CallConsole config={loadQuizConfig()} sdr={loadSdrContent()} />
    </SdrCallSession>
  );
}
