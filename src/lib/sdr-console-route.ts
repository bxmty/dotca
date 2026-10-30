/**
 * The SDR console's address, apart from sdr-link.ts so client components
 * (which can't bundle node:crypto) can name it too.
 */

export const SDR_CONSOLE_PATH = "/security-assessment/call";

/** The query parameter the console reads its token from. */
export const SDR_TOKEN_PARAM = "t";

/** The console and its presenter tab; neither is a public page. */
export function isSdrConsoleRoute(pathname: string): boolean {
  return (
    pathname === SDR_CONSOLE_PATH || pathname.startsWith(`${SDR_CONSOLE_PATH}/`)
  );
}
