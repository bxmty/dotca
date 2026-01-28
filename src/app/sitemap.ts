import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://boximity.ca";

  // Get blog posts with their actual dates from frontmatter
  const blogDir = path.join(process.cwd(), "content/blog");
  const blogPosts = fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const filePath = path.join(blogDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const { data } = matter(content);
      return {
        slug: file.replace(".mdx", ""),
        date: new Date(data.date),
        published: data.published !== false, // Default to true if not specified
      };
    })
    .filter((post) => post.published); // Only include published posts

  // Get service pages
  const servicesDir = path.join(process.cwd(), "src/app/services");
  const servicePages = fs
    .readdirSync(servicesDir)
    .filter((dir) => fs.statSync(path.join(servicesDir, dir)).isDirectory());

  const urls: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // Main pages
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    // Blog posts with real dates
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // Service pages
    ...servicePages.map((service) => ({
      url: `${baseUrl}/services/${service}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Legal pages
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return urls;
}
