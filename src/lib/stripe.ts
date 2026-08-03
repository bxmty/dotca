import { loadStripe, Stripe as StripeClient } from "@stripe/stripe-js";
import {
  PLAN_CYCLE_LOOKUP_KEY,
  type BillingCycle,
  type PaidPlanName,
} from "./pricing";

/**
 * Singleton to load Stripe only once (frontend)
 */
let stripePromise: Promise<StripeClient | null>;

/**
 * Get Stripe client instance (frontend)
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error(
        "Stripe publishable key is not set in environment variables",
      );
      // Fallback to a safer error that doesn't crash the UI
      throw new Error("Payment processing is temporarily unavailable");
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

/**
 * Server-side Stripe instance
 * We use a dynamic import to avoid type errors when stripe module is not available
 */
export const getServerStripe = async () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }

  // Dynamic import to avoid type errors
  const { default: Stripe } = await import("stripe");
  return new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  });
};

/**
 * Thrown when a lookup key resolves to no active Price — meaning the §3.1
 * catalog was never created in whichever mode STRIPE_SECRET_KEY points at.
 */
export class MissingStripePriceError extends Error {
  constructor(lookupKey: string) {
    super(
      `No active Stripe Price found for lookup key "${lookupKey}". ` +
        "The product catalog has not been created in the mode " +
        "(test/live) that STRIPE_SECRET_KEY points at.",
    );
    this.name = "MissingStripePriceError";
  }
}

// Prices effectively never change, so resolved IDs are cached for the life
// of the container: one extra Stripe call per cold start, not per checkout.
const priceIdByLookupKey = new Map<string, Promise<string>>();

async function fetchPriceIdByLookupKey(lookupKey: string): Promise<string> {
  const stripe = await getServerStripe();
  const { data } = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (data.length === 0) {
    throw new MissingStripePriceError(lookupKey);
  }
  return data[0].id;
}

/**
 * Resolve a plan + billing cycle to the mode-correct Stripe Price ID.
 */
export function resolvePriceId({
  plan,
  cycle,
}: {
  plan: PaidPlanName;
  cycle: BillingCycle;
}): Promise<string> {
  const lookupKey = PLAN_CYCLE_LOOKUP_KEY[plan][cycle];
  let pending = priceIdByLookupKey.get(lookupKey);
  if (!pending) {
    pending = fetchPriceIdByLookupKey(lookupKey);
    // Drop failures so a transient Stripe error doesn't poison the cache
    pending.catch(() => priceIdByLookupKey.delete(lookupKey));
    priceIdByLookupKey.set(lookupKey, pending);
  }
  return pending;
}
