import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogPost from "@/app/components/BlogPost";
import { getBlogPostBySlug } from "@/lib/blog";

const ASSESSMENT_LABEL = "Get a Business-First IT Assessment";

const FIXED_POSTS = [
  {
    slug: "backups",
    deadCtaText: "Schedule Your Free Backup Assessment",
  },
  {
    slug: "diy-law",
    deadCtaText: "Schedule Free IT Assessment",
  },
  {
    slug: "ms-teams",
    deadCtaText: "your-landing-page-url",
  },
  {
    slug: "fractional-cto",
    deadCtaText: "Schedule Free Technology Strategy Consultation",
  },
  {
    slug: "ms-business-premium",
    deadCtaText: "Book Your Free Technology Alignment Session",
  },
] as const;

describe("fixed blog post CTAs", () => {
  it.each(FIXED_POSTS)(
    "$slug renders a real assessment link and drops its dead markdown CTA",
    ({ slug, deadCtaText }) => {
      const post = getBlogPostBySlug(slug);
      expect(post).not.toBeNull();
      if (!post) {
        return;
      }

      expect(post.content).not.toContain(deadCtaText);

      render(<BlogPost post={post} content={post.content} />);

      const link = screen.getByRole("link", { name: ASSESSMENT_LABEL });
      expect(link).toHaveAttribute("href", "/book");
      expect(screen.queryByText(deadCtaText)).not.toBeInTheDocument();
    },
  );
});
