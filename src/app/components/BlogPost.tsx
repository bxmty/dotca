import type { BlogPost as BlogPostType } from "@/types/blog";
import { formatBlogDate } from "@/lib/blog";
import OptimizedImage from "./OptimizedImage";

interface BlogPostProps {
  post: BlogPostType;
  content: React.ReactNode; // MDX content will be passed as React nodes
}

export default function BlogPost({ post, content }: BlogPostProps) {
  const { frontmatter } = post;

  return (
    <article className="blog-post">
      {/* Hero Section */}
      <header className="mb-5">
        {frontmatter.coverImage && (
          <div
            className="position-relative mb-4 overflow-hidden rounded"
            style={{ height: "400px" }}
          >
            <OptimizedImage
              src={frontmatter.coverImage}
              alt={frontmatter.title}
              fill
              className="object-fit-cover"
              priority
              sizes="100vw"
            />
          </div>
        )}

        <div className="text-center mb-4">
          <h1 className="display-4 fw-bold mb-3">{frontmatter.title}</h1>
          <p className="lead text-muted mb-3">{frontmatter.description}</p>

          <div className="d-flex justify-content-center align-items-center flex-wrap text-muted small">
            <span className="me-3">
              <i className="bi bi-person-fill me-1"></i>
              {frontmatter.author}
            </span>
            <span className="me-3">
              <i className="bi bi-calendar-event me-1"></i>
              {formatBlogDate(frontmatter.date)}
            </span>
            <span className="me-3">
              <i className="bi bi-clock me-1"></i>
              {frontmatter.readingTime} min read
            </span>
          </div>
        </div>

        {/* Tags */}
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <div className="text-center mb-4">
            {frontmatter.tags.map((tag) => (
              <span key={tag} className="badge bg-primary me-2 mb-2">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="blog-content prose prose-lg mx-auto">{content}</div>

      {/* Footer */}
      <footer className="mt-5 pt-4 border-top">
        <div className="text-center text-muted small">
          <p className="mb-2">
            Published on {formatBlogDate(frontmatter.date)} by{" "}
            {frontmatter.author}
          </p>
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <p>Tagged: {frontmatter.tags.join(", ")}</p>
          )}
        </div>
      </footer>
    </article>
  );
}
