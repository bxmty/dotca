import * as Sentry from "@sentry/nextjs";
import {
  checkInstallToken,
  INSTALL_TOKEN_PARAM,
  type InstallTokenCheck,
} from "@/lib/install-link";
import { formatUnavailableMessage } from "@/lib/service-unavailable";

export const dynamic = "force-dynamic";

// Short, rotatable link (boximity.ca/install?t=<token>) to the Free-tier
// Syncro agent installer, sent in the onboarding day-0 confirmation (#642
// decisions 18-21).
//
// The installer lets anyone enroll a device into the RMM, so the link is
// gated: it redirects only for a signed token issued to an onboarding signup
// in the last 7 days (install-link.ts). A bare /install, a tampered token or
// an expired one gets a 403 that points at a person instead. The target comes
// from SYNCRO_FREE_INSTALLER_URL, never from source, and is rotated (env
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

const REJECTED_MESSAGE = formatUnavailableMessage(
  "This installer link has expired or is not valid.",
);

type InstallOutcome = "redirected" | "rejected" | "unavailable";

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

/**
 * The token check, or null when tokens cannot be checked at all because
 * LEAD_MAGNET_SIGNING_SECRET is missing — a deploy misconfiguration.
 */
function tryCheckToken(token: string | null): InstallTokenCheck | null {
  try {
    return checkInstallToken(token);
  } catch {
    return null;
  }
}

/** One line per click, deliberately without IP, user agent or query values. */
function logClick(outcome: InstallOutcome, reason?: InstallTokenCheck): void {
  console.log(
    JSON.stringify({
      event: "install_click",
      outcome,
      ...(reason && { reason }),
    }),
  );
}

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

export function GET(request: Request): Response {
  const token = new URL(request.url).searchParams.get(INSTALL_TOKEN_PARAM);
  const tokenCheck = tryCheckToken(token);

  if (tokenCheck === null) {
    logClick("unavailable");
    Sentry.captureMessage(
      "/install requested but LEAD_MAGNET_SIGNING_SECRET is unset or too short, so install tokens cannot be checked",
      "warning",
    );
    return textResponse(UNAVAILABLE_MESSAGE, 503);
  }

  if (tokenCheck !== "valid") {
    logClick("rejected", tokenCheck);
    return textResponse(REJECTED_MESSAGE, 403);
  }

  const installerUrl = readInstallerUrl();

  if (!installerUrl) {
    logClick("unavailable");
    // The value itself is never logged: it lets anyone enroll a device.
    Sentry.captureMessage(
      "/install requested but SYNCRO_FREE_INSTALLER_URL is unset or not an absolute http(s) URL",
      "warning",
    );
    return textResponse(UNAVAILABLE_MESSAGE, 503);
  }

  logClick("redirected");
  return new Response(null, {
    status: 307,
    headers: { Location: installerUrl, "X-Robots-Tag": "noindex" },
  });
}
