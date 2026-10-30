import type { Metadata } from "next";
import { notFound } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { verifySdrToken } from "@/lib/sdr-link";
import { SDR_TOKEN_PARAM } from "@/lib/sdr-console-route";
import CallConsole from "./CallConsole";
import { SdrCallSession } from "./SdrCallSession";

export const metadata: Metadata = {
  title: "Discovery call console",
  robots: { index: false, follow: false },
  // The first request's URL holds the token; don't send it to script hosts.
  referrer: "no-referrer",
  // The parent layout points these at the public quiz.
  alternates: { canonical: null },
  openGraph: null,
};

/** The SDR's name, or null for anything that should 404. */
function readSdrName(token: string): string | null {
  try {
    const verification = verifySdrToken(token);
    return verification.isValid ? verification.sdrName : null;
  } catch {
    Sentry.captureMessage(
      "/security-assessment/call requested but SDR_LINK_SIGNING_SECRET is unset or too short, so SDR tokens cannot be checked",
      "warning",
    );
    return null;
  }
}

export default async function CallConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const token = (await searchParams)[SDR_TOKEN_PARAM];
  if (typeof token !== "string") notFound();

  const sdrName = readSdrName(token);
  if (sdrName === null) notFound();

  return (
    <SdrCallSession sdrName={sdrName} token={token}>
      <CallConsole />
    </SdrCallSession>
  );
}
