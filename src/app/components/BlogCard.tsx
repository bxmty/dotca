import Link from "next/link";
import { BlogPostSummary } from "@/types/blog";
import { formatBlogDate } from "@/lib/blog";
import OptimizedImage from "./OptimizedImage";

interface BlogCardProps {
  post: BlogPostSummary;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <article
      className={`card h-100 border-0 shadow-sm ${featured ? "border-primary" : ""}`}
    >
      {post.coverImage && (
        <div
          className="card-img-top position-relative overflow-hidden"
          style={{ height: "200px" }}
        >
          <OptimizedImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-fit-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {featured && (
            <span className="badge bg-primary position-absolute top-0 end-0 m-2">
              Featured
            </span>
          )}
        </div>
      )}

      <div className="card-body d-flex flex-column">
        <div className="mb-2">
          {post.tags.length > 0 && (
            <div className="mb-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="badge bg-secondary me-1 mb-1"
                  style={{ fontSize: "0.75rem" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <h3 className="card-title h5 mb-2">
          <Link
            href={`/blog/${post.slug}`}
            className="text-decoration-none text-white fw-bold"
          >
            {post.title}
          </Link>
        </h3>

        <p className="card-text text-muted small mb-3 flex-grow-1">
          {post.description}
        </p>

        <div className="d-flex justify-content-between align-items-center text-muted small">
          <div className="d-flex align-items-center">
            <span className="me-2">By {post.author}</span>
            <span className="text-muted">•</span>
            <span className="ms-2">{formatBlogDate(post.date)}</span>
          </div>
          <span>{post.readingTime} min read</span>
        </div>
      </div>
    </article>
  );
}
