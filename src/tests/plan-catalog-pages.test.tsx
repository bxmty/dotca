import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckoutPage from "@/app/checkout/page";
import PricingPage from "@/app/pricing/page";
import { planCatalog } from "@/lib/plan-catalog";

// Pricing and checkout read one plan catalog: a visitor who follows a plan's
// deep link from the pricing sheet sees the same plan, worded the same way,
// at checkout. PlanSelector is real here; only the URL is simulated.

let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}));

// Payment is never reached; Stripe's internals are covered by their own suites
jest.mock("@/app/components/StripeWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/app/components/StripePaymentForm", () => ({
  __esModule: true,
  default: () => null,
}));

const CHECKOUT_PATH = "/checkout";

/** Follows a plan's pricing-sheet link, returning the query it lands with. */
function followPricingLink(cta: string): URLSearchParams {
  const { unmount } = render(<PricingPage />);
  const link = within(screen.getByRole("table")).getByRole("link", {
    name: cta,
  });
  const target = new URL(link.getAttribute("href")!, "http://localhost");
  unmount();
  expect(target.pathname).toBe(CHECKOUT_PATH);
  return target.searchParams;
}

const paidPlans = planCatalog.filter((plan) => plan.name !== "Free");

describe("pricing and checkout share the plan catalog", () => {
  it("covers the three paid plans", () => {
    expect(paidPlans.map((plan) => plan.name)).toEqual([
      "Basic",
      "Standard",
      "Premium",
    ]);
  });

  it.each(paidPlans)(
    "shows the $name plan on checkout as the pricing sheet words it",
    async (plan) => {
      const pricing = render(<PricingPage />);
      const sheet = screen.getByRole("table");
      expect(
        within(sheet).getByRole("columnheader", {
          name: new RegExp(plan.name),
        }),
      ).toBeInTheDocument();
      expect(within(sheet).getByText(plan.description)).toBeInTheDocument();
      pricing.unmount();

      mockSearchParams = followPricingLink(plan.cta);
      render(<CheckoutPage />);

      expect(await screen.findByText(`${plan.name} Plan`)).toBeInTheDocument();
      expect(screen.getByText(plan.description)).toBeInTheDocument();
      for (const feature of plan.features) {
        expect(screen.getByText(feature)).toBeInTheDocument();
      }
    },
  );

  it("uses the pricing-page wording where the copies had drifted", async () => {
    mockSearchParams = followPricingLink("Choose Standard");
    const { unmount } = render(<CheckoutPage />);
    expect(
      await screen.findByText(
        "Our recommended option for growing businesses needing comprehensive IT support",
      ),
    ).toBeInTheDocument();
    unmount();

    mockSearchParams = followPricingLink("Choose Basic");
    render(<CheckoutPage />);
    expect(await screen.findByText("Everything in Free")).toBeInTheDocument();
  });
});
