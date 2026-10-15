import { BlogPostSummary } from "@/types/blog";
import BlogCard from "./BlogCard";

interface BlogListProps {
  posts: BlogPostSummary[];
  title?: string;
  showFeatured?: boolean;
}

export default function BlogList({
  posts,
  title = "Latest Posts",
  showFeatured = false,
}: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-5">
        <h3 className="text-muted">No blog posts found</h3>
        <p className="text-muted">Check back later for new content!</p>
      </div>
    );
  }

  return (
    <div className="blog-list">
      {title && (
        <div className="mb-4">
          <h2 className="h3 mb-3">{title}</h2>
          <hr className="mb-4" />
        </div>
      )}

      <div className="row g-4">
        {posts.map((post) => (
          <div key={post.slug} className="col-lg-4 col-md-6">
            <BlogCard post={post} featured={showFeatured && post.featured} />
          </div>
        ))}
      </div>
    </div>
  );
}
