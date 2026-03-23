const SITE_URL = "https://boximity.ca";

export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Boximity MSP",
    description:
      "Managed IT for Ontario professional services firms (5–10 users). Enterprise-grade security, Law Society & PIPEDA compliance.",
    url: SITE_URL,
    telephone: "(289) 539-0098",
    email: "hi@boximity.ca",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    areaServed: [
      { "@type": "State", name: "Ontario" },
      { "@type": "City", name: "Toronto" },
      { "@type": "City", name: "Ottawa" },
      { "@type": "City", name: "Hamilton" },
      { "@type": "City", name: "Kitchener-Waterloo" },
    ],
    openingHours: "Mo-Fr 09:00-17:00",
    priceRange: "$$",
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function getServiceSchema(options: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: options.name,
    description: options.description,
    url: `${SITE_URL}${options.url}`,
    provider: { "@type": "Organization", name: "Boximity MSP" },
    areaServed: { "@type": "State", name: "Ontario" },
  };
}

export function getFAQPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getArticleSchema(options: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    author: { "@type": "Person", name: options.author },
    url: `${SITE_URL}${options.url}`,
    ...(options.image && { image: options.image }),
  };
}
