import { formatBlogDate, getBlogPostBySlug } from "@/lib/blog";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "@/lib/og";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;
export const alt = "Boximity MSP blog post";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return renderOgImage({
      eyebrow: "BLOG",
      title: "Boximity MSP Blog",
    });
  }

  return renderOgImage({
    eyebrow: "BLOG",
    title: post.frontmatter.title,
    footer: `${formatBlogDate(post.frontmatter.date)} · ${post.readingTime} min read`,
  });
}
