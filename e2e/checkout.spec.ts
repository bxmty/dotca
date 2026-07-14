import { test, expect } from "@playwright/test";

// Light post-deployment checks for the paid checkout + email redundancy work.
// These run against live environments, so they must stay read-only: nothing
// here submits a payment or creates Stripe objects.
test.describe("Paid Checkout Flow", () => {
  test("Checkout renders the purchase flow for a paid plan", async ({
    page,
  }) => {
    await page.goto("/checkout?plan=Basic");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { level: 1, name: "Complete Your Purchase" }),
    ).toBeVisible();

    // Customer information form
    await expect(page.getByLabel("First Name*")).toBeVisible();
    await expect(page.getByLabel("Email Address*")).toBeVisible();

    // Payment is gated behind the continue button; no card form yet
    await expect(page.getByTestId("continue-to-payment")).toBeVisible();
    await expect(
      page.getByText(/Need invoicing or a custom plan\?/),
    ).toBeVisible();

    // The waitlist is gone
    await expect(page.getByText(/waitlist/i)).toHaveCount(0);
  });

  test("Free plan is routed to onboarding instead of checkout", async ({
    page,
  }) => {
    await page.goto("/checkout?plan=Free");

    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("Pricing page routes Free to onboarding and paid plans to checkout", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator('a[href="/onboarding"]', { hasText: "Choose Free" }),
    ).toBeVisible();
    await expect(page.locator('a[href="/checkout?plan=Basic"]')).toBeVisible();
  });

  test("Checkout without a plan shows the no-plan state", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("No Plan Selected")).toBeVisible();
  });

  test("Contact and onboarding forms carry the spam honeypot", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const contactHoneypot = page.locator("#contact-website");
    await expect(contactHoneypot).toHaveCount(1);
    await expect(contactHoneypot).toHaveAttribute("tabindex", "-1");

    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");
    const onboardingHoneypot = page.locator("#onboarding-website");
    await expect(onboardingHoneypot).toHaveCount(1);
    await expect(onboardingHoneypot).toHaveAttribute("tabindex", "-1");
  });

  test("Stripe webhook endpoint is deployed and enforces signatures", async ({
    request,
  }) => {
    // No signature header → 400. A 500 here means STRIPE_WEBHOOK_SECRET
    // arrived empty in this environment (the silent-empty-string failure
    // mode the PRD warns about).
    const response = await request.post("/api/stripe/webhook", {
      data: { probe: true },
    });

    expect(response.status()).toBe(400);
  });

  test("Subscription endpoint is deployed and validates orders", async ({
    request,
  }) => {
    // An unknown plan is rejected before any Stripe call is made
    const response = await request.post("/api/stripe/create-subscription", {
      data: { plan: "not-a-plan", employeeCount: 5, billingCycle: "monthly" },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe("Unknown plan");
  });
});
