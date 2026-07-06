/**
 * Server-side pricing for checkout.
 *
 * This is the single source of truth for what a plan costs. The payment API
 * must never trust a client-supplied amount; it derives the charge from the
 * order details validated here.
 */

export const BILLING_CYCLES = ["monthly", "annual"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const MIN_EMPLOYEE_COUNT = 5;
export const MAX_EMPLOYEE_COUNT = 20;
export const ANNUAL_DISCOUNT_MULTIPLIER = 0.9;
export const PAYMENT_CURRENCY = "usd";

// Per-user monthly price in cents, keyed by lowercase plan name.
const PLAN_UNIT_PRICE_CENTS: Record<string, number> = {
  free: 0,
  basic: 9900,
  standard: 24900,
  premium: 44900,
};

export interface PricedOrder {
  planName: string;
  employeeCount: number;
  billingCycle: BillingCycle;
  amountCents: number;
  currency: string;
}

export type PriceOrderResult = { order: PricedOrder } | { error: string };

/**
 * Validate raw order input and compute the amount to charge.
 * Returns an error message suitable for showing to the customer.
 */
export function priceOrder(input: {
  plan?: unknown;
  employeeCount?: unknown;
  billingCycle?: unknown;
}): PriceOrderResult {
  const planName =
    typeof input.plan === "string" ? input.plan.trim().toLowerCase() : "";
  const unitPriceCents = PLAN_UNIT_PRICE_CENTS[planName];

  if (unitPriceCents === undefined) {
    return { error: "Unknown plan" };
  }
  if (unitPriceCents === 0) {
    return { error: "The selected plan does not require payment" };
  }

  const { employeeCount, billingCycle } = input;
  if (
    typeof employeeCount !== "number" ||
    !Number.isInteger(employeeCount) ||
    employeeCount < MIN_EMPLOYEE_COUNT ||
    employeeCount > MAX_EMPLOYEE_COUNT
  ) {
    return {
      error: `Employee count must be a whole number between ${MIN_EMPLOYEE_COUNT} and ${MAX_EMPLOYEE_COUNT}`,
    };
  }

  if (billingCycle !== "monthly" && billingCycle !== "annual") {
    return { error: 'Billing cycle must be "monthly" or "annual"' };
  }

  const monthlyTotalCents = unitPriceCents * employeeCount;
  const amountCents =
    billingCycle === "annual"
      ? Math.round(monthlyTotalCents * 12 * ANNUAL_DISCOUNT_MULTIPLIER)
      : monthlyTotalCents;

  return {
    order: {
      planName,
      employeeCount,
      billingCycle,
      amountCents,
      currency: PAYMENT_CURRENCY,
    },
  };
}
