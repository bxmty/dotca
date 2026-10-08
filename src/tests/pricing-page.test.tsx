import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import PricingPage from "@/app/pricing/page";
import { pricingPlans } from "@/app/pricing/plans";

// The pricing sheet renders twice from one pricingPlans source: a ruled table
// from 900 px and stacked blocks below it (CSS hides the other).

// The self-serve targets as they were before the restyle; they must not move.
const EXPECTED_HREFS: Record<string, string> = {
  Free: "/onboarding",
  Basic: "/checkout?plan=Basic",
  Standard: "/checkout?plan=Standard",
  Premium: "/checkout?plan=Premium",
};

function getSheet() {
  return screen.getByRole("table");
}

function getStackedBlocks() {
  return screen.getAllByTestId("plan-block");
}

describe("PricingPage", () => {
  it("renders the hero heading", () => {
    render(<PricingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Technology Solutions That Fit Your Budget",
      }),
    ).toBeInTheDocument();
  });

  it("renders one table column per plan", () => {
    render(<PricingPage />);

    const columnHeaders = within(getSheet())
      .getAllByRole("columnheader")
      .slice(1);
    expect(columnHeaders).toHaveLength(pricingPlans.length);
    pricingPlans.forEach((plan, index) => {
      expect(columnHeaders[index]).toHaveTextContent(plan.name);
    });
  });

  it("renders one stacked block per plan", () => {
    render(<PricingPage />);

    const blocks = getStackedBlocks();
    expect(blocks).toHaveLength(pricingPlans.length);
    pricingPlans.forEach((plan, index) => {
      expect(
        within(blocks[index]).getByRole("heading", { level: 3 }),
      ).toHaveTextContent(plan.name);
    });
  });

  it("keeps every plan's CTA href in both layouts", () => {
    render(<PricingPage />);

    expect(pricingPlans.map((plan) => plan.name)).toEqual(
      Object.keys(EXPECTED_HREFS),
    );
    for (const layout of [getSheet(), ...getStackedBlocks()]) {
      for (const link of within(layout).getAllByRole("link")) {
        const planName = link.textContent?.replace("Choose ", "") ?? "";
        expect(link).toHaveAttribute("href", EXPECTED_HREFS[planName]);
      }
    }
    for (const plan of pricingPlans) {
      expect(screen.getAllByRole("link", { name: plan.cta })).toHaveLength(2);
    }
  });

  it("makes only the recommended plan's button primary", () => {
    render(<PricingPage />);

    for (const plan of pricingPlans) {
      for (const link of screen.getAllByRole("link", { name: plan.cta })) {
        if (plan.highlighted) {
          expect(link).toHaveClass("bg-cta");
        } else {
          expect(link).not.toHaveClass("bg-cta");
        }
      }
    }
  });

  it("sizes the sheet's buttons compact so four plans fit at 900 px", () => {
    render(<PricingPage />);

    for (const link of within(getSheet()).getAllByRole("link")) {
      expect(link).toHaveClass("text-small", "p-3");
    }
    for (const block of getStackedBlocks()) {
      expect(within(block).getByRole("link")).toHaveClass("text-body");
    }
  });

  it("islands the recommended column but not its action row", () => {
    render(<PricingPage />);

    const sheet = getSheet();
    const recommendedIndex = pricingPlans.findIndex((plan) => plan.highlighted);
    const rows = within(sheet).getAllByRole("row");
    const actionRow = rows[rows.length - 1];

    for (const row of rows) {
      const planCells = Array.from(row.children).slice(1);
      planCells.forEach((cell, index) => {
        const isIsland = index === recommendedIndex && row !== actionRow;
        expect(cell.classList.contains("hl")).toBe(isIsland);
      });
    }
    expect(
      within(rows[0].children[recommendedIndex + 1] as HTMLElement).getByText(
        "Recommended",
      ),
    ).toBeInTheDocument();
  });

  it("islands the recommended stacked block above its button", () => {
    render(<PricingPage />);

    getStackedBlocks().forEach((block, index) => {
      const island = block.querySelector(".hl");
      if (pricingPlans[index].highlighted) {
        expect(island).not.toBeNull();
        expect(within(island as HTMLElement).queryByRole("link")).toBeNull();
        expect(island).toHaveTextContent("Recommended");
      } else {
        expect(island).toBeNull();
      }
    });
  });

  it("renders each plan's price, description and features", () => {
    render(<PricingPage />);

    const sheet = getSheet();
    for (const plan of pricingPlans) {
      expect(within(sheet).getByText(plan.price)).toHaveClass("text-h2");
      expect(within(sheet).getByText(plan.description)).toBeInTheDocument();
      for (const feature of plan.features) {
        expect(within(sheet).getAllByText(feature).length).toBeGreaterThan(0);
      }
    }
  });

  it("renders the FAQ as independent closed <details>", () => {
    const { container } = render(<PricingPage />);

    expect(
      screen.getByRole("heading", { name: "Frequently Asked Questions" }),
    ).toBeInTheDocument();
    const items = container.querySelectorAll("details");
    expect(items).toHaveLength(4);
    items.forEach((item) => {
      expect(item).not.toHaveAttribute("open");
      expect(item).not.toHaveAttribute("name");
    });
    expect(
      screen.getByText("What's included in the Password Manager?"),
    ).toBeInTheDocument();
  });

  it("leaves the structured data unchanged: no FAQPage JSON-LD", () => {
    // /pricing has never emitted FAQPage JSON-LD; the restyle keeps it so.
    const { container } = render(<PricingPage />);

    expect(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(0);
  });

  it("renders the closing CTA", () => {
    render(<PricingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Ready to Transform Your Business Technology?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Get a Business-First IT Assessment" }),
    ).toHaveAttribute("href", "/#contact");
  });
});
