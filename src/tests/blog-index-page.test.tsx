import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogPage from "@/app/blog/page";
import BlogTagPage from "@/app/blog/tag/[tag]/page";
import {
  getBlogPostSummaries,
  getBlogPostsByTag,
  getFeaturedBlogPosts,
  tagToSlug,
} from "@/lib/blog";

// The index and tag pages are dated ruled lists, like a manual's contents
// page: no cover images, and tags as mono chips.

/** The post rows only, not the tag chips nested inside them. */
function getRows(list: HTMLElement): HTMLElement[] {
  return within(list)
    .getAllByRole("listitem")
    .filter((item) => item.parentElement === list);
}

function getPostRows(): HTMLElement[] {
  return screen.getAllByRole("list", { name: /posts/i }).flatMap(getRows);
}

describe("blog index page", () => {
  it("renders no cover images", () => {
    const { container } = render(<BlogPage />);

    expect(container.querySelector("img")).toBeNull();
  });

  it("lists every post once, each with its ISO date", () => {
    render(<BlogPage />);

    const rows = getPostRows();
    const posts = getBlogPostSummaries();
    expect(rows).toHaveLength(posts.length);

    for (const post of posts) {
      const link = screen.getByRole("link", { name: post.title });
      expect(link).toHaveAttribute("href", `/blog/${post.slug}`);
      const row = link.closest("li");
      expect(row).not.toBeNull();
      const time = row?.querySelector("time");
      expect(time).toHaveAttribute("dateTime", post.date);
      expect(time).toHaveTextContent(post.date);
    }
  });

  it("lists the featured posts ahead of the rest", () => {
    render(<BlogPage />);

    const featured = getFeaturedBlogPosts();
    const featuredList = screen.getByRole("list", { name: "Featured posts" });
    expect(getRows(featuredList)).toHaveLength(featured.length);
  });

  it("links each post's tags as chips to the tag pages", () => {
    render(<BlogPage />);

    const [post] = getBlogPostSummaries();
    const row = screen.getByRole("link", { name: post.title }).closest("li");
    const tagLinks = within(row as HTMLElement).getAllByRole("link", {
      name: post.tags[0],
    });
    expect(tagLinks[0]).toHaveAttribute(
      "href",
      `/blog/tag/${tagToSlug(post.tags[0])}`,
    );
    expect(tagLinks[0]).toHaveClass("font-mono", "rounded-ctl");
  });
});

describe("blog tag page", () => {
  async function renderTagPage(tag: string) {
    render(await BlogTagPage({ params: Promise.resolve({ tag }) }));
  }

  it("renders a dated list of the tag's posts with no cover images", async () => {
    const posts = getBlogPostsByTag("Cybersecurity");
    expect(posts.length).toBeGreaterThan(0);

    await renderTagPage("cybersecurity");

    expect(document.querySelector("img")).toBeNull();
    expect(
      screen.getByRole("heading", { level: 1, name: /Cybersecurity/ }),
    ).toBeInTheDocument();
    const rows = getPostRows();
    expect(rows).toHaveLength(posts.length);
    rows.forEach((row, index) => {
      expect(row.querySelector("time")).toHaveAttribute(
        "dateTime",
        posts[index].date,
      );
    });
  });
});
