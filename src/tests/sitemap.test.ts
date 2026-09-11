import type { MetadataRoute } from "next";
import type { BlogPostSummary } from "@/types/blog";

jest.mock("@/lib/blog", () => ({
  getBlogPostSummaries: jest.fn(),
  getAllTags: jest.fn(),
  getBlogPostsByTag: jest.fn(),
  tagToSlug: jest.fn((tag: string) => tag.toLowerCase().replace(/\s+/g, "-")),
}));

import {
  getAllTags,
  getBlogPostsByTag,
  getBlogPostSummaries,
} from "@/lib/blog";
import sitemap from "@/app/sitemap";

const getBlogPostSummariesMock = getBlogPostSummaries as jest.MockedFunction<
  typeof getBlogPostSummaries
>;
const getAllTagsMock = getAllTags as jest.MockedFunction<typeof getAllTags>;
const getBlogPostsByTagMock = getBlogPostsByTag as jest.MockedFunction<
  typeof getBlogPostsByTag
>;

const BASE_URL = "https://boximity.ca";

function buildSummary(
  overrides: Partial<BlogPostSummary> = {},
): BlogPostSummary {
  return {
    title: "A post",
    description: "About something",
    date: "2026-01-15",
    author: "Matt Mattice",
    tags: ["Security"],
    slug: "a-post",
    readingTime: 4,
    featured: false,
    ...overrides,
  };
}

// Listed explicitly rather than read back off disk: deriving them the way
// sitemap.ts does would compare the sitemap against itself and pass for any
// layout, including one that started leaking fixture directories into the
// crawlable URL set. A new vertical is expected to fail this test until it is
// added here.
const SERVICE_SLUGS = [
  "it-services-for-architecture-firms",
  "managed-it-services-ontario",
];

/** The one entry for a URL, or undefined when the sitemap omits it. */
function findEntry(
  urls: MetadataRoute.Sitemap,
  url: string,
): MetadataRoute.Sitemap[number] | undefined {
  return urls.find((entry) => entry.url === url);
}

beforeEach(() => {
  getBlogPostSummariesMock.mockReturnValue([]);
  getAllTagsMock.mockReturnValue([]);
  getBlogPostsByTagMock.mockReturnValue([]);
});

describe("sitemap", () => {
  it("lists the homepage at top priority", () => {
    expect(findEntry(sitemap(), BASE_URL)).toEqual({
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    });
  });

  it("lists the marketing and legal pages with their crawl cadence", () => {
    const urls = sitemap();

    expect(findEntry(urls, `${BASE_URL}/pricing`)).toEqual({
      url: `${BASE_URL}/pricing`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    expect(findEntry(urls, `${BASE_URL}/privacy-policy`)).toEqual({
      url: `${BASE_URL}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    });
    expect(findEntry(urls, `${BASE_URL}/terms-of-service`)).toEqual({
      url: `${BASE_URL}/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.3,
    });
  });

  it("lists every service landing page, and only those", () => {
    const serviceUrls = sitemap()
      .map((entry) => entry.url)
      .filter((url) => url.startsWith(`${BASE_URL}/services/`));

    expect(serviceUrls).toEqual(
      SERVICE_SLUGS.map((slug) => `${BASE_URL}/services/${slug}`),
    );
  });

  it("gives each service page a monthly crawl cadence", () => {
    const urls = sitemap();

    for (const slug of SERVICE_SLUGS) {
      expect(findEntry(urls, `${BASE_URL}/services/${slug}`)).toEqual({
        url: `${BASE_URL}/services/${slug}`,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  });

  it("does not mistake loose modules in the services folder for pages", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).not.toContain(`${BASE_URL}/services/ServiceLandingPage.tsx`);
    expect(urls).not.toContain(`${BASE_URL}/services/heroImage.ts`);
  });

  it("lists each published post under its own slug, dated by frontmatter", () => {
    getBlogPostSummariesMock.mockReturnValue([
      buildSummary({ slug: "newer", date: "2026-03-01" }),
      buildSummary({ slug: "older", date: "2026-01-15" }),
    ]);

    const urls = sitemap();

    expect(findEntry(urls, `${BASE_URL}/blog/newer`)).toEqual({
      url: `${BASE_URL}/blog/newer`,
      lastModified: new Date("2026-03-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    });
    expect(findEntry(urls, `${BASE_URL}/blog/older`)?.lastModified).toEqual(
      new Date("2026-01-15"),
    );
  });

  it("dates the blog index by its newest post, whatever order they arrive in", () => {
    getBlogPostSummariesMock.mockReturnValue([
      buildSummary({ slug: "older", date: "2026-01-15" }),
      buildSummary({ slug: "newest", date: "2026-05-20" }),
      buildSummary({ slug: "middle", date: "2026-03-01" }),
    ]);

    expect(findEntry(sitemap(), `${BASE_URL}/blog`)).toEqual({
      url: `${BASE_URL}/blog`,
      lastModified: new Date("2026-05-20"),
      changeFrequency: "daily",
      priority: 0.8,
    });
  });

  it("omits a date on the blog index rather than stamping the build time", () => {
    expect(
      findEntry(sitemap(), `${BASE_URL}/blog`)?.lastModified,
    ).toBeUndefined();
  });

  it("lists a tag archive per tag, dated by that tag's newest post", () => {
    getAllTagsMock.mockReturnValue(["Cloud Security", "Backups"]);
    getBlogPostsByTagMock.mockImplementation((tag: string) =>
      tag === "Cloud Security"
        ? [
            buildSummary({ slug: "a", date: "2026-02-10" }),
            buildSummary({ slug: "b", date: "2026-04-05" }),
          ]
        : [buildSummary({ slug: "c", date: "2026-01-02" })],
    );

    const urls = sitemap();

    expect(findEntry(urls, `${BASE_URL}/blog/tag/cloud-security`)).toEqual({
      url: `${BASE_URL}/blog/tag/cloud-security`,
      lastModified: new Date("2026-04-05"),
      changeFrequency: "weekly",
      priority: 0.5,
    });
    expect(
      findEntry(urls, `${BASE_URL}/blog/tag/backups`)?.lastModified,
    ).toEqual(new Date("2026-01-02"));
  });

  it("omits a date on a tag archive that has no dated posts", () => {
    getAllTagsMock.mockReturnValue(["Empty"]);
    getBlogPostsByTagMock.mockReturnValue([]);

    expect(
      findEntry(sitemap(), `${BASE_URL}/blog/tag/empty`)?.lastModified,
    ).toBeUndefined();
  });
});
