import fs from "fs";
import { getBlogPostBySlug } from "@/lib/blog";

jest.mock("fs");

const mockReadFileSync = fs.readFileSync as jest.Mock;

function mockPostFile({ published }: { published: boolean }) {
  mockReadFileSync.mockReturnValue(
    [
      "---",
      "title: Test Post",
      "description: A test post",
      "date: 2026-01-01",
      "author: Test Author",
      `published: ${published}`,
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

  it("returns null when the post file does not exist", () => {
    mockReadFileSync.mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    expect(getBlogPostBySlug("no-such-post")).toBeNull();
  });
});
