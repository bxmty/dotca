import {
  getArticleSchema,
  getBreadcrumbSchema,
  getFAQPageSchema,
  getLocalBusinessSchema,
  getServiceSchema,
} from "@/lib/schema";

const SITE_URL = "https://boximity.ca";

describe("getLocalBusinessSchema", () => {
  it("emits the full LocalBusiness record crawlers read", () => {
    expect(getLocalBusinessSchema()).toEqual({
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
    });
  });
});

describe("getBreadcrumbSchema", () => {
  it("numbers positions from one and absolutises each item URL", () => {
    expect(
      getBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "A Post", url: "/blog/a-post" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${SITE_URL}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "A Post",
          item: `${SITE_URL}/blog/a-post`,
        },
      ],
    });
  });

  it("emits an empty trail rather than omitting itemListElement", () => {
    expect(getBreadcrumbSchema([])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    });
  });
});

describe("getServiceSchema", () => {
  it("emits a Service scoped to Ontario with an absolute URL", () => {
    expect(
      getServiceSchema({
        name: "Managed IT Services Ontario",
        description: "Flat-rate managed IT for small professional firms.",
        url: "/services/managed-it-services-ontario",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Managed IT Services Ontario",
      description: "Flat-rate managed IT for small professional firms.",
      url: `${SITE_URL}/services/managed-it-services-ontario`,
      provider: { "@type": "Organization", name: "Boximity MSP" },
      areaServed: { "@type": "State", name: "Ontario" },
    });
  });
});

describe("getFAQPageSchema", () => {
  it("wraps each pair as a Question with a nested accepted Answer", () => {
    expect(
      getFAQPageSchema([
        { question: "Do you support Macs?", answer: "Yes, and Windows." },
        { question: "Is there a contract?", answer: "Month to month." },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do you support Macs?",
          acceptedAnswer: { "@type": "Answer", text: "Yes, and Windows." },
        },
        {
          "@type": "Question",
          name: "Is there a contract?",
          acceptedAnswer: { "@type": "Answer", text: "Month to month." },
        },
      ],
    });
  });

  it("emits an empty mainEntity rather than omitting it", () => {
    expect(getFAQPageSchema([])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [],
    });
  });
});

describe("getArticleSchema", () => {
  const baseOptions = {
    title: "Why flat-rate IT wins",
    description: "Predictable billing beats hourly firefighting.",
    datePublished: "2026-01-15",
    author: "Matt Mattice",
    url: "/blog/why-flat-rate-it-wins",
  };

  it("emits an Article with an absolute URL and a Person author", () => {
    expect(getArticleSchema(baseOptions)).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Why flat-rate IT wins",
      description: "Predictable billing beats hourly firefighting.",
      datePublished: "2026-01-15",
      dateModified: "2026-01-15",
      author: { "@type": "Person", name: "Matt Mattice" },
      url: `${SITE_URL}/blog/why-flat-rate-it-wins`,
    });
  });

  it("falls back to the publish date when the post was never modified", () => {
    expect(getArticleSchema(baseOptions).dateModified).toBe("2026-01-15");
  });

  it("keeps an explicit modified date", () => {
    expect(
      getArticleSchema({ ...baseOptions, dateModified: "2026-02-20" }),
    ).toMatchObject({
      datePublished: "2026-01-15",
      dateModified: "2026-02-20",
    });
  });

  it("omits image entirely when no cover image exists", () => {
    expect(getArticleSchema(baseOptions)).not.toHaveProperty("image");
  });

  it("includes a cover image verbatim, without prefixing the site URL", () => {
    expect(
      getArticleSchema({
        ...baseOptions,
        image: "https://cdn.example.com/cover.png",
      }),
    ).toMatchObject({ image: "https://cdn.example.com/cover.png" });
  });

  it("omits image when the cover image is an empty string", () => {
    expect(getArticleSchema({ ...baseOptions, image: "" })).not.toHaveProperty(
      "image",
    );
  });
});
