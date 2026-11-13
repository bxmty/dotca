import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/app/components/Button";
import StatusPage from "@/app/components/StatusPage";
import { formatUnavailableMessage } from "@/lib/service-unavailable";
import { resolveIntakeToken } from "@/lib/syncro";
import ServiceRequestForm from "./ServiceRequestForm";

// The token in the path is a secret: keep the URL out of indexes and out of
// the Referer header of anything the page links to.
export const metadata: Metadata = {
  title: "Service request",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: null },
  openGraph: null,
};

// Resolve the token on every request: a cached render would outlive a revoked
// token, or pin the "could not check" state after Syncro recovers.
export const dynamic = "force-dynamic";

/**
 * Joiner/leaver intake (#565). The token is resolved before anything renders,
 * so an unknown one never receives a form. The client's name stays on the
 * server: holding a link must not reveal whose it is.
 */
export default async function ServiceRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolution = await resolveIntakeToken(token);

  if (resolution.status === "no_match") notFound();

  if (resolution.status === "could_not_check") {
    // Every token lands here during an outage, valid or not, so this reveals
    // nothing about the one in the URL. The token itself stays out of Sentry.
    Sentry.captureMessage(
      `Service request page: the intake token could not be checked (${resolution.detail})`,
      "error",
    );
    return (
      <StatusPage
        kicker="Error"
        heading="This form is temporarily unavailable"
        action={
          <ButtonLink href="tel:+12895390098" variant="secondary">
            Call (289) 539-0098
          </ButtonLink>
        }
      >
        <p className="m-0">
          {formatUnavailableMessage(
            "We could not load the request form. Try again in a few minutes.",
          )}
        </p>
      </StatusPage>
    );
  }

  return <ServiceRequestForm token={token} />;
}
