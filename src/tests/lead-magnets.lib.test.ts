import fs from "fs";
import { getAllLeadMagnets, getLeadMagnetBySlug } from "@/lib/lead-magnets";

jest.mock("fs");

const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockReaddirSync = fs.readdirSync as jest.Mock;

function leadMagnetFile({
  title = "Test Guide",
  published,
  extraLines = [],
}: {
  title?: string;
  published?: boolean;
  extraLines?: string[];
}): string {
  return [
    "---",
    `title: ${title}`,
    "description: A test guide",
    "date: 2026-01-01",
    "assetFile: test-guide.pdf",
    ...(published === undefined ? [] : [`published: ${published}`]),
    ...extraLines,
    "---",
    "",
    "Why this guide is worth your email.",
    "",
  ].join("\n");
}

describe("getLeadMagnetBySlug", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a published lead magnet for a valid slug", () => {
    mockReadFileSync.mockReturnValue(
      leadMagnetFile({
        published: true,
        extraLines: [
          "assetLabel: Get the checklist",
          "relatedBlogSlug: some-post",
        ],
      }),
    );

    const magnet = getLeadMagnetBySlug("test-guide");

    expect(magnet).toEqual({
      slug: "test-guide",
      content: "\nWhy this guide is worth your email.\n",
      frontmatter: {
        title: "Test Guide",
        description: "A test guide",
        date: "2026-01-01",
        published: true,
        assetFile: "test-guide.pdf",
        assetLabel: "Get the checklist",
        relatedBlogSlug: "some-post",
        slug: "test-guide",
      },
    });
    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/content[/\\]lead-magnets[/\\]test-guide\.md$/),
      "utf8",
    );
  });

  it("treats a magnet without a published flag as published, like blog posts", () => {
    mockReadFileSync.mockReturnValue(leadMagnetFile({}));

    expect(getLeadMagnetBySlug("test-guide")?.frontmatter.published).toBe(true);
  });

  it("returns null for unpublished magnets", () => {
    mockReadFileSync.mockReturnValue(leadMagnetFile({ published: false }));

    expect(getLeadMagnetBySlug("test-guide")).toBeNull();
  });

  it("returns null when the magnet file does not exist", () => {
    mockReadFileSync.mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    expect(getLeadMagnetBySlug("no-such-guide")).toBeNull();
  });

  it("returns null when the magnet file cannot be parsed", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockReadFileSync.mockReturnValue("---\ntitle: [unclosed\n---\nBody\n");

    expect(getLeadMagnetBySlug("test-guide")).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns null when required frontmatter is missing", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockReadFileSync.mockReturnValue(
      ["---", "title: No asset", "---", "", "Body"].join("\n"),
    );

    expect(getLeadMagnetBySlug("test-guide")).toBeNull();
  });

  it.each([
    "../secrets",
    "..%2Fsecrets",
    "guide/../../etc/passwd",
    "guide.md",
    "Test-Guide",
    "",
  ])("rejects slug %p without touching the filesystem", (slug) => {
    mockReadFileSync.mockReturnValue(leadMagnetFile({ published: true }));

    expect(getLeadMagnetBySlug(slug)).toBeNull();
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it.each(["../../.env", "/etc/passwd", "sub/guide.pdf", "guide.exe"])(
    "rejects an assetFile of %p that is not a bare PDF filename",
    (assetFile) => {
      jest.spyOn(console, "warn").mockImplementation(() => {});
      mockReadFileSync.mockReturnValue(
        leadMagnetFile({ published: true }).replace(
          "assetFile: test-guide.pdf",
          `assetFile: "${assetFile}"`,
        ),
      );

      expect(getLeadMagnetBySlug("test-guide")).toBeNull();
    },
  );
});

describe("getAllLeadMagnets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns only published magnets, newest first", () => {
    mockReaddirSync.mockReturnValue([
      "older.md",
      "draft.md",
      "newer.md",
      "notes.txt",
    ]);
    const files: Record<string, string> = {
      "older.md": leadMagnetFile({ title: "Older" }).replace(
        "2026-01-01",
        "2025-06-01",
      ),
      "draft.md": leadMagnetFile({ title: "Draft", published: false }),
      "newer.md": leadMagnetFile({ title: "Newer" }),
    };
    mockReadFileSync.mockImplementation((filePath: string) => {
      const name = Object.keys(files).find((file) => filePath.endsWith(file));
      if (!name) throw new Error(`unexpected read ${filePath}`);
      return files[name];
    });

    const magnets = getAllLeadMagnets();

    expect(magnets.map((magnet) => magnet.slug)).toEqual(["newer", "older"]);
  });

  it("returns an empty list when the content directory is missing", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockReaddirSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    expect(getAllLeadMagnets()).toEqual([]);
  });
});
