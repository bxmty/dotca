import { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { getFAQPageSchema, getServiceSchema } from "@/lib/schema";
import ServiceLandingPage from "../ServiceLandingPage";
import { ontarioContent } from "./content";

export const metadata: Metadata = {
  title: "Managed IT Services Ontario | Professional IT Support | Boximity",
  description:
    "Expert managed IT services for Ontario businesses. Cloud 5 Pack includes 24/7 monitoring, cybersecurity, cloud backup, and Microsoft 365 management. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "managed IT services Ontario",
    "IT support Ontario",
    "managed service provider Ontario",
    "MSP Ontario",
    "IT services Ontario",
    "cloud IT services Ontario",
    "business IT support Ontario",
    "Ontario IT managed services",
    "professional IT services Ontario",
    "IT outsourcing Ontario",
  ],
  alternates: {
    canonical: "/services/managed-it-services-ontario",
  },
  openGraph: {
    url: "/services/managed-it-services-ontario",
    title: "Managed IT Services Ontario | Professional IT Support | Boximity",
    description:
      "Expert managed IT services for Ontario businesses. Cloud 5 Pack includes 24/7 monitoring, cybersecurity, cloud backup, and Microsoft 365 management.",
  },
};

export default function ManagedITServicesOntario() {
  return (
    <>
      <JsonLd
        data={[
          getServiceSchema({
            name: "Managed IT Services Ontario",
            description:
              "Managed IT services for Ontario businesses: 24/7 proactive monitoring, advanced cybersecurity, cloud backup and recovery, Microsoft 365 management, and unlimited help desk support.",
            url: "/services/managed-it-services-ontario",
          }),
          getFAQPageSchema(ontarioContent.faq.items),
        ]}
      />
      <ServiceLandingPage content={ontarioContent} />
    </>
  );
}
