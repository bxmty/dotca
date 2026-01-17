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
