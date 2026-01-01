import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/checkout",
        "/checkout/",
        "/onboarding",
        "/onboarding/",
        "/api/",
      ],
    },
    sitemap: "https://boximity.ca/sitemap.xml",
  };
}
