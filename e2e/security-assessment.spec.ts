import { test, expect } from "@playwright/test";

/**
 * Full security-assessment journey against the local dev server. The capture
 * POST is stubbed so the spec never depends on Syncro or Resend.
 */
test.describe("Security assessment", () => {
  test("landing through results, then optional capture", async ({ page }) => {
    await page.route("**/api/security-assessment", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/security-assessment");

    await page
      .getByRole("button", { name: /Start the assessment/i })
      .click();
    await page.getByRole("button", { name: /^Continue$/i }).click();

    const soloQuestionCount = 6;
    for (let questionNumber = 0; questionNumber < soloQuestionCount; questionNumber++) {
      await expect(
        page.getByText(`Question ${questionNumber + 1} of ${soloQuestionCount}`),
      ).toBeVisible();
      await page.locator('input[type="radio"]').first().click();
    }

    await expect(page.getByText(/Score \d+ \/ \d+/)).toBeVisible();
    const tierHeadline = page.getByRole("heading", { level: 1 });
    await expect(tierHeadline).toBeVisible();
    await expect(tierHeadline).not.toHaveText(/How exposed is your business/i);

    const captureForm = page.getByRole("form", {
      name: "Email assessment results",
    });
    await captureForm
      .getByRole("textbox", { name: "Email" })
      .fill("e2e-security-assessment@example.com");
    await captureForm
      .getByRole("button", { name: /Send my results/i })
      .click();

    await expect(page.getByText(/Check your inbox/i)).toBeVisible();
  });
});
