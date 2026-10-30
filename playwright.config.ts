import { defineConfig, devices } from "@playwright/test";
import { E2E_SDR_LINK_SECRET } from "./e2e/support/sdrTestSecret";

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
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer:
    process.env.CI || process.env.APP_URL
      ? undefined
      : {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          // Only reaches a server started here: a reused one keeps its own
          // env, and the discovery-call spec skips if it lacks this secret.
          env: { SDR_LINK_SIGNING_SECRET: E2E_SDR_LINK_SECRET },
        },
});
