import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import type { BlogPost } from "@/types/blog";

// next/og's ImageResponse renders through a WASM renderer that Jest's CJS
// runtime cannot dynamically import, so the real constructor can never produce
// pixels here. Capture what the card is made of instead: the element tree and
// the size handed to the renderer are the whole observable output of
// renderOgImage, and rendering that tree to markup lets the assertions below
// read the card the way a crawler reads the finished image.
interface CapturedCard {
  element: ReactElement;
  size: { width: number; height: number };
}

const capturedCards: CapturedCard[] = [];

jest.mock("next/og", () => ({
  ImageResponse: jest.fn().mockImplementation(function (
    element: ReactElement,
    size: { width: number; height: number },
  ) {
    capturedCards.push({ element, size });
  }),
}));

jest.mock("@/lib/blog", () => ({
  getBlogPostBySlug: jest.fn(),
  formatBlogDate: jest.fn((date: string) => `formatted(${date})`),
}));

import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE, renderOgImage } from "@/lib/og";
import { getBlogPostBySlug } from "@/lib/blog";
import BlogOgImage, {
  alt as blogAlt,
  contentType as blogContentType,
  size as blogSize,
} from "@/app/blog/[slug]/opengraph-image";
import ArchitectureOgImage, {
  alt as architectureAlt,
  contentType as architectureContentType,
  size as architectureSize,
} from "@/app/services/it-services-for-architecture-firms/opengraph-image";
import OntarioOgImage, {
  alt as ontarioAlt,
  contentType as ontarioContentType,
  size as ontarioSize,
} from "@/app/services/managed-it-services-ontario/opengraph-image";

const getBlogPostBySlugMock = getBlogPostBySlug as jest.MockedFunction<
  typeof getBlogPostBySlug
>;

/**
 * The one card rendered since the last reset, as markup plus the size it was
 * rendered at. Fails loudly if the code under test rendered none or several,
 * since every later assertion would otherwise read the wrong card.
 */
function readRenderedCard(): { markup: string; size: CapturedCard["size"] } {
  expect(capturedCards).toHaveLength(1);
  const [card] = capturedCards;
  return { markup: renderToStaticMarkup(card.element), size: card.size };
}

/** Render one card directly through the shared renderer and read it back. */
function renderCard(options: {
  title: string;
  eyebrow: string;
  footer?: string;
}): { markup: string; size: CapturedCard["size"] } {
  renderOgImage(options);
  return readRenderedCard();
}

function buildPost(): BlogPost {
  return {
    frontmatter: {
      title: "Why flat-rate IT wins",
      description: "Predictable billing beats hourly firefighting.",
      date: "2026-01-15",
      author: "Matt Mattice",
      slug: "why-flat-rate-it-wins",
    },
    content: "body",
    slug: "why-flat-rate-it-wins",
    filePath: "content/blog/why-flat-rate-it-wins.md",
    readingTime: 4,
  };
}

beforeEach(() => {
  capturedCards.length = 0;
});

describe("social card dimensions", () => {
  it("is the 1200x630 PNG every social scraper expects", () => {
    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
    expect(OG_IMAGE_CONTENT_TYPE).toBe("image/png");
  });

  it("renders at exactly that size", () => {
    expect(renderCard({ title: "Anything", eyebrow: "BLOG" }).size).toEqual({
      width: 1200,
      height: 630,
    });
  });
});

describe("renderOgImage", () => {
  it("puts the eyebrow, title and brand on the card", () => {
    const { markup } = renderCard({
      title: "Managed IT Services Ontario",
      eyebrow: "SERVICES",
    });

    expect(markup).toContain("SERVICES");
    expect(markup).toContain("Managed IT Services Ontario");
    expect(markup).toContain("Boximity MSP");
  });

  it("falls back to the bare domain when no footer is given", () => {
    expect(
      renderCard({ title: "No footer", eyebrow: "BLOG" }).markup,
    ).toContain("boximity.ca");
  });

  it("shows the supplied footer instead of the domain", () => {
    const { markup } = renderCard({
      title: "A post",
      eyebrow: "BLOG",
      footer: "January 15, 2026 · 4 min read",
    });

    expect(markup).toContain("January 15, 2026 · 4 min read");
    expect(markup).not.toContain(">boximity.ca<");
  });

  it("sets the title at full size for a short headline", () => {
    expect(renderCard({ title: "Short", eyebrow: "BLOG" }).markup).toContain(
      "font-size:64px",
    );
  });

  it("steps the title down once the headline passes 50 characters", () => {
    const { markup } = renderCard({ title: "T".repeat(51), eyebrow: "BLOG" });

    expect(markup).toContain("font-size:52px");
    expect(markup).not.toContain("font-size:64px");
  });

  it("steps the title down again once the headline passes 80 characters", () => {
    const { markup } = renderCard({ title: "T".repeat(81), eyebrow: "BLOG" });

    expect(markup).toContain("font-size:44px");
    expect(markup).not.toContain("font-size:52px");
  });

  it("keeps the 50-character boundary at the larger size", () => {
    expect(
      renderCard({ title: "T".repeat(50), eyebrow: "BLOG" }).markup,
    ).toContain("font-size:64px");
  });

  it("keeps the 80-character boundary at the middle size", () => {
    expect(
      renderCard({ title: "T".repeat(80), eyebrow: "BLOG" }).markup,
    ).toContain("font-size:52px");
  });
});

describe("opengraph-image route metadata", () => {
  it.each([
    ["blog post", blogSize, blogContentType, blogAlt, "Boximity MSP blog post"],
    [
      "architecture services",
      architectureSize,
      architectureContentType,
      architectureAlt,
      "IT Services for Architecture Firms - Boximity MSP",
    ],
    [
      "Ontario managed IT",
      ontarioSize,
      ontarioContentType,
      ontarioAlt,
      "Managed IT Services Ontario - Boximity MSP",
    ],
  ])(
    "the %s route serves a 1200x630 PNG under its own alt text",
    (_route, size, contentType, alt, expectedAlt) => {
      expect(size).toEqual({ width: 1200, height: 630 });
      expect(contentType).toBe("image/png");
      expect(alt).toBe(expectedAlt);
    },
  );
});

describe("blog post social card", () => {
  it("renders the post title, date and reading time", async () => {
    getBlogPostBySlugMock.mockReturnValue(buildPost());

    await BlogOgImage({
      params: Promise.resolve({ slug: "why-flat-rate-it-wins" }),
    });

    expect(getBlogPostBySlugMock).toHaveBeenCalledWith("why-flat-rate-it-wins");
    const { markup } = readRenderedCard();
    expect(markup).toContain("BLOG");
    expect(markup).toContain("Why flat-rate IT wins");
    expect(markup).toContain("formatted(2026-01-15) · 4 min read");
  });

  it("falls back to a generic blog card for an unknown slug", async () => {
    getBlogPostBySlugMock.mockReturnValue(null);

    await BlogOgImage({ params: Promise.resolve({ slug: "no-such-post" }) });

    const { markup } = readRenderedCard();
    expect(markup).toContain("BLOG");
    expect(markup).toContain("Boximity MSP Blog");
    expect(markup).toContain("boximity.ca");
  });
});

describe("service landing page social cards", () => {
  it("renders the architecture vertical with its entry price", () => {
    ArchitectureOgImage();

    const { markup } = readRenderedCard();
    expect(markup).toContain("SERVICES");
    expect(markup).toContain("IT Services for Architecture Firms");
    expect(markup).toContain("Cloud 5 Pack from $1,250/month");
  });

  it("renders the Ontario vertical with its entry price", () => {
    OntarioOgImage();

    const { markup } = readRenderedCard();
    expect(markup).toContain("SERVICES");
    expect(markup).toContain("Managed IT Services Ontario");
    expect(markup).toContain("Cloud 5 Pack from $1,250/month");
  });
});
