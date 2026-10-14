import { render, screen, within } from "@testing-library/react";
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
  it("heads the post with the title and dek, and sets the body in .prose", () => {
    renderPost();

    const title = screen.getByRole("heading", {
      level: 1,
      name: POST.frontmatter.title,
    });
    expect(title.closest("header")).toContainElement(
      screen.getByText(POST.frontmatter.description),
    );
    expect(screen.getByText("Body copy.").closest(".prose")).not.toBeNull();
  });

  it("lists author, date and reading time as rows in the post rail", () => {
    renderPost();

    const rail = screen.getByRole("complementary", { name: "About this post" });
    const terms = within(rail)
      .getAllByRole("term")
      .map((term) => term.textContent);
    const details = within(rail)
      .getAllByRole("definition")
      .map((detail) => detail.textContent);
    expect(terms).toEqual(["Author", "Published", "Reading"]);
    expect(details).toEqual(["Boximity Team", "2026-09-29", "6 min"]);

    const time = within(rail).getByText("2026-09-29");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2026-09-29");
  });

  it("keeps the byline out of the header", () => {
    renderPost();

    const header = screen.getByRole("heading", { level: 1 }).closest("header");
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent(POST.frontmatter.description);
    expect(header).not.toHaveTextContent("Boximity Team");
    expect(header).not.toHaveTextContent("min read");
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

  it("links the tags as chips in the rail from lg up", () => {
    renderPost();

    const rail = screen.getByRole("complementary", { name: "About this post" });
    const chip = within(rail).getByRole("link", { name: "Small Business" });
    expect(chip).toHaveAttribute("href", "/blog/tag/small-business");
    expect(chip.closest(".hidden")).toHaveClass("lg:block");
  });

  it("moves the tags after the body on phones", () => {
    renderPost();

    const article = screen.getByText("Body copy.").closest("article");
    expect(article).not.toBeNull();
    const chip = within(article as HTMLElement).getByRole("link", {
      name: "Small Business",
    });
    expect(chip).toHaveAttribute("href", "/blog/tag/small-business");
    expect(chip.closest(".lg\\:hidden")).not.toBeNull();
    expect(
      screen.getByText("Body copy.").compareDocumentPosition(chip) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders no tag lists for a post without tags", () => {
    renderPost({ tags: [] });

    expect(
      screen.queryByRole("link", { name: "Small Business" }),
    ).not.toBeInTheDocument();
  });

  it("runs the cover edge to edge between the header and the article", () => {
    const { container } = renderPost({
      coverImage: "/images/blog/https.webp",
    });

    // Decorative: the title above it already names the post.
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/images/blog/https.webp");
    expect(img).toHaveAttribute("alt", "");
    expect(img?.closest("article")).toBeNull();
    expect(img?.closest("header")).toBeNull();
    const header = screen.getByRole("heading", { level: 1 }).closest("header");
    expect(
      (header as HTMLElement).compareDocumentPosition(img as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("goes straight from the header to the rail without a cover", () => {
    const { container } = renderPost();

    expect(container.querySelector("img")).toBeNull();
    const header = screen.getByRole("heading", { level: 1 }).closest("header");
    const rail = screen.getByRole("complementary", { name: "About this post" });
    // The header's next sibling is the rail-and-article grid, not an empty
    // cover frame.
    expect(header?.nextElementSibling).toContainElement(rail);
  });

  describe("rail offer box", () => {
    function getRail() {
      return screen.getByRole("complementary", { name: "About this post" });
    }

    it.each([
      ["an omitted cta", {}],
      ["an assessment cta", { cta: { type: "assessment" as const } }],
    ])("offers the assessment for %s", (_name, overrides) => {
      renderPost(overrides);

      const box = within(getRail()).getByRole("region", { name: "Offer" });
      expect(box).toHaveTextContent("Free assessment. You keep the findings.");
      expect(
        within(box).getByRole("link", { name: "Book it" }),
      ).toHaveAttribute("href", "/book");
    });

    it("offers the guide with the end CTA's label and target", () => {
      renderPost({ cta: { type: "lead-magnet", slug: "backup-checklist" } });

      const box = within(getRail()).getByRole("region", { name: "Offer" });
      const endCta = screen.getByRole("complementary", { name: "Next step" });
      const boxLink = within(box).getByRole("link");
      const endLink = within(endCta).getByRole("link");
      expect(boxLink).toHaveAttribute("href", "/resources/backup-checklist");
      expect(boxLink).toHaveAccessibleName("Download the guide");
      expect(endLink).toHaveAttribute("href", "/resources/backup-checklist");
      expect(endLink).toHaveAccessibleName("Download the guide");
    });

    it("shows no box when the cta is suppressed", () => {
      renderPost({ cta: { type: "none" } });

      expect(
        within(getRail()).queryByRole("region", { name: "Offer" }),
      ).not.toBeInTheDocument();
      expect(
        within(getRail()).queryByRole("link", { name: /book|guide/i }),
      ).not.toBeInTheDocument();
    });

    it("sets the box as a light-token .hl island in both schemes", () => {
      renderPost();

      // bg-hl alone would leave dark-scheme ink and button colours on the
      // pale purple; .hl switches every token to its light value.
      const box = within(getRail()).getByRole("region", { name: "Offer" });
      expect(box).toHaveClass("hl");
    });

    it("hides the box on phones, where the end CTA covers it", () => {
      renderPost();

      const box = within(getRail()).getByRole("region", { name: "Offer" });
      expect(box).toHaveClass("hidden", "lg:grid");
    });
  });
});
