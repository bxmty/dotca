import type { BlogPostCta } from "@/types/blog";
import { ButtonLink } from "./Button";

const ASSESSMENT_HREF = "/book";

// Default button text from the lead-magnet content model. The loader that
// resolves a magnet's title and assetLabel does not exist yet, so every
// lead-magnet CTA uses this label until that lookup ships.
const LEAD_MAGNET_FALLBACK_LABEL = "Download the guide";

type CtaContent = {
  heading: string;
  lede?: string;
  label: string;
  href: string;
  /** The rail box's one line and button text (BlogRailOffer). */
  railText: string;
  railLabel: string;
};

/** The CTA text and target for a post's cta, or null when suppressed. */
function getCtaContent(
  cta: BlogPostCta = { type: "assessment" },
): CtaContent | null {
  if (cta.type === "none") {
    return null;
  }

  if (cta.type === "lead-magnet") {
    return {
      heading: "Keep a copy",
      label: LEAD_MAGNET_FALLBACK_LABEL,
      href: `/resources/${cta.slug}`,
      railText: "Keep a copy of the guide.",
      railLabel: LEAD_MAGNET_FALLBACK_LABEL,
    };
  }

  return {
    heading: "Want a second pair of eyes on your setup?",
    lede: "The assessment is free, and you keep the findings.",
    label: "Get a Business-First IT Assessment",
    href: ASSESSMENT_HREF,
    railText: "Free assessment. You keep the findings.",
    railLabel: "Book it",
  };
}

interface BlogCtaProps {
  cta?: BlogPostCta;
}

/**
 * The post's end CTA (Component Spec, blog): a block under a 2 px ink rule
 * instead of a centred button. The lead-magnet variant uses the same block.
 */
export default function BlogCta({ cta }: BlogCtaProps) {
  const content = getCtaContent(cta);

  if (!content) {
    return null;
  }

  return (
    <aside
      aria-label="Next step"
      className="mt-6 grid gap-3 border-t-2 border-ink pt-4"
    >
      <h2 className="m-0 text-h3 leading-tight font-semibold">
        {content.heading}
      </h2>
      {content.lede && (
        <p className="m-0 text-body text-muted">{content.lede}</p>
      )}
      <div>
        <ButtonLink variant="primary" href={content.href}>
          {content.label}
        </ButtonLink>
      </div>
    </aside>
  );
}

/**
 * The small pale-purple box that ends the post's left rail (Component Spec,
 * blog). It makes the same offer as the end CTA, so it is hidden on phones,
 * where the end CTA follows the body closely.
 */
export function BlogRailOffer({ cta }: BlogCtaProps) {
  const content = getCtaContent(cta);

  if (!content) {
    return null;
  }

  return (
    <section aria-label="Offer" className="hl hidden gap-3 p-4 lg:grid">
      <p className="m-0 text-small leading-snug">{content.railText}</p>
      <div>
        <ButtonLink variant="primary" href={content.href}>
          {content.railLabel}
        </ButtonLink>
      </div>
    </section>
  );
}
