import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getBlogPostsByTag,
  getTagFromSlug,
  tagToSlug,
  getAllTags,
} from "@/lib/blog";
import PostList from "@/app/components/PostList";
import Section from "@/app/components/Section";
import SectionHead from "@/app/components/SectionHead";

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
    <>
      <section className="grid gap-5.5 px-4 pt-14 pb-4 md:px-7">
        <h1 className="m-0 font-sans text-section leading-[1.04] font-light tracking-tight md:text-display">
          Tag: {displayTag}
        </h1>
        <p className="m-0 max-w-[52ch] text-h3 leading-snug text-muted">
          {posts.length} post{posts.length !== 1 ? "s" : ""} tagged with{" "}
          {displayTag}
        </p>
      </section>

      <Section>
        <SectionHead title={`Posts tagged "${displayTag}"`} />
        <PostList posts={posts} label={`Posts tagged ${displayTag}`} />
      </Section>
    </>
  );
}
