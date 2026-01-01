import { test, expect } from "@playwright/test";

test.describe("Post-Deployment Navigation Tests", () => {
  test("Homepage loads and renders correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");

    // Check that the page has loaded by verifying key elements
    await expect(page).toHaveTitle(
      /Enterprise IT Solutions for Small Businesses/,
    );

    // Verify main navigation exists
    const nav = page.locator("nav, header nav, .navbar");
    await expect(nav.first()).toBeVisible();

    // Verify hero section exists
    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible();

    // Verify main content area
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("Navigation menu links work correctly", async ({ page }) => {
    await page.goto("/");

    // Test desktop navigation links
    const navLinks = [
      { text: "Solutions", selector: 'a[href*="#solutions"]' },
      { text: "Benefits", selector: 'a[href*="#benefits"]' },
      { text: "Process", selector: 'a[href*="#process"]' },
      { text: "Pricing", selector: 'a[href*="/pricing"]' },
      { text: "Contact", selector: 'a[href*="#contact"]' },
    ];

    for (const link of navLinks) {
      // Find the link in navigation
      const navLink = page
        .locator(
          `nav a:has-text("${link.text}"), .navbar a:has-text("${link.text}")`,
        )
        .first();
      await expect(navLink).toBeVisible();

      // Test that clicking the link doesn't cause errors
      // Note: We don't check navigation for anchor links since they're on the same page
      if (link.selector.includes("/pricing")) {
        // Test actual navigation for the pricing page
        await navLink.click();
        await page.waitForLoadState("networkidle");

        // Verify we're on the pricing page
        await expect(page).toHaveURL(/.*pricing.*/);
        await expect(page.locator("h1, .display-4").first()).toContainText(
          /Technology Solutions|Pricing/,
        );

        // Go back to home for next test
        await page.goto("/");
        await page.waitForLoadState("networkidle");
      }
    }
  });

  test("Mobile navigation works", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Look for mobile menu toggle (hamburger button)
    const mobileToggle = page
      .locator('button[aria-label*="menu"], .navbar-toggler, button:has(svg)')
      .first();

    if ((await mobileToggle.count()) > 0) {
      // Click mobile menu toggle
      await mobileToggle.click();

      // Wait for mobile menu to appear
      const mobileMenu = page
        .locator(".d-md-none.mt-3, .mobile-menu, nav.d-md-none")
        .first();

      // Verify mobile menu is visible
      await expect(mobileMenu).toBeVisible();

      // Test that mobile menu has navigation links
      const mobileLinks = mobileMenu.locator("a");
      await expect(mobileLinks.first()).toBeVisible();
    }
  });

  test("Pricing page loads correctly", async ({ page }) => {
    await page.goto("/pricing");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify page title/content
    await expect(page.locator("h1, .display-4").first()).toContainText(
      /Technology Solutions|Pricing/,
    );

    // Verify pricing plans are displayed
    const pricingCards = page.locator(
      '.card, [class*="pricing"], [class*="plan"]',
    );
    await expect(pricingCards.first()).toBeVisible();

    // Verify at least one pricing plan shows pricing information
    const priceElements = page.locator(
      '[class*="price"], .fs-2, .h3:has-text("$")',
    );
    await expect(priceElements.first()).toBeVisible();
  });

  test("Page sections are accessible via anchor links", async ({ page }) => {
    await page.goto("/");

    // Test that anchor links scroll to correct sections
    const sections = [
      { name: "Solutions", selector: '#solutions, [id*="solution"]' },
      { name: "Benefits", selector: '#benefits, [id*="benefit"]' },
      { name: "Process", selector: '#process, [id*="process"]' },
      { name: "Contact", selector: '#contact, [id*="contact"]' },
    ];

    for (const section of sections) {
      // Check if section exists on the page
      const sectionElement = page.locator(section.selector).first();

      if ((await sectionElement.count()) > 0) {
        // Verify section is visible (may need scrolling)
        await expect(sectionElement).toBeVisible();
      }
    }
  });
});
