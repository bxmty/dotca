import Link from "next/link";
import type { BlogPostSummary } from "@/types/blog";
import { TagChipList } from "./TagChip";

// The blog index as a manual's contents page (Component Spec, blog): a
// dated ruled list with no cover images. The ISO date sits in a mono column
// from 561 px and above the title below it; tags are mono chips.

type PostListProps = {
  posts: readonly BlogPostSummary[];
  /** Accessible name of the list, e.g. "Featured posts". */
  label: string;
};

export default function PostList({ posts, label }: PostListProps) {
  if (posts.length === 0) {
    return <p className="m-0 text-muted">No posts yet.</p>;
  }

  return (
    <ol aria-label={label} className="m-0 list-none border-t border-rule p-0">
      {posts.map((post) => (
        <li
          key={post.slug}
          className="grid gap-x-5 gap-y-1.5 border-b border-rule py-4.5 min-[561px]:grid-cols-[7.5rem_minmax(0,1fr)]"
        >
          <time
            dateTime={post.date}
            className="pt-[0.3em] font-mono text-label text-muted tabular-nums"
          >
            {post.date}
          </time>
          <div className="grid gap-1">
            <h3 className="m-0 text-h3 leading-tight font-semibold">
              <Link
                href={`/blog/${post.slug}`}
                className="text-ink no-underline hover:underline hover:decoration-fig hover:underline-offset-4"
              >
                {post.title}
              </Link>
            </h3>
            <p className="m-0 max-w-[62ch] text-small text-muted">
              {post.description}
            </p>
          </div>
          {post.tags.length > 0 && (
            <TagChipList tags={post.tags} className="min-[561px]:col-start-2" />
          )}
        </li>
      ))}
    </ol>
  );
}
