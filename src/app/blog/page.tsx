import type { Metadata } from "next";
import {
  getBlogPostSummaries,
  getFeaturedBlogPosts,
  getAllTags,
} from "@/lib/blog";
import BlogList from "@/app/components/BlogList";

export const metadata: Metadata = {
  title: "Blog | Enterprise IT Solutions",
  description:
    "Insights, tips, and best practices for enterprise IT solutions and small business technology.",
};

export default function BlogPage() {
  const allPosts = getBlogPostSummaries();
  const featuredPosts = getFeaturedBlogPosts();
  const allTags = getAllTags();

  // Separate featured from regular posts
  const regularPosts = allPosts.filter((post) => !post.featured);

  return (
    <div className="container py-5">
      {/* Page Header */}
      <div className="row mb-5">
        <div className="col-12 text-center">
          <h1 className="display-4 fw-bold mb-3">Blog</h1>
          <p className="lead text-muted mb-4">
            Insights, tips, and best practices for enterprise IT solutions and
            small business technology.
          </p>
        </div>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-5">
          <BlogList
            posts={featuredPosts}
            title="Featured Posts"
            showFeatured={true}
          />
        </section>
      )}

      {/* All Posts */}
      <section>
        <BlogList posts={regularPosts} title="All Posts" showFeatured={false} />
      </section>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <section className="mt-5 pt-4 border-top">
          <div className="text-center">
            <h3 className="h4 mb-3">Explore by Topic</h3>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {allTags.map((tag) => (
                <a
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}
                  className="btn btn-outline-primary btn-sm"
                >
                  {tag}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
