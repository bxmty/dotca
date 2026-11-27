import path from "path";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogPostPage from "@/app/blog/[slug]/page";
import { getBlogPostBySlug } from "@/lib/blog";
import type { BlogPost, BlogPostCta } from "@/types/blog";

jest.mock("@/lib/blog", () => ({
  getBlogPostBySlug: jest.fn(),
  getBlogPostSummaries: jest.fn(() => []),
}));

// react-markdown and remark-gfm are ESM-only, so Jest can't load them (see
// markdownComponents.test.tsx); these tests are about the CTA slot, not the
// body.
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => {} }));

const FIXTURE_DIR = path.join(__dirname, "fixtures", "lead-magnets");
const originalEnv = process.env;
const mockGetBlogPostBySlug = getBlogPostBySlug as jest.Mock;

function postWithCta(cta: BlogPostCta): BlogPost {
  return {
    slug: "gated-post",
    filePath: "content/blog/gated-post.md",
    content: "Body copy.",
    readingTime: 3,
    frontmatter: {
      slug: "gated-post",
      title: "A post that offers a guide",
      description: "Fixture post for the blog page CTA wiring.",
      date: "2026-10-17",
      author: "Boximity Team",
      published: true,
      cta,
    },
  };
}

function renderPage() {
  return BlogPostPage({ params: Promise.resolve({ slug: "gated-post" }) });
}

describe("/blog/[slug] page CTA", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, LEAD_MAGNET_CONTENT_DIR: FIXTURE_DIR };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("offers a published lead magnet under its own title and label", async () => {
    mockGetBlogPostBySlug.mockReturnValue(
      postWithCta({ type: "lead-magnet", slug: "test-fixture-guide" }),
    );

    render(await renderPage());

    const endCta = screen.getByRole("complementary", { name: "Next step" });
    expect(endCta).toHaveTextContent("Test fixture guide (not real content)");
    for (const link of screen.getAllByRole("link", {
      name: "Download the fixture",
    })) {
      expect(link).toHaveAttribute("href", "/resources/test-fixture-guide");
    }
  });

  it("offers the assessment when the post's magnet is unpublished", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockGetBlogPostBySlug.mockReturnValue(
      postWithCta({ type: "lead-magnet", slug: "unpublished-fixture-guide" }),
    );

    render(await renderPage());

    expect(
      screen.getByRole("link", { name: "Get a Business-First IT Assessment" }),
    ).toHaveAttribute("href", "/book");
    expect(
      screen.queryByRole("link", { name: /download/i }),
    ).not.toBeInTheDocument();
  });
});
