import { test, expect } from "@playwright/test";

/**
 * Full security-assessment journey against the local dev server. The lead
 * POST is stubbed so the spec never depends on Syncro or Resend.
 */
test.describe("Security assessment", () => {
  test("landing, size, required details, questions, then delivered results", async ({
    page,
  }) => {
    const leadRequests: unknown[] = [];
    await page.route("**/api/security-assessment", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      leadRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/security-assessment");

    await page.getByRole("button", { name: /Start the assessment/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();

    // The gate is hard: an empty submit stays on the details form
    const detailsForm = page.getByRole("form", { name: "Your details" });
    await detailsForm
      .getByRole("button", { name: /Start the questions/i })
      .click();
    await expect(page.getByText("enter your name")).toBeVisible();
    await expect(page.getByText(/Question 1 of/)).toHaveCount(0);

    await detailsForm.getByRole("textbox", { name: "Name" }).fill("E2E Tester");
    await detailsForm
      .getByRole("textbox", { name: "Email" })
      .fill("e2e-security-assessment@example.com");
    await detailsForm
      .getByRole("textbox", { name: "Company" })
      .fill("E2E Accounting");
    await detailsForm
      .getByRole("button", { name: /Start the questions/i })
      .click();

    const soloQuestionCount = 6;
    for (
      let questionNumber = 0;
      questionNumber < soloQuestionCount;
      questionNumber++
    ) {
      await expect(
        page.getByText(
          `Question ${questionNumber + 1} of ${soloQuestionCount}`,
        ),
      ).toBeVisible();
      await page.locator('input[type="radio"]').first().click();
    }

    await expect(page.getByText(/Score \d+ \/ \d+/)).toBeVisible();
    const tierHeadline = page.getByRole("heading", { level: 1 });
    await expect(tierHeadline).toBeVisible();
    await expect(tierHeadline).not.toHaveText(/How exposed is your business/i);

    await expect(
      page.getByText(/follow up at e2e-security-assessment@example.com/i),
    ).toBeVisible();
    expect(leadRequests).toHaveLength(1);
    expect(leadRequests[0]).toMatchObject({
      name: "E2E Tester",
      email: "e2e-security-assessment@example.com",
      company: "E2E Accounting",
      segment: "solo",
    });
  });
});
