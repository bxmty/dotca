import path from "path";
import { resolveBlogOffer } from "@/lib/blog-offer";

const FIXTURE_DIR = path.join(__dirname, "fixtures", "lead-magnets");
const originalEnv = process.env;

describe("resolveBlogOffer", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, LEAD_MAGNET_CONTENT_DIR: FIXTURE_DIR };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("offers the assessment when the post sets no cta", () => {
    expect(resolveBlogOffer(undefined)).toEqual({ type: "assessment" });
  });

  it("passes the assessment and suppressed ctas through", () => {
    expect(resolveBlogOffer({ type: "assessment" })).toEqual({
      type: "assessment",
    });
    expect(resolveBlogOffer({ type: "none" })).toEqual({ type: "none" });
  });

  it("resolves a published magnet's title and button label", () => {
    expect(
      resolveBlogOffer({ type: "lead-magnet", slug: "test-fixture-guide" }),
    ).toEqual({
      type: "lead-magnet",
      slug: "test-fixture-guide",
      title: "Test fixture guide (not real content)",
      assetLabel: "Download the fixture",
    });
  });

  it.each([
    ["an unknown magnet", "no-such-guide"],
    ["an unpublished magnet", "unpublished-fixture-guide"],
    ["an invalid slug", "../secrets"],
  ])("falls back to the assessment for %s and warns", (_name, slug) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(resolveBlogOffer({ type: "lead-magnet", slug })).toEqual({
      type: "assessment",
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(slug));
  });
});
