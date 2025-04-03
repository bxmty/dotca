'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
}

interface PlanSelectorProps {
  pricingPlans: PricingPlan[];
  onPlanSelected: (plan: PricingPlan | null) => void;
}

export default function PlanSelector({ pricingPlans, onPlanSelected }: PlanSelectorProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const planName = searchParams?.get('plan');
    if (planName) {
      const plan = pricingPlans.find(p => p.name.toLowerCase() === planName.toLowerCase());
      if (plan) {
        onPlanSelected(plan);
      } else {
        onPlanSelected(null);
      }
    } else {
      onPlanSelected(null);
    }
    setLoading(false);
  }, [searchParams, pricingPlans, onPlanSelected]);

  return loading ? <p>Loading plan details...</p> : null;
}