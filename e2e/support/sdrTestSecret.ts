/**
 * Signs the discovery-call spec's SDR link, and is what playwright.config.ts
 * gives the dev server it starts. Not a real secret: nothing deployed uses it.
 */
export const E2E_SDR_LINK_SECRET =
  "e2e-only-fake-sdr-link-secret-not-a-real-key";
