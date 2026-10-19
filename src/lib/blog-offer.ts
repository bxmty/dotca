import { getLeadMagnetBySlug } from "@/lib/lead-magnets";
import type { BlogOffer, BlogPostCta } from "@/types/blog";

const ASSESSMENT_OFFER: BlogOffer = { type: "assessment" };

/**
 * Resolve a post's cta frontmatter into the offer its CTA components render.
 * Reads the lead-magnet content directory, so call it from a server
 * component (the blog post page), never from client code.
 *
 * A lead-magnet cta whose magnet is unknown or unpublished falls back to the
 * assessment rather than rendering nothing or linking to it: its
 * /resources page would 404, which is the dead-CTA bug this slot exists to
 * prevent, and the assessment is every post's default offer.
 */
export function resolveBlogOffer(cta: BlogPostCta | undefined): BlogOffer {
  if (!cta || cta.type !== "lead-magnet") {
    return cta ?? ASSESSMENT_OFFER;
  }

  const magnet = getLeadMagnetBySlug(cta.slug);
  if (!magnet) {
    console.warn(
      `Blog cta lead magnet "${cta.slug}" is unknown or unpublished; offering the assessment instead`,
    );
    return ASSESSMENT_OFFER;
  }

  const { title, assetLabel } = magnet.frontmatter;
  return assetLabel
    ? { type: "lead-magnet", slug: magnet.slug, title, assetLabel }
    : { type: "lead-magnet", slug: magnet.slug, title };
}
