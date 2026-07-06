import {
  priceOrder,
  MIN_EMPLOYEE_COUNT,
  MAX_EMPLOYEE_COUNT,
  PAYMENT_CURRENCY,
} from "@/lib/pricing";

describe("priceOrder", () => {
  it("prices a monthly order as unit price times employee count", () => {
    const result = priceOrder({
      plan: "Basic",
      employeeCount: 5,
      billingCycle: "monthly",
    });

    expect(result).toEqual({
      order: {
        planName: "basic",
        employeeCount: 5,
        billingCycle: "monthly",
        amountCents: 49500,
        currency: PAYMENT_CURRENCY,
      },
    });
  });

  it("prices an annual order with the 10% discount over 12 months", () => {
    const result = priceOrder({
      plan: "Standard",
      employeeCount: 10,
      billingCycle: "annual",
    });

    // 24900 * 10 * 12 * 0.9
    expect(result).toEqual(
      expect.objectContaining({
        order: expect.objectContaining({ amountCents: 2689200 }),
      }),
    );
  });

  it("normalizes plan name case and whitespace", () => {
    const result = priceOrder({
      plan: "  PREMIUM ",
      employeeCount: 20,
      billingCycle: "monthly",
    });

    expect(result).toEqual(
      expect.objectContaining({
        order: expect.objectContaining({
          planName: "premium",
          amountCents: 44900 * 20,
        }),
      }),
    );
  });

  it("rejects unknown plans", () => {
    expect(
      priceOrder({ plan: "gold", employeeCount: 5, billingCycle: "monthly" }),
    ).toEqual({ error: "Unknown plan" });
  });

  it("rejects non-string plans", () => {
    expect(
      priceOrder({ plan: 42, employeeCount: 5, billingCycle: "monthly" }),
    ).toEqual({ error: "Unknown plan" });
  });

  it("rejects the free plan as not payable", () => {
    expect(
      priceOrder({ plan: "free", employeeCount: 5, billingCycle: "monthly" }),
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
    const result = priceOrder({
      plan: "basic",
      employeeCount,
      billingCycle: "monthly",
    });

    expect(result).toHaveProperty("error");
  });

  it("rejects billing cycles other than monthly and annual", () => {
    const result = priceOrder({
      plan: "basic",
      employeeCount: 5,
      billingCycle: "weekly",
    });

    expect(result).toEqual({
      error: 'Billing cycle must be "monthly" or "annual"',
    });
  });
});
