import { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { getFAQPageSchema, getServiceSchema } from "@/lib/schema";
import ServiceLandingPage from "../ServiceLandingPage";
import { marketingAgenciesContent } from "./content";

export const metadata: Metadata = {
  title:
    "IT Services for Marketing Agencies | Creative Agency Technology | Boximity",
  description:
    "Professional IT services for marketing agencies. Specialized managed IT support for creative agencies with 5-15 employees. Marketing agency cybersecurity, creative file management, and Cloud 5 Pack solutions. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "IT services for marketing agencies",
    "agency IT services",
    "creative agency IT support",
    "marketing agency IT support",
    "marketing agency technology",
    "creative agency technology solutions",
    "marketing agency IT consulting",
    "IT support for creative agencies",
    "marketing firm IT services",
    "agency IT outsourcing",
  ],
  alternates: {
    canonical: "/services/it-services-for-marketing-agencies",
  },
  openGraph: {
    url: "/services/it-services-for-marketing-agencies",
    title:
      "IT Services for Marketing Agencies | Creative Agency Technology | Boximity",
    description:
      "Professional IT services for marketing agencies. Specialized managed IT support for creative agencies with 5-15 employees. Marketing agency cybersecurity, creative file management, and Cloud 5 Pack solutions.",
  },
};

export default function ITForMarketingAgencies() {
  return (
    <>
      <JsonLd
        data={[
          getServiceSchema({
            name: "IT Services for Marketing Agencies",
            description:
              "Specialized managed IT services for marketing agencies with 5-15 employees: cybersecurity, creative file management, design software support, backup and recovery, Microsoft 365 management, and unlimited help desk support.",
            url: "/services/it-services-for-marketing-agencies",
          }),
          getFAQPageSchema(marketingAgenciesContent.faq.items),
        ]}
      />
      <ServiceLandingPage content={marketingAgenciesContent} />
    </>
  );
}
