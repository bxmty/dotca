import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

  if (!isProduction) {
    // Block all search engine indexing for non-production environments
    return {
      rules: {
        userAgent: "*",
        allow: [],
        disallow: "/",
      },
      // No sitemap for staging/development
    };
  }

  // Production environment - allow indexing with some restrictions
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
