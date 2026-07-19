import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPostBySlug, getBlogPostSummaries } from "@/lib/blog";
import { getArticleSchema } from "@/lib/schema";
import BlogPost from "@/app/components/BlogPost";
import JsonLd from "@/app/components/JsonLd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = getBlogPostSummaries();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for each blog post
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const { frontmatter } = post;

  return {
    title: `${frontmatter.title} | Blog`,
    description: frontmatter.description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      publishedTime: frontmatter.date,
      authors: [frontmatter.author],
      tags: frontmatter.tags,
      images: frontmatter.coverImage
        ? [
            {
              url: frontmatter.coverImage,
              alt: frontmatter.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: frontmatter.coverImage ? [frontmatter.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post || !post.frontmatter.published) {
    notFound();
  }

  return (
    <div className="container py-5">
      <JsonLd
        data={getArticleSchema({
          title: post.frontmatter.title,
          description: post.frontmatter.description,
          datePublished: post.frontmatter.date,
          author: post.frontmatter.author,
          url: `/blog/${slug}`,
          image: post.frontmatter.coverImage,
        })}
      />
      <BlogPost
        post={post}
        content={
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        }
      />
    </div>
  );
}
