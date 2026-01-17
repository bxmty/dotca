import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  BlogPost,
  BlogPostFrontmatter,
  BlogPostSummary,
  BlogConfig,
} from "@/types/blog";

const BLOG_CONFIG: BlogConfig = {
  postsPerPage: 10,
  featuredPostsCount: 3,
  contentPath: path.join(process.cwd(), "content", "blog"),
};

/**
 * Calculate reading time based on word count
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Get all blog post files
 */
function getBlogPostFiles(): string[] {
  try {
    return fs
      .readdirSync(BLOG_CONFIG.contentPath)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => path.join(BLOG_CONFIG.contentPath, file));
  } catch (error) {
    console.warn("Blog content directory not found, returning empty array");
    return [];
  }
}

/**
 * Parse frontmatter and content from MDX file
 */
function parseBlogPost(filePath: string): BlogPost | null {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    // Validate required frontmatter
    if (!data.title || !data.description || !data.date || !data.author) {
      console.warn(`Blog post ${filePath} is missing required frontmatter`);
      return null;
    }

    const slug = path.basename(filePath, ".mdx");
    const readingTime = data.readingTime || calculateReadingTime(content);

    const frontmatter: BlogPostFrontmatter = {
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author,
      tags: data.tags || [],
      published: data.published !== false, // Default to true
      featured: data.featured || false,
      readingTime,
      coverImage: data.coverImage,
      slug,
    };

    return {
      frontmatter,
      content,
      slug,
      filePath,
      readingTime,
    };
  } catch (error) {
    console.error(`Error parsing blog post ${filePath}:`, error);
    return null;
  }
}

/**
 * Get all published blog posts
 */
export function getAllBlogPosts(): BlogPost[] {
  const files = getBlogPostFiles();
  const posts = files
    .map(parseBlogPost)
    .filter(
      (post): post is BlogPost =>
        post !== null && post.frontmatter.published !== false,
    )
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    );

  return posts;
}

/**
 * Get blog post by slug
 */
export function getBlogPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_CONFIG.contentPath, `${slug}.mdx`);
  return parseBlogPost(filePath);
}

/**
 * Get featured blog posts
 */
export function getFeaturedBlogPosts(): BlogPostSummary[] {
  const posts = getAllBlogPosts();
  return posts
    .filter((post) => post.frontmatter.featured)
    .slice(0, BLOG_CONFIG.featuredPostsCount)
    .map((post) => ({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      date: post.frontmatter.date,
      author: post.frontmatter.author,
      tags: post.frontmatter.tags || [],
      slug: post.slug,
      readingTime: post.readingTime,
      coverImage: post.frontmatter.coverImage,
      featured: !!post.frontmatter.featured,
    }));
}

/**
 * Get blog post summaries for listing
 */
export function getBlogPostSummaries(): BlogPostSummary[] {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    date: post.frontmatter.date,
    author: post.frontmatter.author,
    tags: post.frontmatter.tags || [],
    slug: post.slug,
    readingTime: post.readingTime,
    coverImage: post.frontmatter.coverImage,
    featured: !!post.frontmatter.featured,
  }));
}

/**
 * Get blog posts by tag
 */
export function getBlogPostsByTag(tag: string): BlogPostSummary[] {
  const posts = getBlogPostSummaries();
  return posts.filter((post) =>
    post.tags.some((postTag) => postTag.toLowerCase() === tag.toLowerCase()),
  );
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const posts = getAllBlogPosts();
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    if (post.frontmatter.tags) {
      post.frontmatter.tags.forEach((tag) => tagSet.add(tag));
    }
  });

  return Array.from(tagSet).sort();
}

/**
 * Format date for display
 */
export function formatBlogDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get blog config
 */
export function getBlogConfig(): BlogConfig {
  return BLOG_CONFIG;
}
