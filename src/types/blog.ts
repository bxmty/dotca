export type BlogPostCta =
  | { type: "assessment" }
  | { type: "lead-magnet"; slug: string }
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
