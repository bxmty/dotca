import Link from "next/link";
import Image from "next/image";
import CheckIcon from "@/app/components/CheckIcon";
import { HERO_BLUR_DATA_URL } from "./heroImage";

/**
 * Named icons for the "why" cards; verticals pick from this set so the
 * template stays free of per-page SVG path data.
 */
const WHY_ICON_PATHS = {
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  clipboard:
    "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  trend: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  lightbulb:
    "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  building:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  users:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  shieldCheck: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  dollar:
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
} as const;

export type WhyIconName = keyof typeof WHY_ICON_PATHS;

// Icon backgrounds cycle in this fixed order on every page
const WHY_CARD_COLORS = ["bg-primary", "bg-success", "bg-info", "bg-warning"];

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceLandingContent {
  hero: {
    heading: string;
    lead: string;
    trustLine: string;
    imageAlt: string;
    card: {
      intro: string;
      items: string[];
    };
  };
  /** e.g. "See pricing page for full details and firm sizes" */
  pricingNote: string;
  trustSignal: string;
  why: {
    heading: string;
    cards: { icon: WhyIconName; title: string; body: string }[];
  };
  what: {
    heading: string;
    paragraphs: string[];
    highlight: { title: string; body: string };
    components: {
      heading: string;
      tiles: { emoji: string; label: string }[];
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
      emoji: string;
      name: string;
      description: string;
      responseTime: string;
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
    lead: string;
  };
}

function HeroBackground({ alt, priority }: { alt: string; priority?: boolean }) {
  return (
    <>
      <div className="position-absolute top-0 start-0 w-100 h-100">
        <div
          className="w-100 h-100 position-absolute"
          style={{ zIndex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        ></div>
      </div>
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ zIndex: 0 }}
      >
        <Image
          src="/images/hero-background.jpg"
          alt={alt}
          fill
          priority={priority}
          loading="eager"
          sizes="100vw"
          placeholder="blur"
          blurDataURL={HERO_BLUR_DATA_URL}
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
          quality={70}
        />
      </div>
    </>
  );
}

export default function ServiceLandingPage({
  content,
}: {
  content: ServiceLandingContent;
}) {
  const {
    hero,
    pricingNote,
    trustSignal,
    why,
    what,
    pack,
    serviceAreas,
    faq,
    finalCta,
  } = content;

  return (
    <>
      {/* Hero Section */}
      <section className="position-relative py-5 py-md-7 text-white">
        <HeroBackground alt={hero.imageAlt} priority />
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-light mb-4">{hero.heading}</h1>
              <p className="lead mb-4">{hero.lead}</p>
              <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
                <Link href="/#contact" className="btn btn-light btn-lg">
                  Get Free IT Assessment
                </Link>
                <Link href="/pricing" className="btn btn-outline-light btn-lg">
                  View Cloud 5 Pack Pricing
                </Link>
              </div>
              <div className="d-flex align-items-center text-light">
                <svg
                  aria-hidden="true"
                  className="me-2"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <small>{hero.trustLine}</small>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-lg">
                <div className="card-body p-4">
                  <h3 className="h4 mb-3">Cloud 5 Pack - $1,250/month</h3>
                  <p className="text-muted mb-3">{hero.card.intro}</p>
                  <small className="text-muted d-block mb-3">
                    {pricingNote}
                  </small>
                  <ul className="list-unstyled">
                    {hero.card.items.map((item) => (
                      <li key={item} className="d-flex mb-2">
                        <CheckIcon
                          filled
                          size={16}
                          className="text-success-emphasis flex-shrink-0 me-2 mt-1"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 p-3 bg-light rounded">
                    <p className="mb-0 text-dark fw-medium">
                      ✓ No contracts • ✓ 30-day money-back guarantee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-4" style={{ backgroundColor: "#2b3035" }}>
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-auto">
              <small style={{ color: "#f8f9fa" }}>{trustSignal}</small>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            {why.heading}
          </h2>
          <div className="row g-4">
            {why.cards.map((card, index) => (
              <div key={card.title} className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div
                      className={`mb-4 icon-box d-flex align-items-center justify-content-center ${WHY_CARD_COLORS[index % WHY_CARD_COLORS.length]} text-white rounded-circle mx-auto`}
                      style={{ width: "4rem", height: "4rem" }}
                    >
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        width="24"
                        height="24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={WHY_ICON_PATHS[card.icon]}
                        />
                      </svg>
                    </div>
                    <h3 className="fs-4 fw-medium mb-3 text-center">
                      {card.title}
                    </h3>
                    <p className="text-body-secondary">{card.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Section */}
      <section className="py-5 py-md-7 bg-alt" data-bs-theme="dark">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
                {what.heading}
              </h2>
              {what.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mb-4">
                  {paragraph}
                </p>
              ))}
              <div className="card border-primary">
                <div className="card-body">
                  <h4 className="h5 mb-3">{what.highlight.title}</h4>
                  <p className="mb-0">{what.highlight.body}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h3 className="h4 mb-4">{what.components.heading}</h3>
                  <div className="row g-3">
                    {what.components.tiles.map((tile) => (
                      <div key={tile.label} className="col-6">
                        <div className="text-center p-3 border rounded">
                          <div className="fs-2 mb-2">{tile.emoji}</div>
                          <div className="fw-medium">{tile.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud 5 Pack Details */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            {pack.heading}
          </h2>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="card shadow-lg border-0">
                <div className="card-header bg-primary text-white text-center py-4">
                  <h3 className="h2 mb-2">$1,250/month</h3>
                  <p className="mb-0">
                    For 5 users • No contracts • Cancel anytime
                  </p>
                  <small className="opacity-75">{pricingNote}</small>
                </div>
                <div className="card-body p-4 p-md-5">
                  <div className="row g-4">
                    {pack.groups.map((group) => (
                      <div key={group.title} className="col-md-6">
                        <h4 className="h5 mb-3 text-primary">{group.title}</h4>
                        <ul className="list-unstyled mb-4">
                          {group.items.map((item) => (
                            <li key={item} className="d-flex mb-2">
                              <CheckIcon
                                filled
                                size={14}
                                className="text-success-emphasis flex-shrink-0 me-2 mt-1"
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <Link
                      href="/#contact"
                      className="btn btn-primary btn-lg px-5"
                    >
                      Start Your Free Assessment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      {serviceAreas && (
        <section className="py-5 py-md-7 bg-alt" data-bs-theme="dark">
          <div className="container">
            <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
              {serviceAreas.heading}
            </h2>
            <p className="lead text-center mb-5">{serviceAreas.lead}</p>
            <div className="row g-4">
              {serviceAreas.areas.map((area) => (
                <div key={area.name} className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm text-center">
                    <div className="card-body">
                      <div className="fs-1 mb-3">{area.emoji}</div>
                      <h4 className="h5 mb-3">{area.name}</h4>
                      <p className="text-body-secondary small mb-3">
                        {area.description}
                      </p>
                      <small className="text-muted">{area.responseTime}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
              <p className="mb-4">{serviceAreas.footer}</p>
              <Link href="/#contact" className="btn btn-outline-primary">
                {serviceAreas.ctaLabel}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            {faq.heading}
          </h2>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {faq.items.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === faq.items.length - 1;
                  return (
                    <div
                      key={item.question}
                      className={`accordion-item border${isLast ? "" : " mb-3"}`}
                    >
                      <h3 className="accordion-header">
                        <button
                          className={`accordion-button fw-medium${isFirst ? "" : " collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#faq${index + 1}`}
                        >
                          {item.question}
                        </button>
                      </h3>
                      <div
                        id={`faq${index + 1}`}
                        className={`accordion-collapse collapse${isFirst ? " show" : ""}`}
                        data-bs-parent="#faqAccordion"
                      >
                        <div className="accordion-body text-body-secondary">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="position-relative py-5 py-md-7 text-white">
        <HeroBackground alt={hero.imageAlt} />
        <div
          className="container position-relative text-center"
          style={{ zIndex: 2 }}
        >
          <h2 className="fs-1 fw-light mb-4">{finalCta.heading}</h2>
          <p className="lead mb-5 col-md-8 mx-auto">{finalCta.lead}</p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <Link href="/#contact" className="btn btn-light btn-lg px-5">
              Get Free IT Assessment
            </Link>
            <Link href="/pricing" className="btn btn-outline-light btn-lg px-5">
              View All Pricing Options
            </Link>
          </div>
          <div className="mt-4">
            <small className="text-light opacity-75">
              ✓ No contracts • ✓ 30-day money-back guarantee
            </small>
          </div>
        </div>
      </section>
    </>
  );
}
