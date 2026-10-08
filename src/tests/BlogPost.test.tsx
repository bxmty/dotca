import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogPost from "@/app/components/BlogPost";
import type { BlogPost as BlogPostType } from "@/types/blog";

const POST: BlogPostType = {
  slug: "payment-redirection",
  filePath: "content/blog/payment-redirection.md",
  content: "",
  readingTime: 6,
  frontmatter: {
    slug: "payment-redirection",
    title: "What a payment-redirection scam looks like",
    description: "The bank-account-change email, and the call that stops it.",
    date: "2026-09-29",
    author: "Boximity Team",
    tags: ["Cybersecurity", "Small Business"],
    published: true,
    readingTime: 6,
  },
};

function renderPost(overrides: Partial<BlogPostType["frontmatter"]> = {}) {
  return render(
    <BlogPost
      post={{ ...POST, frontmatter: { ...POST.frontmatter, ...overrides } }}
      content={<p>Body copy.</p>}
    />,
  );
}

describe("BlogPost", () => {
  it("renders the title, dek and body inside the .prose scope", () => {
    renderPost();

    const title = screen.getByRole("heading", {
      level: 1,
      name: POST.frontmatter.title,
    });
    const prose = title.closest(".prose");
    expect(prose).not.toBeNull();
    expect(prose).toContainElement(
      screen.getByText(POST.frontmatter.description),
    );
    expect(prose).toContainElement(screen.getByText("Body copy."));
  });

  it("renders author, date and reading time on one mono meta line", () => {
    renderPost();

    const time = screen.getByText("2026-09-29");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2026-09-29");
    const meta = time.closest(".meta");
    expect(meta).not.toBeNull();
    expect(meta).toHaveTextContent("Boximity Team");
    expect(meta).toHaveTextContent("6 min read");
  });

  it("uses no icon font", () => {
    const { container } = renderPost();

    expect(container.querySelector("i")).toBeNull();
    expect(container.innerHTML).not.toMatch(/\bbi-/);
  });

  it("ends with the end CTA block inside the article", () => {
    renderPost();

    const link = screen.getByRole("link", {
      name: "Get a Business-First IT Assessment",
    });
    expect(link).toHaveAttribute("href", "/book");
    expect(link.closest(".prose")).not.toBeNull();
  });

  it("links the tags as chips", () => {
    renderPost();

    expect(
      screen.getByRole("link", { name: "Small Business" }),
    ).toHaveAttribute("href", "/blog/tag/small-business");
  });

  it("keeps the cover image on the post page", () => {
    const { container } = renderPost({
      coverImage: "/images/blog/https.webp",
    });

    // Decorative: the title above it already names the post.
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/images/blog/https.webp",
    );
  });
});
