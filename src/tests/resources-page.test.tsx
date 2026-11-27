import path from "path";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResourcePage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/resources/[slug]/page";

// jest.setup.js mocks next/navigation without notFound; mirror Next's
// behavior of notFound() throwing so the page stops rendering.
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// react-markdown and remark-gfm are ESM-only, so Jest can't load them (see
// markdownComponents.test.tsx). Stand in a pass-through renderer: these tests
// check the page hands the magnet's body to the markdown renderer, not how
// react-markdown renders it.
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown">{children}</div>
  ),
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => {} }));

const FIXTURE_DIR = path.join(__dirname, "fixtures", "lead-magnets");
const originalEnv = process.env;

function pageProps(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("/resources/[slug] page", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, LEAD_MAGNET_CONTENT_DIR: FIXTURE_DIR };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("renders a published magnet's content and mounts the gate", async () => {
    render(await ResourcePage(pageProps("test-fixture-guide")));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Test fixture guide (not real content)",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("markdown")).toHaveTextContent(
      /A test fixture, not a real resource/,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download the fixture" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["an unknown slug", "no-such-guide"],
    ["an unpublished magnet", "unpublished-fixture-guide"],
  ])("404s for %s", async (_name, slug) => {
    await expect(ResourcePage(pageProps(slug))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("builds metadata from the magnet's frontmatter", async () => {
    const metadata = await generateMetadata(pageProps("test-fixture-guide"));

    expect(metadata).toMatchObject({
      title: "Test fixture guide (not real content) | Resources",
      description: expect.stringContaining("Fixture lead magnet"),
      alternates: { canonical: "/resources/test-fixture-guide" },
    });
  });

  it("gives a missing magnet a not-found title", async () => {
    expect(await generateMetadata(pageProps("no-such-guide"))).toEqual({
      title: "Resource Not Found",
    });
  });

  it("prebuilds only published magnets", async () => {
    expect(await generateStaticParams()).toEqual([
      { slug: "test-fixture-guide" },
    ]);
  });

  it("publishes no fixture magnet from the real content directory", async () => {
    delete process.env.LEAD_MAGNET_CONTENT_DIR;

    const slugs = (await generateStaticParams()).map(({ slug }) => slug);

    expect(slugs).not.toContain("test-fixture-guide");
    await expect(ResourcePage(pageProps("test-fixture-guide"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
