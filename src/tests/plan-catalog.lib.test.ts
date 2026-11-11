import {
  ANNUAL_DISCOUNT_PERCENT,
  estimatePrice,
  findPlanByName,
  formatPrice,
  getPlanHref,
  planCatalog,
  type Plan,
} from "@/lib/plan-catalog";
import {
  MAX_EMPLOYEE_COUNT,
  MIN_EMPLOYEE_COUNT,
  type BillingCycle,
} from "@/lib/pricing";

function getPlan(name: string): Plan {
  const plan = findPlanByName(name);
  if (!plan) throw new Error(`No ${name} plan in the catalog`);
  return plan;
}

describe("plan catalog", () => {
  it("lists the four plans in pricing-sheet order", () => {
    expect(planCatalog.map((plan) => plan.name)).toEqual([
      "Free",
      "Basic",
      "Standard",
      "Premium",
    ]);
  });

  it("prices each plan per user per month", () => {
    expect(
      planCatalog.map((plan) => formatPrice(plan.monthlyUnitPriceInDollars)),
    ).toEqual(["$0.00", "$99.00", "$249.00", "$449.00"]);
  });

  it("sends Free to onboarding and paid plans to checkout", () => {
    expect(getPlanHref(getPlan("Free"))).toBe("/onboarding");
    expect(getPlanHref(getPlan("Standard"))).toBe("/checkout?plan=Standard");
  });

  it("finds a plan by name whatever the case, or nothing", () => {
    expect(findPlanByName("pReMiUm")?.name).toBe("Premium");
    expect(findPlanByName("enterprise")).toBeNull();
  });
});

describe("formatPrice", () => {
  it("shows dollars with cents and thousands separators", () => {
    expect(formatPrice(0)).toBe("$0.00");
    expect(formatPrice(495)).toBe("$495.00");
    expect(formatPrice(12830.4)).toBe("$12,830.40");
    expect(formatPrice(1234567.891)).toBe("$1,234,567.89");
  });
});

describe("estimatePrice", () => {
  it("multiplies the unit price by employees for a monthly estimate", () => {
    expect(
      estimatePrice({
        plan: getPlan("Basic"),
        employeeCount: 5,
        billingCycle: "monthly",
      }),
    ).toEqual({
      subtotalInDollars: 495,
      discountInDollars: 0,
      totalInDollars: 495,
    });
  });

  it("bills twelve months less the annual discount for an annual estimate", () => {
    expect(ANNUAL_DISCOUNT_PERCENT).toBe(10);

    const estimate = estimatePrice({
      plan: getPlan("Basic"),
      employeeCount: 5,
      billingCycle: "annual",
    });

    expect(estimate.subtotalInDollars).toBe(5940);
    expect(estimate.discountInDollars).toBeCloseTo(594, 6);
    expect(estimate.totalInDollars).toBeCloseTo(5346, 6);
  });

  it("estimates at both employee-count bounds the server accepts", () => {
    const standard = getPlan("Standard");

    expect(
      estimatePrice({
        plan: standard,
        employeeCount: MIN_EMPLOYEE_COUNT,
        billingCycle: "monthly",
      }).totalInDollars,
    ).toBe(1245);
    expect(
      estimatePrice({
        plan: standard,
        employeeCount: MAX_EMPLOYEE_COUNT,
        billingCycle: "monthly",
      }).totalInDollars,
    ).toBe(4980);
  });

  it("estimates nothing for the Free plan", () => {
    expect(
      estimatePrice({
        plan: getPlan("Free"),
        employeeCount: 20,
        billingCycle: "annual",
      }).totalInDollars,
    ).toBe(0);
  });

  // The totals checkout displayed before the estimate moved here, worked by
  // hand: unit price × employees, × 12 × 0.9 when billed annually.
  const DISPLAYED_TOTALS: [string, BillingCycle, number, string][] = [
    ["Basic", "monthly", 5, "$495.00"],
    ["Basic", "monthly", 12, "$1,188.00"],
    ["Basic", "monthly", 20, "$1,980.00"],
    ["Basic", "annual", 5, "$5,346.00"],
    ["Basic", "annual", 12, "$12,830.40"],
    ["Basic", "annual", 20, "$21,384.00"],
    ["Standard", "monthly", 5, "$1,245.00"],
    ["Standard", "monthly", 12, "$2,988.00"],
    ["Standard", "monthly", 20, "$4,980.00"],
    ["Standard", "annual", 5, "$13,446.00"],
    ["Standard", "annual", 12, "$32,270.40"],
    ["Standard", "annual", 20, "$53,784.00"],
    ["Premium", "monthly", 5, "$2,245.00"],
    ["Premium", "monthly", 12, "$5,388.00"],
    ["Premium", "monthly", 20, "$8,980.00"],
    ["Premium", "annual", 5, "$24,246.00"],
    ["Premium", "annual", 12, "$58,190.40"],
    ["Premium", "annual", 20, "$96,984.00"],
  ];

  it.each(DISPLAYED_TOTALS)(
    "displays %s %s for %i employees as %s",
    (planName, billingCycle, employeeCount, displayedTotal) => {
      const { totalInDollars } = estimatePrice({
        plan: getPlan(planName),
        employeeCount,
        billingCycle,
      });

      expect(formatPrice(totalInDollars)).toBe(displayedTotal);
    },
  );
});
