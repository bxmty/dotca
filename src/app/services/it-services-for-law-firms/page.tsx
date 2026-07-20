import { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { getFAQPageSchema, getServiceSchema } from "@/lib/schema";
import ServiceLandingPage from "../ServiceLandingPage";
import { lawFirmsContent } from "./content";

export const metadata: Metadata = {
  title: "IT Services for Law Firms | Legal Practice Management IT | Boximity",
  description:
    "Professional IT services for law firms. Specialized managed IT support for legal practices with 5-15 employees. Law firm cybersecurity, document management, and Cloud 5 Pack solutions. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "IT services for law firms",
    "law firm IT support",
    "legal practice management IT",
    "law firm cybersecurity",
    "IT support for lawyers",
    "managed IT for law firms",
    "law firm technology solutions",
    "legal practice IT services",
    "law firm IT consulting",
    "IT outsourcing law firms",
  ],
  alternates: {
    canonical: "/services/it-services-for-law-firms",
  },
  openGraph: {
    url: "/services/it-services-for-law-firms",
    title:
      "IT Services for Law Firms | Legal Practice Management IT | Boximity",
    description:
      "Professional IT services for law firms. Specialized managed IT support for legal practices with 5-15 employees. Law firm cybersecurity, document management, and Cloud 5 Pack solutions.",
  },
};

export default function ITForLawFirms() {
  return (
    <>
      <JsonLd
        data={[
          getServiceSchema({
            name: "IT Services for Law Firms",
            description:
              "Specialized managed IT services for law firms with 5-15 employees: cybersecurity, secure document management, backup and recovery, Microsoft 365 management, and unlimited help desk support.",
            url: "/services/it-services-for-law-firms",
          }),
          getFAQPageSchema(lawFirmsContent.faq.items),
        ]}
      />
      <ServiceLandingPage content={lawFirmsContent} />
    </>
  );
}
