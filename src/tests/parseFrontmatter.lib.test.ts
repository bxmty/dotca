import { parseFrontmatter } from "@/lib/parseFrontmatter";

describe("parseFrontmatter", () => {
  it("splits YAML frontmatter from the body", () => {
    expect(
      parseFrontmatter("---\ntitle: Hello\ntags:\n  - a\n---\nBody\n\nMore\n"),
    ).toEqual({
      data: { title: "Hello", tags: ["a"] },
      content: "Body\n\nMore\n",
    });
  });

  it("accepts Windows line endings", () => {
    expect(parseFrontmatter("---\r\ntitle: Hello\r\n---\r\nBody")).toEqual({
      data: { title: "Hello" },
      content: "Body",
    });
  });

  it("treats a file with text before the opening fence as all body", () => {
    const file = "Intro line\n---\ntitle: Hello\n---\nBody";

    expect(parseFrontmatter(file)).toEqual({ data: {}, content: file });
  });

  it("treats a file with no frontmatter as all body", () => {
    expect(parseFrontmatter("Just a body")).toEqual({
      data: {},
      content: "Just a body",
    });
  });

  it.each([
    ["a scalar", "just a string"],
    ["a number", "42"],
    ["null", "~"],
  ])("gives empty data when the YAML is %s", (_label, yaml) => {
    expect(parseFrontmatter(`---\n${yaml}\n---\nBody`)).toEqual({
      data: {},
      content: "Body",
    });
  });
});
