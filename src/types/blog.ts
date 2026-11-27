export type BlogPostCta =
  | { type: "assessment" }
  | { type: "lead-magnet"; slug: string }
  | { type: "none" };

/**
 * A post's cta resolved for rendering: a lead-magnet cta carries the
 * magnet's title and button label, looked up server-side, so the CTA
 * components stay free of filesystem access.
 */
export type BlogOffer =
  | { type: "assessment" }
  | { type: "lead-magnet"; slug: string; title: string; assetLabel?: string }
  | { type: "none" };

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  tags?: string[];
  published?: boolean;
  featured?: boolean;
  readingTime?: number;
  coverImage?: string;
  slug: string;
  cta?: BlogPostCta;
}

export interface BlogPost {
  frontmatter: BlogPostFrontmatter;
  content: string;
  slug: string;
  filePath: string;
  readingTime: number;
}

export interface BlogPostSummary {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  slug: string;
  readingTime: number;
  coverImage?: string;
  featured: boolean;
}

export interface BlogConfig {
  postsPerPage: number;
  featuredPostsCount: number;
  contentPath: string;
}
