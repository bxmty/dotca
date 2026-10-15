import type { Metadata } from "next";
import {
  getBlogPostSummaries,
  getFeaturedBlogPosts,
  getAllTags,
} from "@/lib/blog";
import PostList from "@/app/components/PostList";
import Section from "@/app/components/Section";
import SectionHead from "@/app/components/SectionHead";
import { TagChipList } from "@/app/components/TagChip";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights, tips, and best practices for managed IT and small business technology.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const allPosts = getBlogPostSummaries();
  const featuredPosts = getFeaturedBlogPosts();
  const allTags = getAllTags();

  // Featured posts are listed once, ahead of the rest
  const regularPosts = allPosts.filter((post) => !post.featured);

  return (
    <>
      {/* Type-only hero, left-aligned like every other route. */}
      <section className="grid gap-5.5 px-4 pt-14 pb-4 md:px-7">
        <h1 className="m-0 font-sans text-section leading-[1.04] font-light tracking-tight md:text-display">
          Blog
        </h1>
        <p className="m-0 max-w-[52ch] text-h3 leading-snug text-muted">
          Insights, tips, and best practices for enterprise IT solutions and
          small business technology.
        </p>
      </section>

      {featuredPosts.length > 0 && (
        <Section>
          <SectionHead title="Featured" />
          <PostList posts={featuredPosts} label="Featured posts" />
        </Section>
      )}

      <Section>
        <SectionHead title="All posts" />
        <PostList posts={regularPosts} label="All posts" />
      </Section>

      {allTags.length > 0 && (
        <Section>
          <SectionHead title="Explore by topic" />
          <TagChipList tags={allTags} />
        </Section>
      )}
    </>
  );
}
