import type { BlogOffer } from "@/types/blog";
import { ButtonLink } from "./Button";

const ASSESSMENT_HREF = "/book";

// Default button text from the lead-magnet content model, used when the
// magnet sets no assetLabel (the same default LeadMagnetGate uses).
const DEFAULT_ASSET_LABEL = "Download the guide";

const DEFAULT_OFFER: BlogOffer = { type: "assessment" };

/** An offer that shows something: anything but `none`. */
type ShownBlogOffer = Exclude<BlogOffer, { type: "none" }>;

/**
 * The props shared by the end CTA and the rail box: the post's offer,
 * already resolved server-side by resolveBlogOffer (src/lib/blog-offer.ts),
 * so these components never touch the filesystem.
 */
interface BlogOfferProps {
  offer?: BlogOffer;
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
 * The single mapping from a shown offer to the copy and target of both
 * surfaces, so the end CTA and the rail box cannot drift apart.
 */
function getCtaContent(offer: ShownBlogOffer): CtaContent {
  if (offer.type === "lead-magnet") {
    const label = offer.assetLabel ?? DEFAULT_ASSET_LABEL;
    return {
      href: `/resources/${offer.slug}`,
      end: {
        heading: offer.title,
        lede: "A free guide. Keep a copy.",
        label,
      },
      rail: { regionName: "Free guide offer", text: offer.title, label },
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
export default function BlogCta({ offer = DEFAULT_OFFER }: BlogOfferProps) {
  if (offer.type === "none") {
    return null;
  }

  const ctaContent = getCtaContent(offer);

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
export function BlogRailOffer({ offer = DEFAULT_OFFER }: BlogOfferProps) {
  if (offer.type === "none") {
    return null;
  }

  const ctaContent = getCtaContent(offer);

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
