import type { BlogPost as BlogPostType } from "@/types/blog";
import BlogCta from "./BlogCta";
import OptimizedImage from "./OptimizedImage";
import ProsePage from "./ProsePage";
import { TagChipList } from "./TagChip";

interface BlogPostProps {
  post: BlogPostType;
  content: React.ReactNode; // rendered markdown
}

// A post in the .prose scope (Component Spec, blog): a 42 px Light title, the
// description as the dek, one mono meta line between rules, the cover image,
// the body, the tag chips and the end CTA.

export default function BlogPost({ post, content }: BlogPostProps) {
  const { frontmatter } = post;
  const tags = frontmatter.tags ?? [];

  return (
    <ProsePage>
      <header className="grid gap-4.5">
        <h1>{frontmatter.title}</h1>
        <p className="dek">{frontmatter.description}</p>
        <p className="meta">
          <span>{frontmatter.author}</span>
          <time dateTime={frontmatter.date} className="tabular-nums">
            {frontmatter.date}
          </time>
          <span className="tabular-nums">{post.readingTime} min read</span>
        </p>
      </header>

      {frontmatter.coverImage && (
        <div className="relative aspect-video overflow-hidden border border-rule bg-cell">
          <OptimizedImage
            src={frontmatter.coverImage}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      )}

      {content}

      {tags.length > 0 && <TagChipList tags={tags} className="mt-3" />}

      <BlogCta cta={frontmatter.cta} />
    </ProsePage>
  );
}
