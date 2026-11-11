"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { findPlanByName, type Plan } from "@/lib/plan-catalog";

interface PlanSelectorProps {
  onPlanSelected: (plan: Plan | null) => void;
}

/** Reads the `?plan=` deep link and reports the catalog plan it names. */
export default function PlanSelector({ onPlanSelected }: PlanSelectorProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const planName = searchParams?.get("plan");
    onPlanSelected(planName ? findPlanByName(planName) : null);
    setIsLoading(false);
  }, [searchParams, onPlanSelected]);

  return isLoading ? <p>Loading plan details...</p> : null;
}
