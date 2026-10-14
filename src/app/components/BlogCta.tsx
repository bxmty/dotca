import type { BlogPostCta } from "@/types/blog";
import { ButtonLink } from "./Button";

const ASSESSMENT_HREF = "/book";

// Default button text from the lead-magnet content model. The loader that
// resolves a magnet's title and assetLabel does not exist yet, so every
// lead-magnet CTA uses this label until that lookup ships.
const LEAD_MAGNET_FALLBACK_LABEL = "Download the guide";

const DEFAULT_CTA: BlogPostCta = { type: "assessment" };

/** A cta that shows an offer: anything but `none`. */
type ShownBlogPostCta = Exclude<BlogPostCta, { type: "none" }>;

/** The props shared by the end CTA and the rail box: the post's cta. */
interface BlogPostCtaProps {
  cta?: BlogPostCta;
}

type CtaContent = {
  /** The target both surfaces link to. */
  href: string;
  /** The end CTA block (BlogCta). */
  end: { heading: string; lede?: string; label: string };
  /** The rail box's region name, one line and button text (BlogRailOffer). */
  rail: { regionName: string; text: string; label: string };
};

/**
 * The single mapping from a shown cta to the copy and target of both
 * surfaces, so the end CTA and the rail box cannot drift apart.
 */
function getCtaContent(cta: ShownBlogPostCta): CtaContent {
  if (cta.type === "lead-magnet") {
    return {
      href: `/resources/${cta.slug}`,
      end: { heading: "Keep a copy", label: LEAD_MAGNET_FALLBACK_LABEL },
      rail: {
        regionName: "Free guide offer",
        text: "Keep a copy of the guide.",
        label: LEAD_MAGNET_FALLBACK_LABEL,
      },
    };
  }

  return {
    href: ASSESSMENT_HREF,
    end: {
      heading: "Want a second pair of eyes on your setup?",
      lede: "The assessment is free, and you keep the findings.",
      label: "Get a Business-First IT Assessment",
    },
    rail: {
      regionName: "Free assessment offer",
      text: "Free assessment. You keep the findings.",
      label: "Book it",
    },
  };
}

/**
 * The post's end CTA (Component Spec, blog): a block under a 2 px ink rule
 * instead of a centred button. The lead-magnet variant uses the same block.
 */
export default function BlogCta({ cta = DEFAULT_CTA }: BlogPostCtaProps) {
  if (cta.type === "none") {
    return null;
  }

  const ctaContent = getCtaContent(cta);

  return (
    <aside
      aria-label="Next step"
      className="mt-6 grid gap-3 border-t-2 border-ink pt-4"
    >
      <h2 className="m-0 text-h3 leading-tight font-semibold">
        {ctaContent.end.heading}
      </h2>
      {ctaContent.end.lede && (
        <p className="m-0 text-body text-muted">{ctaContent.end.lede}</p>
      )}
      <div>
        <ButtonLink variant="primary" href={ctaContent.href}>
          {ctaContent.end.label}
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
export function BlogRailOffer({ cta = DEFAULT_CTA }: BlogPostCtaProps) {
  if (cta.type === "none") {
    return null;
  }

  const ctaContent = getCtaContent(cta);

  return (
    <section
      aria-label={ctaContent.rail.regionName}
      className="hl hidden gap-3 p-4 lg:grid"
    >
      <p className="m-0 text-small leading-snug">{ctaContent.rail.text}</p>
      <div>
        <ButtonLink variant="primary" href={ctaContent.href}>
          {ctaContent.rail.label}
        </ButtonLink>
      </div>
    </section>
  );
}
