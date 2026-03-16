"use client";

import { usePathname } from "next/navigation";
import JsonLd from "./JsonLd";
import { getBreadcrumbSchema } from "@/lib/schema";

const ROUTE_NAMES: Record<string, string> = {
  "/": "Home",
  "/services": "Services",
  "/services/it-services-for-law-firms": "IT Services for Law Firms",
  "/services/it-services-for-accounting-firms": "IT Services for Accounting Firms",
  "/services/it-services-for-marketing-agencies": "IT Services for Marketing Agencies",
  "/services/it-services-for-architecture-firms": "IT Services for Architecture Firms",
  "/services/managed-it-services-ontario": "Managed IT Services Ontario",
  "/blog": "Blog",
  "/pricing": "Pricing",
  "/onboarding": "Onboarding",
  "/checkout": "Checkout",
  "/privacy-policy": "Privacy Policy",
  "/terms-of-service": "Terms of Service",
};

export default function BreadcrumbSchema() {
  const pathname = usePathname();

  // Skip breadcrumb schema for root path or when pathname is unavailable
  if (!pathname || pathname === "/") {
    return null;
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { name: string; url: string }[] = [{ name: "Home", url: "/" }];

  let currentPath = "";
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const routeName =
      ROUTE_NAMES[currentPath] ??
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    breadcrumbs.push({ name: routeName, url: currentPath });
  }

  // Only render if we have more than just the home breadcrumb
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />;
}