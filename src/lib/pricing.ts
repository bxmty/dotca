/**
 * Server-side order validation for checkout.
 *
 * Stripe owns the prices: each paid plan+cycle maps to a lookup key that
 * resolves to a mode-correct recurring Price at runtime (see resolvePriceId
 * in lib/stripe.ts). No amounts and no Price IDs live in this codebase, so
 * the mode of STRIPE_SECRET_KEY alone decides test vs live pricing.
 */

export const BILLING_CYCLES = ["monthly", "annual"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const MIN_EMPLOYEE_COUNT = 5;
export const MAX_EMPLOYEE_COUNT = 20;

// Must match the currency of the Stripe Prices; a mismatch is a hard Stripe
// error at subscription create, never a silent charge in the wrong currency.
export const PAYMENT_CURRENCY = "cad";

// Lookup keys are identical in test and live mode by construction (PRD §3.1).
export const PLAN_CYCLE_LOOKUP_KEY = {
  basic: { monthly: "basic_monthly", annual: "basic_annual" },
  standard: { monthly: "standard_monthly", annual: "standard_annual" },
  premium: { monthly: "premium_monthly", annual: "premium_annual" },
} as const;

export type PaidPlanName = keyof typeof PLAN_CYCLE_LOOKUP_KEY;

export interface ValidatedOrder {
  planName: PaidPlanName;
  employeeCount: number;
  billingCycle: BillingCycle;
  lookupKey: string;
}

export type ValidateOrderResult = { order: ValidatedOrder } | { error: string };

function isPaidPlanName(planName: string): planName is PaidPlanName {
  return planName in PLAN_CYCLE_LOOKUP_KEY;
}

/**
 * Validate raw order input from the client.
 * Returns an error message suitable for showing to the customer.
 */
export function validateOrder(input: {
  plan?: unknown;
  employeeCount?: unknown;
  billingCycle?: unknown;
}): ValidateOrderResult {
  const planName =
    typeof input.plan === "string" ? input.plan.trim().toLowerCase() : "";

  if (planName === "free") {
    return { error: "The selected plan does not require payment" };
  }
  if (!isPaidPlanName(planName)) {
    return { error: "Unknown plan" };
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

  return {
    order: {
      planName,
      employeeCount,
      billingCycle,
      lookupKey: PLAN_CYCLE_LOOKUP_KEY[planName][billingCycle],
    },
  };
}
