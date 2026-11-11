/**
 * The plan catalog: the one list of plans the site sells. The pricing sheet
 * and checkout both render from it, so a visitor reads the same names,
 * descriptions, features and prices on both pages.
 */

export interface Plan {
  name: string;
  /** Display price per user per month. */
  price: string;
  description: string;
  features: readonly string[];
  cta: string;
  /** Marks the Recommended plan on the pricing sheet. */
  highlighted?: boolean;
}

export const planCatalog: readonly Plan[] = [
  {
    name: "Free",
    price: "$0.00",
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
    price: "$99.00",
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
    price: "$249.00",
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
    highlighted: true,
    cta: "Choose Standard",
  },
  {
    name: "Premium",
    price: "$449.00",
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
