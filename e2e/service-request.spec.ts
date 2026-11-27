import { test, expect } from "@playwright/test";

// Matches no client: real intake tokens are random, this one is words.
const UNKNOWN_TOKEN = "e2e-unknown-token-that-matches-no-client";

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"];

// Read-only: loading the page files nothing. The form is never submitted from
// here, because a submission would open a real Syncro ticket.
test.describe("Service request intake @read-only", () => {
  test("an unknown token gets a 404 and no form", async ({ page, baseURL }) => {
    const response = await page.goto(`/service-request/${UNKNOWN_TOKEN}`);
    const status = response?.status();

    // A deployed environment holds the Syncro secrets (the deploy gate
    // requires them), so the token is looked up and must come back unknown.
    // A local server usually has none, and then no token can be checked: the
    // page says so instead, for every token alike.
    const isLocalServer = LOCAL_HOSTNAMES.includes(
      new URL(baseURL ?? "").hostname,
    );
    const isUnchecked = isLocalServer && status !== 404;

    if (isUnchecked) {
      expect(status).toBe(200);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "This form is temporarily unavailable",
        }),
      ).toBeVisible();
    } else {
      expect(status).toBe(404);
      await expect(
        page.getByRole("heading", { level: 1, name: "Page not found" }),
      ).toBeVisible();
    }

    // Either way, nothing to fill in or submit
    await expect(page.locator("main form")).toHaveCount(0);
    await expect(page.getByText("Someone is joining")).toHaveCount(0);
  });
});
