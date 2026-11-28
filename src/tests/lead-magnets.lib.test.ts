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
        assetLabel: "Get the checklist",
        relatedBlogSlug: "some-post",
        assets: [{ file: "test-guide.pdf", label: "Get the checklist" }],
      },
    });
    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/content[/\\]lead-magnets[/\\]test-guide\.md$/),
      "utf8",
    );
  });

  it("leaves the optional keys off a magnet that doesn't set them", () => {
    mockReadFileSync.mockReturnValue(leadMagnetFile({ published: true }));

    expect(getLeadMagnetBySlug("test-guide")?.frontmatter).toStrictEqual({
      title: "Test Guide",
      description: "A test guide",
      date: "2026-01-01",
      published: true,
      assets: [{ file: "test-guide.pdf", label: "Download the guide" }],
    });
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

  it.each([
    "../../.env",
    "/etc/passwd",
    "sub/guide.pdf",
    "guide.exe",
    "guide.pdf/../../../.env",
    "guide.pdf.exe",
    "Guide.pdf",
    "guide.PDF",
  ])(
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

describe("multiple assets", () => {
  // assetFilesYaml is the YAML after "assetFiles:", replacing assetFile.
  function multiAssetFile(assetFilesYaml: string[]): string {
    return leadMagnetFile({ published: true }).replace(
      "assetFile: test-guide.pdf",
      ["assetFiles:", ...assetFilesYaml].join("\n"),
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("lists every declared asset in order, PDF or Word, and labels the magnet with the first", () => {
    mockReadFileSync.mockReturnValue(
      multiAssetFile([
        "  - file: rule-staff.pdf",
        "    label: Download the one-page rule",
        "  - file: rule-owner-notes.pdf",
        "    label: Download the owner's notes",
        "  - file: rule-staff.docx",
        "    label: Download the Word version",
      ]),
    );

    expect(getLeadMagnetBySlug("test-guide")?.frontmatter).toStrictEqual({
      title: "Test Guide",
      description: "A test guide",
      date: "2026-01-01",
      published: true,
      assetLabel: "Download the one-page rule",
      assets: [
        { file: "rule-staff.pdf", label: "Download the one-page rule" },
        { file: "rule-owner-notes.pdf", label: "Download the owner's notes" },
        { file: "rule-staff.docx", label: "Download the Word version" },
      ],
    });
  });

  it("accepts a single .docx assetFile", () => {
    mockReadFileSync.mockReturnValue(
      leadMagnetFile({ published: true }).replace(
        "assetFile: test-guide.pdf",
        "assetFile: test-guide.docx",
      ),
    );

    expect(getLeadMagnetBySlug("test-guide")?.frontmatter.assets).toEqual([
      { file: "test-guide.docx", label: "Download the guide" },
    ]);
  });

  it.each([
    ["an empty list", ["  []"]],
    ["a non-list value", ["  guide.pdf"]],
    ["a path traversal", ['  - file: "../../.env"', "    label: Bad"]],
    ["a path separator", ["  - file: sub/guide.pdf", "    label: Bad"]],
    ["a wrong extension", ["  - file: guide.exe", "    label: Bad"]],
    ["a missing label", ["  - file: guide.pdf"]],
    ["a missing file", ["  - label: No file"]],
    ["an uppercase name", ["  - file: Guide.docx", "    label: Bad"]],
    [
      "assetFile declared as well",
      ["  - file: guide.pdf", "    label: One", "assetFile: test-guide.pdf"],
    ],
    [
      "duplicate filenames",
      [
        "  - file: guide.pdf",
        "    label: One",
        "  - file: guide.pdf",
        "    label: Two",
      ],
    ],
  ])("rejects the magnet for %s", (_name, assetFilesYaml) => {
    mockReadFileSync.mockReturnValue(multiAssetFile(assetFilesYaml));

    expect(getLeadMagnetBySlug("test-guide")).toBeNull();
  });
});

describe("content directory override", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadFileSync.mockReturnValue(leadMagnetFile({}));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reads magnets from LEAD_MAGNET_CONTENT_DIR in the test environment", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      LEAD_MAGNET_CONTENT_DIR: "/fixtures/lead-magnets",
    };

    getLeadMagnetBySlug("test-guide");

    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringMatching(
        /^[/\\]fixtures[/\\]lead-magnets[/\\]test-guide\.md$/,
      ),
      "utf8",
    );
  });

  it("ignores LEAD_MAGNET_CONTENT_DIR outside the test environment", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      LEAD_MAGNET_CONTENT_DIR: "/fixtures/lead-magnets",
    };

    getLeadMagnetBySlug("test-guide");

    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/content[/\\]lead-magnets[/\\]test-guide\.md$/),
      "utf8",
    );
    expect(mockReadFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining("fixtures"),
      "utf8",
    );
  });
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
