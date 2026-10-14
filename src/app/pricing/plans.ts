// Shared pricing plans data. The pricing sheet's table and stacked layouts
// both render from this one array; `highlighted` marks the Recommended plan.
export const pricingPlans = [
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

export type PricingPlan = (typeof pricingPlans)[number];

/** The free plan onboards directly; paid plans go through checkout. */
export function getPlanHref(plan: PricingPlan): string {
  return plan.name === "Free" ? "/onboarding" : `/checkout?plan=${plan.name}`;
}
