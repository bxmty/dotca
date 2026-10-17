import * as Sentry from "@sentry/nextjs";
import { formatUnavailableMessage } from "@/lib/service-unavailable";

export const dynamic = "force-dynamic";

// Short, rotatable link (boximity.ca/install) to the Free-tier Syncro agent
// installer, sent in the onboarding day-0 confirmation (#642 decisions 18-21).
//
// The target comes from SYNCRO_FREE_INSTALLER_URL, never from source: the
// installer lets anyone enroll a device into the RMM, so it is rotated (env
// change + redeploy) if unknown devices show up in the Free-tier customer.
//
// A route handler rather than a next.config.js redirect for the same reason
// as /book: the URL must reach Syncro exactly as configured, with no query
// normalisation, so Location is set verbatim instead of via
// NextResponse.redirect (which round-trips it through URL). 307, not 308, so
// a rotated link takes effect immediately rather than from a cached copy.
// Not listed in the sitemap.

const UNAVAILABLE_MESSAGE = formatUnavailableMessage(
  "The installer link is temporarily unavailable.",
);

type InstallOutcome = "redirected" | "unavailable";

/**
 * The configured installer URL, or null when it is unset or anything other
 * than an absolute http(s) URL. A leftover placeholder or relative path must
 * never become a redirect.
 */
function readInstallerUrl(): string | null {
  const value = process.env.SYNCRO_FREE_INSTALLER_URL?.trim() ?? "";
  if (!URL.canParse(value)) return null;
  const { protocol } = new URL(value);
  return protocol === "https:" || protocol === "http:" ? value : null;
}

/** One line per click, deliberately without IP, user agent or query values. */
function logClick(outcome: InstallOutcome): void {
  console.log(JSON.stringify({ event: "install_click", outcome }));
}

export function GET(): Response {
  const installerUrl = readInstallerUrl();

  if (!installerUrl) {
    logClick("unavailable");
    // The value itself is never logged: it lets anyone enroll a device.
    Sentry.captureMessage(
      "/install requested but SYNCRO_FREE_INSTALLER_URL is unset or not an absolute http(s) URL",
      "warning",
    );
    return new Response(UNAVAILABLE_MESSAGE, {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  logClick("redirected");
  return new Response(null, {
    status: 307,
    headers: { Location: installerUrl, "X-Robots-Tag": "noindex" },
  });
}
