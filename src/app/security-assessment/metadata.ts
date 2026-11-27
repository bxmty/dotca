import { Metadata } from "next";
import { loadQuizConfig } from "@/lib/security-assessment";

const config = loadQuizConfig();

export const metadata: Metadata = {
  title: "Free Cybersecurity Assessment for Small Business",
  description:
    "Find out how exposed your business is in about 3 minutes. A free, plain-language cybersecurity self-assessment for solopreneurs and small businesses, with a personalized risk profile.",
  alternates: {
    canonical: "/security-assessment",
  },
  openGraph: {
    url: "/security-assessment",
    title: `${config.landing.title} | Boximity MSP`,
    description: config.landing.intro,
    type: "website",
  },
};
