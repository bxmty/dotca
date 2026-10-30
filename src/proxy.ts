import { NextResponse, type NextRequest } from "next/server";
import {
  SDR_CONSOLE_PATH,
  SDR_SESSION_COOKIE,
  SDR_TOKEN_PARAM,
} from "@/lib/sdr-console-route";
import { readSdrName } from "@/lib/sdr-session";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "Content-Security-Policy": "default-src 'none'",
};

// Replaced straight away, so the token leaves the address bar without any
// script running at that address. The link is for a browser that ignores the
// refresh.
const HOP_PAGE = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${SDR_CONSOLE_PATH}">
<title>Discovery call console</title>
<p><a href="${SDR_CONSOLE_PATH}">Open the call console</a></p>
</html>
`;

const NOT_FOUND_PAGE = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Page not found</title>
<p>Page not found.</p>
</html>
`;

/**
 * Turns an SDR link into the session cookie, before anything from the app
 * loads: no client script (GA, Sentry) ever runs at an address holding a token.
 * That also goes for a bad link, which answers here rather than from the app's
 * 404 page, because a valid token 404s too while the secret is misconfigured.
 *
 * The hop page, not a redirect, is deliberate. A redirect from a click on
 * another site still counts as cross-site, so the browser withholds the
 * SameSite=Strict cookie it just stored and the console 404s. A navigation made
 * by this same-origin document carries it.
 */
export function proxy(request: NextRequest) {
  const links = request.nextUrl.searchParams.getAll(SDR_TOKEN_PARAM);
  if (links.length === 0) return NextResponse.next();

  const [token] = links;
  if (links.length > 1 || readSdrName(token) === undefined) {
    return new NextResponse(NOT_FOUND_PAGE, {
      status: 404,
      headers: HTML_HEADERS,
    });
  }

  const response = new NextResponse(HOP_PAGE, { headers: HTML_HEADERS });
  response.cookies.set(SDR_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
  });
  return response;
}

// Must be a literal for Next.js to read it; it's SDR_CONSOLE_PATH.
export const config = { matcher: "/security-assessment/call" };
