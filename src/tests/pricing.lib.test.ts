import {
  validateOrder,
  MIN_EMPLOYEE_COUNT,
  MAX_EMPLOYEE_COUNT,
  PAYMENT_CURRENCY,
  PLAN_CYCLE_LOOKUP_KEY,
} from "@/lib/pricing";

describe("validateOrder", () => {
  it("resolves a monthly order to its lookup key", () => {
    const result = validateOrder({
      plan: "Basic",
      employeeCount: 5,
      billingCycle: "monthly",
    });

    expect(result).toEqual({
      order: {
        planName: "basic",
        employeeCount: 5,
        billingCycle: "monthly",
        lookupKey: "basic_monthly",
      },
    });
  });

  it("resolves an annual order to its lookup key", () => {
    const result = validateOrder({
      plan: "Standard",
      employeeCount: 10,
      billingCycle: "annual",
    });

    expect(result).toEqual(
      expect.objectContaining({
        order: expect.objectContaining({ lookupKey: "standard_annual" }),
      }),
    );
  });

  it("normalizes plan name case and whitespace", () => {
    const result = validateOrder({
      plan: "  PREMIUM ",
      employeeCount: 20,
      billingCycle: "monthly",
    });

    expect(result).toEqual(
      expect.objectContaining({
        order: expect.objectContaining({
          planName: "premium",
          lookupKey: "premium_monthly",
        }),
      }),
    );
  });

  it("rejects unknown plans", () => {
    expect(
      validateOrder({
        plan: "gold",
        employeeCount: 5,
        billingCycle: "monthly",
      }),
    ).toEqual({ error: "Unknown plan" });
  });

  it("rejects non-string plans", () => {
    expect(
      validateOrder({ plan: 42, employeeCount: 5, billingCycle: "monthly" }),
    ).toEqual({ error: "Unknown plan" });
  });

  it("rejects the free plan as not payable", () => {
    expect(
      validateOrder({
        plan: "free",
        employeeCount: 5,
        billingCycle: "monthly",
      }),
    ).toEqual({ error: "The selected plan does not require payment" });
  });

  it.each([
    MIN_EMPLOYEE_COUNT - 1,
    MAX_EMPLOYEE_COUNT + 1,
    7.5,
    NaN,
    "10",
    null,
  ])("rejects employee count %p", (employeeCount) => {
    const result = validateOrder({
      plan: "basic",
      employeeCount,
      billingCycle: "monthly",
    });

    expect(result).toHaveProperty("error");
  });

  it("rejects billing cycles other than monthly and annual", () => {
    const result = validateOrder({
      plan: "basic",
      employeeCount: 5,
      billingCycle: "weekly",
    });

    expect(result).toEqual({
      error: 'Billing cycle must be "monthly" or "annual"',
    });
  });

  it("charges in CAD, matching the currency of the Stripe Prices", () => {
    expect(PAYMENT_CURRENCY).toBe("cad");
  });

  it("defines a lookup key for every paid plan and cycle", () => {
    for (const cycles of Object.values(PLAN_CYCLE_LOOKUP_KEY)) {
      expect(cycles.monthly).toMatch(/_monthly$/);
      expect(cycles.annual).toMatch(/_annual$/);
    }
  });
});
