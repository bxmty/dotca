import Link from "next/link";
import type { BlogPostCta } from "@/types/blog";

const ASSESSMENT_LABEL = "Get a Business-First IT Assessment";
const ASSESSMENT_HREF = "/book";

// Default button text from the lead-magnet content model. The loader that
// resolves a magnet's title and assetLabel does not exist yet, so every
// lead-magnet CTA uses this label until that lookup ships.
const LEAD_MAGNET_FALLBACK_LABEL = "Download the guide";

interface BlogCtaProps {
  cta?: BlogPostCta;
}

export default function BlogCta({ cta }: BlogCtaProps) {
  const resolvedCta = cta ?? { type: "assessment" };

  if (resolvedCta.type === "none") {
    return null;
  }

  const label =
    resolvedCta.type === "lead-magnet"
      ? LEAD_MAGNET_FALLBACK_LABEL
      : ASSESSMENT_LABEL;
  const href =
    resolvedCta.type === "lead-magnet"
      ? `/resources/${resolvedCta.slug}`
      : ASSESSMENT_HREF;

  return (
    <div className="text-center my-5">
      <Link href={href} className="btn btn-primary btn-lg">
        {label}
      </Link>
    </div>
  );
}
