import { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { getFAQPageSchema, getServiceSchema } from "@/lib/schema";
import ServiceLandingPage from "../ServiceLandingPage";
import { architectureFirmsContent } from "./content";

export const metadata: Metadata = {
  title: "IT Services for Architecture Firms | CAD Software Support | Boximity",
  description:
    "Professional IT services for architecture firms. Specialized managed IT support for architectural practices with 5-15 employees. CAD software management, BIM tools, and Cloud 5 Pack solutions. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "IT services for architecture firms",
    "architectural firm IT support",
    "CAD software IT support",
    "BIM software IT services",
    "architecture firm technology",
    "design firm IT consulting",
    "architectural practice IT services",
    "CAD IT outsourcing",
    "building design IT support",
    "architecture technology solutions",
  ],
  alternates: {
    canonical: "/services/it-services-for-architecture-firms",
  },
  openGraph: {
    url: "/services/it-services-for-architecture-firms",
    title:
      "IT Services for Architecture Firms | CAD Software Support | Boximity",
    description:
      "Professional IT services for architecture firms. Specialized managed IT support for architectural practices with 5-15 employees. CAD software management, BIM tools, and Cloud 5 Pack solutions.",
  },
};

export default function ITForArchitectureFirms() {
  return (
    <>
      <JsonLd
        data={[
          getServiceSchema({
            name: "IT Services for Architecture Firms",
            description:
              "Specialized managed IT services for architecture firms with 5-15 employees: CAD and BIM software support, secure design file management, backup and recovery, Microsoft 365 management, and unlimited help desk support.",
            url: "/services/it-services-for-architecture-firms",
          }),
          getFAQPageSchema(architectureFirmsContent.faq.items),
        ]}
      />
      <ServiceLandingPage content={architectureFirmsContent} />
    </>
  );
}
