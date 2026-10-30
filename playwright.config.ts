import { defineConfig, devices } from "@playwright/test";
import { E2E_SDR_LINK_SECRET } from "./e2e/support/sdrTestSecret";

// The discovery-call spec signs links with a fake secret, so it needs a server
// holding that secret. It gets its own, never one already running: another
// server on port 3000 can't change what this spec targets.
const DISCOVERY_CALL_SPEC = /security-assessment-call\.spec\.ts$/;
const DISCOVERY_CALL_PORT = 3717;
const DISCOVERY_CALL_URL = `http://localhost:${DISCOVERY_CALL_PORT}`;
const startsLocalServers = !process.env.CI && !process.env.APP_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["github"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: process.env.APP_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: DISCOVERY_CALL_SPEC,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "discovery-call",
      testMatch: DISCOVERY_CALL_SPEC,
      use: {
        ...devices["Desktop Chrome"],
        ...(startsLocalServers && { baseURL: DISCOVERY_CALL_URL }),
      },
    },
  ],
  webServer: startsLocalServers
    ? [
        {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
        },
        {
          command: `npm run dev -- -p ${DISCOVERY_CALL_PORT}`,
          url: `${DISCOVERY_CALL_URL}/security-assessment/call/present`,
          // Never reused: a server started elsewhere may hold another secret.
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            SDR_LINK_SIGNING_SECRET: E2E_SDR_LINK_SECRET,
            // next dev locks its build directory, so two can't share .next
            NEXT_DIST_DIR: ".next-e2e",
          },
        },
      ]
    : undefined,
});
