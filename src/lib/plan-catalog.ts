/**
 * The plan catalog: the one list of plans the site sells. The pricing sheet
 * and checkout both render from it, so a visitor reads the same names,
 * descriptions, features and prices on both pages.
 *
 * Prices here are display prices. They feed the pricing sheet and the
 * checkout estimate only; the amount actually charged comes from the Stripe
 * Price resolved server-side (see lib/pricing.ts), never from this file.
 */

import type { BillingCycle } from "./pricing";

export interface Plan {
  name: string;
  /** Display price per user per month, in dollars. */
  monthlyUnitPriceInDollars: number;
  description: string;
  features: readonly string[];
  cta: string;
  /** Marks the Recommended plan on the pricing sheet. */
  isRecommended?: boolean;
}

export const planCatalog: readonly Plan[] = [
  {
    name: "Free",
    monthlyUnitPriceInDollars: 0,
    description:
      "Ideal for startups and freelancers looking to secure their digital assets",
    features: [
      "Automatic Windows Updates",
      "Basic Antivirus Protection",
      "24/7 Device Monitoring",
    ],
    cta: "Choose Free",
  },
  {
    name: "Basic",
    monthlyUnitPriceInDollars: 99,
    description:
      "Perfect for small teams needing essential IT security and communication tools",
    features: [
      "Everything in Free",
      "Password Manager",
      "Business Email Solution",
      "Email Support (Business Hours)",
      "Basic Security Monitoring",
      "Setup & Onboarding Assistance",
    ],
    cta: "Choose Basic",
  },
  {
    name: "Standard",
    monthlyUnitPriceInDollars: 249,
    description:
      "Our recommended option for growing businesses needing comprehensive IT support",
    features: [
      "Everything in Basic",
      "Professional Web Hosting",
      "Microsoft Collaboration Tools",
      "Quarterly IT Assessment",
      "Extended Technical Support",
      "Cloud Backup Solutions",
      "30-day email & phone support",
    ],
    isRecommended: true,
    cta: "Choose Standard",
  },
  {
    name: "Premium",
    monthlyUnitPriceInDollars: 449,
    description:
      "Complete IT management solution for businesses requiring enterprise-grade technology",
    features: [
      "Everything in Standard",
      "24/7 Priority Support",
      "Server Monitoring & Management",
      "Reduced Web Design Rates",
      "Advanced Security Suite",
      "Dedicated Account Manager",
      "On-site Consultations",
      "Unlimited Device Support",
    ],
    cta: "Choose Premium",
  },
];

/** The Free plan takes no payment, so it never goes through checkout. */
export function isFreePlan(plan: Plan): boolean {
  return plan.name === "Free";
}

/** The free plan onboards directly; paid plans go through checkout. */
export function getPlanHref(plan: Plan): string {
  return isFreePlan(plan) ? "/onboarding" : `/checkout?plan=${plan.name}`;
}

/** Resolves a plan deep link's `plan` value, ignoring case. */
export function findPlanByName(name: string): Plan | null {
  const wanted = name.toLowerCase();
  return planCatalog.find((plan) => plan.name.toLowerCase() === wanted) ?? null;
}

/** Whole-percent discount shown for paying a year up front. */
export const ANNUAL_DISCOUNT_PERCENT = 10;

const MONTHS_PER_YEAR = 12;

/** Formats a dollar amount for display, e.g. `$12,830.40`. */
export function formatPrice(amountInDollars: number): string {
  return `$${amountInDollars.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** Amounts for one billing period, before tax. */
export interface PriceEstimate {
  subtotalInDollars: number;
  discountInDollars: number;
  totalInDollars: number;
}

/**
 * Estimates what checkout displays for a plan, employee count and billing
 * cycle. Display only: Stripe computes the amount actually charged.
 */
export function estimatePrice({
  plan,
  employeeCount,
  billingCycle,
}: {
  plan: Plan;
  employeeCount: number;
  billingCycle: BillingCycle;
}): PriceEstimate {
  const monthlyTotalInDollars = plan.monthlyUnitPriceInDollars * employeeCount;
  if (billingCycle === "monthly") {
    return {
      subtotalInDollars: monthlyTotalInDollars,
      discountInDollars: 0,
      totalInDollars: monthlyTotalInDollars,
    };
  }
  const subtotalInDollars = monthlyTotalInDollars * MONTHS_PER_YEAR;
  const discountInDollars = subtotalInDollars * (ANNUAL_DISCOUNT_PERCENT / 100);
  return {
    subtotalInDollars,
    discountInDollars,
    totalInDollars: subtotalInDollars - discountInDollars,
  };
}
