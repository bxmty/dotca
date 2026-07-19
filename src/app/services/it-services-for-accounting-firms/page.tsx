import { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { getFAQPageSchema, getServiceSchema } from "@/lib/schema";
import ServiceLandingPage from "../ServiceLandingPage";
import { accountingFirmsContent } from "./content";

export const metadata: Metadata = {
  title: "IT Services for Accounting Firms | CPA Firm Technology | Boximity",
  description:
    "Professional IT services for accounting firms. Specialized managed IT support for CPA firms with 5-15 employees. Accounting firm cybersecurity, QuickBooks management, and Cloud 5 Pack solutions. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "IT services for accounting firms",
    "accounting firm IT support",
    "managed IT for accountants",
    "CPA firm IT support",
    "accounting firm cybersecurity",
    "IT support for bookkeeping firms",
    "accounting practice technology",
    "CPA firm technology solutions",
    "accounting firm IT consulting",
    "IT outsourcing accounting firms",
  ],
  alternates: {
    canonical: "/services/it-services-for-accounting-firms",
  },
  openGraph: {
    url: "/services/it-services-for-accounting-firms",
    title: "IT Services for Accounting Firms | CPA Firm Technology | Boximity",
    description:
      "Professional IT services for accounting firms. Specialized managed IT support for CPA firms with 5-15 employees. Accounting firm cybersecurity, QuickBooks management, and Cloud 5 Pack solutions.",
  },
};

export default function ITForAccountingFirms() {
  return (
    <>
      <JsonLd
        data={[
          getServiceSchema({
            name: "IT Services for Accounting Firms",
            description:
              "Specialized managed IT services for accounting firms with 5-15 employees: cybersecurity, QuickBooks and tax software support, backup and recovery, Microsoft 365 management, and unlimited help desk support.",
            url: "/services/it-services-for-accounting-firms",
          }),
          getFAQPageSchema(accountingFirmsContent.faq.items),
        ]}
      />
      <ServiceLandingPage content={accountingFirmsContent} />
    </>
  );
}
