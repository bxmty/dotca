/**
 * The SDR console's address, apart from sdr-link.ts so client components
 * (which can't bundle node:crypto) can name it too.
 */

export const SDR_CONSOLE_PATH = "/security-assessment/call";

/** The query parameter a link carries its token in. */
export const SDR_TOKEN_PARAM = "t";

/**
 * The httpOnly session cookie holding the SDR's token. src/proxy.ts sets it
 * from a valid link; the console page and call API authenticate from it. Page
 * script never sees the token.
 */
export const SDR_SESSION_COOKIE = "sdr_session";

/** The console and its presenter tab; neither is a public page. */
export function isSdrConsoleRoute(pathname: string): boolean {
  return (
    pathname === SDR_CONSOLE_PATH || pathname.startsWith(`${SDR_CONSOLE_PATH}/`)
  );
}
