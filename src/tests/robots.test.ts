import robots from "@/app/robots";

const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;

afterEach(() => {
  process.env.NEXT_PUBLIC_ENVIRONMENT = originalEnvironment;
});

describe("robots.txt", () => {
  it("blocks every crawler outside production, and advertises no sitemap", () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";

    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: [], disallow: "/" },
    });
  });

  it("blocks crawlers when the environment is unset, failing closed", () => {
    delete process.env.NEXT_PUBLIC_ENVIRONMENT;

    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: [], disallow: "/" },
    });
  });

  it("allows crawling in production while hiding the funnel and the API", () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "production";

    expect(robots()).toEqual({
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
    });
  });

  // robots.txt is public: a Disallow line would announce the intake route to
  // anyone who reads it, and would stop a crawler from ever seeing the page's
  // own noindex. The page keeps itself out of indexes instead (#565).
  it("never names the service request intake", () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "production";

    expect(JSON.stringify(robots())).not.toContain("service-request");
  });
});
