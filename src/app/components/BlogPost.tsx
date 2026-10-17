import type { BlogOffer, BlogPost as BlogPostType } from "@/types/blog";
import BlogCta, { BlogRailOffer } from "./BlogCta";
import OptimizedImage from "./OptimizedImage";
import { TagChipList } from "./TagChip";

interface BlogPostProps {
  post: BlogPostType;
  content: React.ReactNode; // rendered markdown
  /** The post's cta, resolved by the page with resolveBlogOffer. */
  offer: BlogOffer;
}

// A post (Component Spec, blog): a split header (60 px Light title, dek on
// the right), the cover edge to edge, then a sticky left rail (meta rows,
// tag chips, offer box) beside the .prose article. The legal pages keep the
// plain ProsePage frame.

export default function BlogPost({ post, content, offer }: BlogPostProps) {
  const { frontmatter } = post;
  const tags = frontmatter.tags ?? [];
  const metaRows = [
    {
      label: "Author",
      value: frontmatter.author,
    },
    {
      label: "Published",
      value: (
        <time dateTime={frontmatter.date} className="tabular-nums">
          {frontmatter.date}
        </time>
      ),
    },
    {
      label: "Reading",
      value: <span className="tabular-nums">{post.readingTime} min</span>,
    },
  ];

  return (
    <div className="pb-12 md:pb-24">
      <header className="grid gap-4.5 px-4 pt-14 pb-10 md:px-7 lg:grid-cols-12 lg:items-end lg:gap-10">
        <h1 className="m-0 text-h2 leading-[1.04] font-light tracking-[-0.02em] text-balance md:text-section lg:col-span-7 lg:text-display">
          {frontmatter.title}
        </h1>
        <p className="m-0 text-h3 leading-[1.4] text-muted lg:col-span-5">
          {frontmatter.description}
        </p>
      </header>

      {frontmatter.coverImage && (
        <div className="relative aspect-[5/2] w-full overflow-hidden border-y border-rule bg-cell">
          <OptimizedImage
            src={frontmatter.coverImage}
            alt=""
            fill
            className="object-cover"
            preload
            sizes="100vw"
          />
        </div>
      )}

      <div className="grid gap-8 px-4 pt-12 md:px-7 lg:grid-cols-[220px_minmax(0,66ch)] lg:gap-16 xl:grid-cols-[260px_minmax(0,66ch)]">
        <aside aria-label="About this post">
          <div className="grid gap-5 lg:sticky lg:top-8">
            <dl className="m-0 grid border-t-2 border-ink font-mono text-label">
              {metaRows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b border-rule py-2"
                >
                  <dt className="text-muted">{label}</dt>
                  <dd className="m-0">{value}</dd>
                </div>
              ))}
            </dl>
            {tags.length > 0 && (
              <div className="hidden lg:block">
                <TagChipList tags={tags} />
              </div>
            )}
            <BlogRailOffer offer={offer} />
          </div>
        </aside>

        <article className="prose">
          {content}
          {tags.length > 0 && (
            <TagChipList tags={tags} className="mt-3 lg:hidden" />
          )}
          <BlogCta offer={offer} />
        </article>
      </div>
    </div>
  );
}
