import { loadStripe, Stripe as StripeClient } from "@stripe/stripe-js";

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
    apiVersion: "2026-01-28.clover",
  });
};
