import type { ReactNode } from "react";

// Type-only page hero from the Component Spec, shared by the home, service
// landing and pricing pages. The H1 is the first text in the hero and the
// LCP element (decision 7), so no image goes above the fold and the height
// follows the content.

type PageHeroProps = {
  heading: ReactNode;
  lead: ReactNode;
  /** Call-to-action buttons, laid out in a wrapping row. */
  actions?: ReactNode;
  /**
   * Mono fact line under a hairline rule: pass one `<span>` per fact.
   * Published figures only; a price takes the accent (`text-fig`).
   */
  facts?: ReactNode;
};

export default function PageHero({
  heading,
  lead,
  actions,
  facts,
}: PageHeroProps) {
  return (
    <section className="grid gap-5.5 px-4 pt-14 pb-12 md:px-7">
      <h1 className="m-0 max-w-[17ch] font-sans text-section leading-[1.04] font-light tracking-tight md:text-display">
        {heading}
      </h1>
      <p className="m-0 max-w-[52ch] text-h3 leading-snug text-muted">{lead}</p>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      {facts && (
        <p className="m-0 flex flex-wrap gap-x-7 gap-y-2 border-t border-rule pt-3.5 font-mono text-label text-muted">
          {facts}
        </p>
      )}
    </section>
  );
}
