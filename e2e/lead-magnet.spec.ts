import { test, expect } from "@playwright/test";

// The lead-magnet happy path, end to end: submit an email on
// /resources/[slug] → the download link appears → it serves the PDF.
//
// The e2e suite runs against live environments and must stay read-only, but
// a submission here creates a real Syncro Lead and sends real email. So this
// spec is skipped unless explicitly opted in, and only ever against a
// sandbox or a local dev stack:
//
//   E2E_LEAD_MAGNET_SUBMIT=true E2E_LEAD_MAGNET_SLUG=<published-slug> \
//     npm run test:e2e -- lead-magnet
//
// The route's full behavior (Syncro write, opt-in, failure paths) is covered
// by the jest tests in src/tests/api-lead-magnet.test.ts.
const isSubmitEnabled = process.env.E2E_LEAD_MAGNET_SUBMIT === "true";
const slug = process.env.E2E_LEAD_MAGNET_SLUG ?? "";

test.describe("Lead magnet gate", () => {
  test.skip(
    !isSubmitEnabled || !slug,
    "Creates a real Syncro Lead: set E2E_LEAD_MAGNET_SUBMIT=true and E2E_LEAD_MAGNET_SLUG to run",
  );

  test("submitting an email unlocks a download link that serves the PDF", async ({
    page,
    request,
  }) => {
    await page.goto(`/resources/${slug}`);

    await page.getByLabel("Email").fill("e2e-lead-magnet@example.com");
    await page.locator("form").getByRole("button").click();

    // The gate swaps itself for the "Download <title>" region on success
    const link = page
      .getByRole("region", { name: /^Download / })
      .getByRole("link");
    await expect(link).toBeVisible();

    const href = await link.getAttribute("href");
    expect(href).toMatch(/^\/api\/lead-magnet\/download\?/);

    const download = await request.get(href ?? "");
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toBe("application/pdf");
    expect((await download.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
