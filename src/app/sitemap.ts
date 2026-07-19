import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import {
  getAllTags,
  getBlogPostsByTag,
  getBlogPostSummaries,
  tagToSlug,
} from "@/lib/blog";

/**
 * Latest date in a list of ISO date strings, or undefined when the list is
 * empty. Pages we can't date honestly omit lastModified entirely rather than
 * stamping the build time - crawlers learn to distrust dates that always
 * change.
 */
function getLatestDate(dates: string[]): Date | undefined {
  if (dates.length === 0) {
    return undefined;
  }
  return new Date(Math.max(...dates.map((date) => new Date(date).getTime())));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://boximity.ca";

  // Published posts only, with real frontmatter dates
  const posts = getBlogPostSummaries();
  const latestPostDate = getLatestDate(posts.map((post) => post.date));

  // Get service pages
  const servicesDir = path.join(process.cwd(), "src/app/services");
  const servicePages = fs
    .readdirSync(servicesDir)
    .filter((dir) => fs.statSync(path.join(servicesDir, dir)).isDirectory());

  const urls: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Main pages
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    // Blog posts with real dates
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // Blog tag archive pages, dated by their newest post
    ...getAllTags().map((tag) => ({
      url: `${baseUrl}/blog/tag/${tagToSlug(tag)}`,
      lastModified: getLatestDate(
        getBlogPostsByTag(tag).map((post) => post.date),
      ),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    // Service pages
    ...servicePages.map((service) => ({
      url: `${baseUrl}/services/${service}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Legal pages
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return urls;
}
