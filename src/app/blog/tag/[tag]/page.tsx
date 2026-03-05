import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getBlogPostsByTag,
  getTagFromSlug,
  tagToSlug,
  getAllTags,
} from "@/lib/blog";
import BlogList from "@/app/components/BlogList";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const allTags = getAllTags();
  return allTags.map((tag) => ({
    tag: tagToSlug(tag),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tag: tagParam } = await params;
  const displayTag = getTagFromSlug(tagParam);

  if (!displayTag) {
    return {
      title: "Tag Not Found",
    };
  }

  const canonicalSlug = tagToSlug(displayTag);

  return {
    title: `${displayTag} | Blog`,
    description: `Blog posts about ${displayTag}.`,
    alternates: {
      canonical: `/blog/tag/${canonicalSlug}`,
    },
  };
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag: tagParam } = await params;
  const displayTag = getTagFromSlug(tagParam);

  if (!displayTag) {
    notFound();
  }

  const canonicalSlug = tagToSlug(displayTag);
  const hasSpacesOrNonCanonical = tagParam !== canonicalSlug;

  if (hasSpacesOrNonCanonical) {
    redirect(`/blog/tag/${canonicalSlug}`);
  }

  const posts = getBlogPostsByTag(displayTag);

  return (
    <div className="container py-5">
      <div className="row mb-5">
        <div className="col-12 text-center">
          <h1 className="display-4 fw-bold mb-3">Tag: {displayTag}</h1>
          <p className="lead text-muted mb-4">
            {posts.length} post{posts.length !== 1 ? "s" : ""} tagged with{" "}
            {displayTag}
          </p>
        </div>
      </div>

      <section>
        <BlogList
          posts={posts}
          title={`Posts tagged "${displayTag}"`}
          showFeatured={false}
        />
      </section>
    </div>
  );
}
