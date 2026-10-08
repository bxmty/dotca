import type { ReactNode } from "react";
import { ButtonLink } from "@/app/components/Button";
import FaqList from "@/app/components/FaqList";
import { KeyFigureGrid, type KeyFigureProps } from "@/app/components/KeyFigure";
import Offer from "@/app/components/Offer";
import RuledGrid from "@/app/components/RuledGrid";
import Section from "@/app/components/Section";
import SectionHead from "@/app/components/SectionHead";
import TextLink from "@/app/components/TextLink";
import TickList from "@/app/components/TickList";

/**
 * Icon names the "why" cards used to pick from. The ruled grid has no icon
 * discs (Component Spec), so the names are kept only so existing content
 * still type-checks.
 */
export type WhyIconName =
  | "lock"
  | "clock"
  | "clipboard"
  | "trend"
  | "lightbulb"
  | "building"
  | "users"
  | "shieldCheck"
  | "bolt"
  | "dollar";

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceLandingContent {
  hero: {
    heading: string;
    lead: string;
    trustLine: string;
    /** Unused since the hero went type-only (decision 7). */
    imageAlt?: string;
    card: {
      intro: string;
      items: string[];
    };
  };
  /** e.g. "See pricing page for full details and firm sizes" */
  pricingNote: string;
  /** Optional trust line under the hero; omit when no verifiable claim exists */
  trustSignal?: string;
  /**
   * Optional key figures under the "why" grid. Give a figure a `source`
   * only once the claim is sourced (decision 5).
   */
  keyFigures?: KeyFigureProps[];
  why: {
    heading: string;
    /** `icon` is unused: the ruled grid has no icon discs. */
    cards: { icon?: WhyIconName; title: string; body: string }[];
  };
  what: {
    heading: string;
    paragraphs: string[];
    highlight: { title: string; body: string };
    components: {
      heading: string;
      /** `emoji` is unused: components render as a tick list. */
      tiles: { emoji?: string; label: string }[];
    };
  };
  pack: {
    heading: string;
    groups: { title: string; items: string[] }[];
  };
  /** Optional regional coverage section (used by the Ontario page) */
  serviceAreas?: {
    heading: string;
    lead: string;
    areas: {
      /** Unused: the ruled grid has no icons. */
      emoji?: string;
      name: string;
      description: string;
      /** Remote/onsite coverage note — never a response-time figure */
      coverageNote: string;
    }[];
    footer: string;
    ctaLabel: string;
  };
  faq: {
    heading: string;
    items: ServiceFaq[];
  };
  finalCta: {
    heading: string;
    lead: ReactNode;
  };
}

// The Cloud 5 Pack is the one offer on every service page.
const PACK_PRICE = "$1,250";
const PACK_TERMS =
  "No contracts · 30-day money-back guarantee · Cancel anytime";
const ASSESSMENT_HREF = "/#contact";

export default function ServiceLandingPage({
  content,
}: {
  content: ServiceLandingContent;
}) {
  const {
    hero,
    pricingNote,
    trustSignal,
    keyFigures,
    why,
    what,
    pack,
    serviceAreas,
    faq,
    finalCta,
  } = content;

  return (
    <>
      {/* Type-only hero: the H1 is the LCP element (decision 7), so no
          image goes above the fold. Height follows the content. */}
      <section className="grid gap-5.5 px-4 pt-14 pb-12 md:px-7">
        <h1 className="m-0 max-w-[17ch] font-sans text-section leading-[1.04] font-light tracking-tight md:text-display">
          {hero.heading}
        </h1>
        <p className="m-0 max-w-[52ch] text-h3 leading-snug text-muted">
          {hero.lead}
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink variant="primary" href={ASSESSMENT_HREF}>
            Get Free IT Assessment
          </ButtonLink>
          <ButtonLink variant="secondary" href="/pricing">
            View Cloud 5 Pack Pricing
          </ButtonLink>
        </div>
        {/* Fact line: the price is the accent, the trust lines stay muted */}
        <p className="m-0 flex flex-wrap gap-x-7 gap-y-2 border-t border-rule pt-3.5 font-mono text-label text-muted">
          <span>
            <b className="font-medium text-fig">{PACK_PRICE}</b> per month,
            Cloud 5 Pack
          </span>
          <span>{hero.trustLine}</span>
          {trustSignal && <span>{trustSignal}</span>}
        </p>
      </section>

      <Section>
        <SectionHead title={why.heading} />
        <RuledGrid items={why.cards} />
        {keyFigures && keyFigures.length > 0 && (
          <KeyFigureGrid figures={keyFigures} />
        )}
      </Section>

      <Section>
        <SectionHead title={what.heading} />
        <div className="grid gap-10 md:grid-cols-2">
          <div className="grid max-w-[66ch] content-start gap-4">
            {what.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="m-0">
                {paragraph}
              </p>
            ))}
            {/* The spec's callout: the pale-purple highlight, no icon */}
            <div className="hl grid gap-1.5 px-5 py-4.5">
              <h3 className="m-0 text-prose font-semibold">
                {what.highlight.title}
              </h3>
              <p className="m-0">{what.highlight.body}</p>
            </div>
          </div>
          <div className="grid content-start gap-4">
            <h3 className="m-0 text-h3 leading-tight font-semibold">
              {what.components.heading}
            </h3>
            <TickList items={what.components.tiles} />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead title={pack.heading} lede={hero.card.intro} />
        <Offer
          title="Cloud 5 Pack"
          price={PACK_PRICE}
          priceUnit="per month for 5 users"
          action={{
            href: ASSESSMENT_HREF,
            label: "Start Your Free Assessment",
          }}
          terms={PACK_TERMS}
          includes={hero.card.items}
        />
        <RuledGrid
          items={pack.groups.map((group) => ({
            title: group.title,
            body: <TickList items={group.items.map((label) => ({ label }))} />,
          }))}
        />
        <p className="m-0 text-small">
          <TextLink href="/pricing">{pricingNote}</TextLink>
        </p>
      </Section>

      {serviceAreas && (
        <Section>
          <SectionHead title={serviceAreas.heading} lede={serviceAreas.lead} />
          <RuledGrid
            items={serviceAreas.areas.map((area) => ({
              kicker: area.coverageNote,
              title: area.name,
              body: area.description,
            }))}
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="m-0">{serviceAreas.footer}</p>
            <ButtonLink variant="secondary" href={ASSESSMENT_HREF}>
              {serviceAreas.ctaLabel}
            </ButtonLink>
          </div>
        </Section>
      )}

      <Section>
        <SectionHead title={faq.heading} />
        <FaqList items={faq.items} />
      </Section>

      <Section>
        <SectionHead title={finalCta.heading} />
        <p className="m-0 max-w-[62ch] text-prose text-muted">
          {finalCta.lead}
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink variant="primary" href={ASSESSMENT_HREF}>
            Get Free IT Assessment
          </ButtonLink>
          <ButtonLink variant="secondary" href="/pricing">
            View All Pricing Options
          </ButtonLink>
        </div>
        <p className="m-0 border-t border-rule pt-3.5 font-mono text-label text-muted">
          {PACK_TERMS}
        </p>
      </Section>
    </>
  );
}
