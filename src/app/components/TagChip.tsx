import Link from "next/link";
import { tagToSlug } from "@/lib/blog";

// A tag as a mono chip (Component Spec, blog): a ruled outline, not a
// filled badge, linking to the tag's page.

export default function TagChip({ tag }: { tag: string }) {
  return (
    <Link
      href={`/blog/tag/${tagToSlug(tag)}`}
      className="rounded-ctl border border-rule px-1.75 py-0.75 font-mono text-label text-muted no-underline hover:border-ink hover:text-ink"
    >
      {tag}
    </Link>
  );
}

/** A row of tag chips, as a list. */
export function TagChipList({
  tags,
  className,
}: {
  tags: readonly string[];
  className?: string;
}) {
  return (
    <ul
      className={`m-0 flex list-none flex-wrap gap-1.5 p-0 ${className ?? ""}`}
    >
      {tags.map((tag) => (
        <li key={tag}>
          <TagChip tag={tag} />
        </li>
      ))}
    </ul>
  );
}
