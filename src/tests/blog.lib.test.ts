import fs from "fs";
import path from "path";
import {
  formatBlogDate,
  getAllBlogPosts,
  getAllTags,
  getBlogPostBySlug,
  getBlogPostSummaries,
  getBlogPostsByTag,
  getFeaturedBlogPosts,
  getTagFromSlug,
  tagToSlug,
} from "@/lib/blog";

jest.mock("fs");

const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockReaddirSync = fs.readdirSync as jest.Mock;

function postFile(lines: string[], body = "Post body content."): string {
  return [
    "---",
    "description: A test post",
    "author: Test Author",
    ...lines,
    "---",
    "",
    body,
    "",
  ].join("\n");
}

/** Stand in for content/blog: file name → file contents. */
function mockBlogDir(files: Record<string, string>) {
  mockReaddirSync.mockReturnValue(Object.keys(files));
  mockReadFileSync.mockImplementation((filePath: string) => {
    const contents = files[path.basename(filePath)];
    if (contents === undefined) {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    }
    return contents;
  });
}

function mockPostFile({
  published,
  ctaLines = [],
}: {
  published: boolean;
  ctaLines?: string[];
}) {
  mockReadFileSync.mockReturnValue(
    [
      "---",
      "title: Test Post",
      "description: A test post",
      "date: 2026-01-01",
      "author: Test Author",
      `published: ${published}`,
      ...ctaLines,
      "---",
      "",
      "Post body content.",
      "",
    ].join("\n"),
  );
}

describe("getBlogPostBySlug", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a published post for a valid slug", () => {
    mockPostFile({ published: true });

    const post = getBlogPostBySlug("my-test-post");

    expect(post).not.toBeNull();
    expect(post?.frontmatter.title).toBe("Test Post");
    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringContaining("my-test-post.md"),
      "utf8",
    );
  });

  it("returns null for unpublished posts", () => {
    mockPostFile({ published: false });

    expect(getBlogPostBySlug("my-test-post")).toBeNull();
  });

  it.each([
    "../secrets",
    "..%2Fsecrets",
    "post/../../etc/passwd",
    "post.md",
    "",
  ])("rejects slug %p without touching the filesystem", (slug) => {
    mockPostFile({ published: true });

    expect(getBlogPostBySlug(slug)).toBeNull();
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "assessment",
      ctaLines: ["cta:", "  type: assessment"],
      expected: { type: "assessment" },
    },
    {
      name: "none",
      ctaLines: ["cta:", "  type: none"],
      expected: { type: "none" },
    },
    {
      name: "lead-magnet",
      ctaLines: ["cta:", "  type: lead-magnet", "  slug: example-guide"],
      expected: { type: "lead-magnet", slug: "example-guide" },
    },
  ])("preserves a $name cta from frontmatter", ({ ctaLines, expected }) => {
    mockPostFile({ published: true, ctaLines });

    expect(getBlogPostBySlug("my-test-post")?.frontmatter.cta).toEqual(
      expected,
    );
  });

  it("hides a lead-magnet cta that has no slug", () => {
    mockPostFile({
      published: true,
      ctaLines: ["cta:", "  type: lead-magnet"],
    });

    expect(getBlogPostBySlug("my-test-post")?.frontmatter.cta).toEqual({
      type: "none",
    });
  });

  it("returns null when the post file does not exist", () => {
    mockReadFileSync.mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    expect(getBlogPostBySlug("no-such-post")).toBeNull();
  });
});

describe("blog listings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockBlogDir({
      "older-post.md": postFile([
        "title: Older",
        "date: 2026-01-10",
        "tags: [Security, Small Business]",
        "featured: true",
      ]),
      "newest-post.md": postFile([
        "title: Newest",
        "date: 2026-03-01",
        "tags: [Backups]",
      ]),
      "middle-post.md": postFile([
        "title: Middle",
        "date: 2026-02-01",
        "tags: [Security]",
        "featured: true",
      ]),
      "draft-post.md": postFile([
        "title: Draft",
        "date: 2026-04-01",
        "tags: [Drafts Only, Security]",
        "featured: true",
        "published: false",
      ]),
      "broken-post.md": postFile(["date: 2026-05-01"]),
      "notes.txt": postFile(["title: Not markdown", "date: 2026-06-01"]),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists published markdown posts newest first", () => {
    expect(getAllBlogPosts().map((post) => post.slug)).toEqual([
      "newest-post",
      "middle-post",
      "older-post",
    ]);
  });

  it("returns no posts when the content directory is missing", () => {
    mockReaddirSync.mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    expect(getAllBlogPosts()).toEqual([]);
  });

  it("summarises a post for listings", () => {
    expect(getBlogPostSummaries()[2]).toEqual({
      title: "Older",
      description: "A test post",
      date: "2026-01-10",
      author: "Test Author",
      tags: ["Security", "Small Business"],
      slug: "older-post",
      readingTime: 1,
      coverImage: undefined,
      featured: true,
    });
    expect(getBlogPostSummaries()[0]).toMatchObject({
      slug: "newest-post",
      tags: ["Backups"],
      featured: false,
    });
  });

  it("gives a post without tags an empty tag list", () => {
    mockBlogDir({
      "untagged.md": postFile(["title: Untagged", "date: 2026-01-01"]),
    });

    expect(getAllBlogPosts()[0].frontmatter.tags).toEqual([]);
    expect(getBlogPostSummaries()[0].tags).toEqual([]);
  });

  it("features only published posts flagged as featured", () => {
    expect(getFeaturedBlogPosts().map((post) => post.slug)).toEqual([
      "middle-post",
      "older-post",
    ]);
  });

  it("caps the featured list at three posts", () => {
    mockBlogDir(
      Object.fromEntries(
        [1, 2, 3, 4].map((day) => [
          `post-${day}.md`,
          postFile([
            `title: Post ${day}`,
            `date: 2026-01-0${day}`,
            "featured: true",
          ]),
        ]),
      ),
    );

    expect(getFeaturedBlogPosts().map((post) => post.slug)).toEqual([
      "post-4",
      "post-3",
      "post-2",
    ]);
  });

  it("lists the tags of published posts alphabetically, once each", () => {
    expect(getAllTags()).toEqual(["Backups", "Security", "Small Business"]);
  });

  it("returns only the posts carrying a tag", () => {
    expect(getBlogPostsByTag("Security").map((post) => post.slug)).toEqual([
      "middle-post",
      "older-post",
    ]);
    expect(getBlogPostsByTag("backups").map((post) => post.slug)).toEqual([
      "newest-post",
    ]);
  });

  it("finds posts by tag slug", () => {
    expect(
      getBlogPostsByTag("small-business").map((post) => post.slug),
    ).toEqual(["older-post"]);
  });

  it("returns no posts for a tag nothing published carries", () => {
    expect(getBlogPostsByTag("Drafts Only")).toEqual([]);
    expect(getBlogPostsByTag("no-such-tag")).toEqual([]);
  });

  it("resolves a tag slug back to its display name", () => {
    expect(getTagFromSlug("small-business")).toBe("Small Business");
    expect(getTagFromSlug("Small Business")).toBe("Small Business");
    expect(getTagFromSlug("Small  Business")).toBe("Small Business");
    expect(getTagFromSlug("drafts-only")).toBeNull();
  });
});

describe("tagToSlug", () => {
  it.each([
    ["Small Business", "small-business"],
    ["  Small Business  ", "small-business"],
    ["Small   Business", "small-business"],
    ["Small \t Business", "small-business"],
    ["Q&A: Wi-Fi!", "qa-wi-fi"],
  ])("turns %p into %p", (tag, slug) => {
    expect(tagToSlug(tag)).toBe(slug);
  });
});

describe("formatBlogDate", () => {
  it("writes the date out in long US form", () => {
    expect(formatBlogDate("2026-03-15T12:00:00")).toBe("March 15, 2026");
  });
});

describe("reading time", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function readingTimeOf(body: string, lines: string[] = []): number {
    mockBlogDir({
      "timed.md": postFile(
        ["title: Timed", "date: 2026-01-01", ...lines],
        body,
      ),
    });
    return getAllBlogPosts()[0].readingTime;
  }

  it("is one minute per 200 words, rounded up", () => {
    // postFile wraps the body in blank lines, which count as two more words.
    expect(readingTimeOf(Array(398).fill("word").join(" "))).toBe(2);
    expect(readingTimeOf(Array(399).fill("word").join(" "))).toBe(3);
  });

  it("counts a run of whitespace as one word break", () => {
    expect(readingTimeOf(Array(150).fill("word").join("  \n "))).toBe(1);
  });

  it("prefers a reading time set in the frontmatter", () => {
    expect(readingTimeOf("short", ["readingTime: 7"])).toBe(7);
  });
});

describe("blog post cta parsing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function ctaOf(ctaLines: string[]) {
    mockPostFile({ published: true, ctaLines });
    return getBlogPostBySlug("my-test-post")?.frontmatter.cta;
  }

  it("leaves the cta unset when the frontmatter has none or null", () => {
    expect(ctaOf([])).toBeUndefined();
    expect(ctaOf(["cta: null"])).toBeUndefined();
    expect(getBlogPostBySlug("my-test-post")).not.toBeNull();
  });

  it("accepts an explicit none", () => {
    expect(ctaOf(["cta:", "  type: none"])).toEqual({ type: "none" });
  });

  it.each([
    ["an unknown type", ["cta:", "  type: other", "  slug: example-guide"]],
    [
      "a lead magnet with an empty slug",
      ["cta:", "  type: lead-magnet", '  slug: ""'],
    ],
    [
      "a lead magnet with a non-text slug",
      ["cta:", "  type: lead-magnet", "  slug: 42"],
    ],
    ["a bare string", ["cta: assessment"]],
  ])("hides the cta for %s", (_label, ctaLines) => {
    expect(ctaOf(ctaLines)).toEqual({ type: "none" });
  });
});
