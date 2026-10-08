import type { BlogPostCta } from "@/types/blog";
import { ButtonLink } from "./Button";

const ASSESSMENT_HREF = "/book";

// Default button text from the lead-magnet content model. The loader that
// resolves a magnet's title and assetLabel does not exist yet, so every
// lead-magnet CTA uses this label until that lookup ships.
const LEAD_MAGNET_FALLBACK_LABEL = "Download the guide";

type EndCtaContent = {
  heading: string;
  lede?: string;
  label: string;
  href: string;
};

/** The end CTA's text and target for a post's (non-suppressed) cta. */
function getEndCtaContent(
  cta: Exclude<BlogPostCta, { type: "none" }>,
): EndCtaContent {
  if (cta.type === "lead-magnet") {
    return {
      heading: "Keep a copy",
      label: LEAD_MAGNET_FALLBACK_LABEL,
      href: `/resources/${cta.slug}`,
    };
  }

  return {
    heading: "Want a second pair of eyes on your setup?",
    lede: "The assessment is free, and you keep the findings.",
    label: "Get a Business-First IT Assessment",
    href: ASSESSMENT_HREF,
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
  const resolvedCta = cta ?? { type: "assessment" };

  if (resolvedCta.type === "none") {
    return null;
  }

  const content = getEndCtaContent(resolvedCta);

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
