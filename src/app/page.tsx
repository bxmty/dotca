import { ButtonLink } from "./components/Button";
import ContactForm from "./components/ContactForm";
import { KeyFigureGrid, type KeyFigureProps } from "./components/KeyFigure";
import Offer from "./components/Offer";
import RuledGrid from "./components/RuledGrid";
import RuledList from "./components/RuledList";
import Section from "./components/Section";
import SectionHead from "./components/SectionHead";
import Steps from "./components/Steps";
import TickList from "./components/TickList";
import { TEXT_LINK_CLASS_NAME } from "./components/TextLink";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT That Just Works — Away From the Desk",
  description:
    "For businesses that live outside the office, we replace break-fix firefighting with technology that just works — one flat price, no surprises.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "IT That Just Works — Away From the Desk | Boximity MSP",
    description:
      "For businesses that live outside the office, we replace break-fix firefighting with technology that just works — one flat price, no surprises.",
  },
};

// Content is kept as data so each section renders through the shared
// Technical Manual primitives (#618). Copy is unchanged from the Bootstrap
// page except where the spec's structure splits it (figures, offer).

const trapItems = [
  {
    title: "Security Threats",
    body: "Bad actors are constantly targeting your valuable business and customer data.",
  },
  {
    title: "Wasted Time",
    body: "Hours spent troubleshooting technology issues instead of serving your customers and growing your business.",
  },
  {
    title: "Employee Frustration",
    body: "Staff turnover increases when technology consistently fails and prevents efficient work.",
  },
];

const bundleItems = [
  {
    label: "Secure Password Management",
    detail: "Protect critical business accounts with enterprise-grade security",
  },
  {
    label: "Professional Web Hosting",
    detail: "Keep your online presence reliable and fast",
  },
  {
    label: "Business Email Solutions",
    detail: "Communicate professionally with customers and partners",
  },
  {
    label: "Microsoft Collaboration Tools",
    detail: "Enable your team to work together seamlessly",
  },
];

const processSteps = [
  {
    title: "Share Your Team Structure",
    body: "Outline staff in a contact list including job functions, contact information, and systems currently used.",
  },
  {
    title: "Review Your Current IT Investment",
    body: "Submit your past year's IT spend and information about your most recent technology purchases.",
  },
  {
    title: "Simple Setup",
    body: "We'll email installation instructions for our management tool to your team, ensuring all systems are properly configured.",
  },
];

const experienceItems = [
  { label: "Greater Confidence in Decision-Making" },
  { label: "Peace of Mind from Proactive Protection" },
  { label: "Enhanced Security" },
];

// None of the four is sourced yet; add `source` to a figure once it is
// (decision 5, msp-playbook#165).
const costFigures: readonly KeyFigureProps[] = [
  {
    prefix: "Up to",
    value: "2",
    unit: "weeks",
    label: "of downtime after a cyber incident",
  },
  {
    prefix: "up to",
    value: "22%",
    label: "employee productivity losses due to technology issues",
  },
  {
    value: "$108,000",
    label: "average data breach costs for small businesses",
  },
  {
    value: "60%",
    unit: "higher",
    label: "employee turnover when technology consistently fails",
  },
];

const guarantees = [
  "Every recommendation comes with a plain-language reason you can repeat back — if you can't, the conversation is free.",
  "No line item you weren't told about in advance — or that line item is free.",
  "A free written second opinion on any vendor quote or existing IT contract.",
];

const bundleOffer = {
  title: "Complete Bundle",
  price: "$99",
  priceUnit: "per month per user",
  action: { href: "/pricing", label: "Choose A Plan Today" },
  terms: "First month free when you sign up for annual service",
  includes: [
    "Password Manager",
    "Web Hosting",
    "Business Email",
    "Microsoft Collaboration Tools",
    "Email Support",
    "Quarterly IT Assessment",
    "Reduced Web Design Rates",
    "Server Monitoring",
  ],
};

export default function Home() {
  return (
    <>
      {/* Type-only hero: the H1 is the LCP element (decision 7), so no
          image goes above the fold. Height follows the content. */}
      <section className="grid gap-5.5 px-4 pt-14 pb-12 md:px-7">
        <h1 className="m-0 max-w-[17ch] font-sans text-section leading-[1.04] font-light tracking-tight md:text-display">
          IT that just works&#8288;&nbsp;— for businesses whose work happens
          away from the desk.
        </h1>
        <p className="m-0 max-w-[52ch] text-h3 leading-snug text-muted">
          For businesses that live outside the office, we replace break-fix
          firefighting with technology that just works&#8288;&nbsp;— one flat
          price, no surprises.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink variant="primary" href="#contact">
            Get a Business-First IT Assessment
          </ButtonLink>
          <ButtonLink variant="secondary" href="/pricing">
            See Pricing Options
          </ButtonLink>
        </div>
        {/* Fact line: published figures only. The price is the accent;
            words like "Toronto" stay ink. */}
        <p className="m-0 flex flex-wrap gap-x-7 gap-y-2 border-t border-rule pt-3.5 font-mono text-label text-muted">
          <span>
            <b className="font-medium text-fig">$99</b> per month per user,
            complete bundle
          </span>
          <span>
            <b className="font-medium text-ink">Toronto</b> Ontario, Canada
          </span>
        </p>
      </section>

      <Section>
        <SectionHead
          title="The Reactive IT Trap"
          lede="Too often, technology only gets attention after it breaks — leaving you stuck reacting to security threats, wasted time, and frustrated employees instead of running the business."
        />
        <RuledGrid items={trapItems} />
      </Section>

      <Section id="solutions">
        <SectionHead title="Our Small Business Cloud Bundle" />
        <div className="grid gap-10 md:grid-cols-2">
          <div className="grid max-w-[66ch] content-start gap-4">
            <p className="m-0">
              Technology is advancing at an unprecedented pace, and it&apos;s
              completely understandable why keeping up can feel overwhelming,
              especially when you have a business to run.
            </p>
            <p className="m-0">
              You&apos;re not alone in this—many smart, capable business owners
              seek help to manage these complexities so they can focus on what
              they do best, without really understanding the business impact —
              or being forced into decisions that don&apos;t fit how you
              actually work.
            </p>
            <p className="m-0">
              Our founder has spent 19 years running application development and
              support for other businesses — that background is why we
              understand how fast technology moves, and why we build solutions
              that actually fit how you work, not the other way around.
            </p>
          </div>
          <div className="grid content-start gap-4">
            <h3 className="m-0 text-h3 leading-tight font-semibold">
              Everything your 5-10 person team needs:
            </h3>
            <TickList items={bundleItems} />
            <p className="m-0 border-t border-rule pt-3 font-semibold">
              All managed by experts, so you don&apos;t have to become one.
            </p>
          </div>
        </div>
      </Section>

      <Section id="process">
        <SectionHead title="Our Simple Process Gets You Up and Running Fast" />
        <Steps steps={processSteps} />
      </Section>

      <Section id="benefits">
        <SectionHead title="What You'll Experience With Our Solution" />
        <TickList items={experienceItems} />
        <div className="mt-6 grid gap-5.5">
          <SectionHead title="The Real Cost of Inadequate Technology" />
          <KeyFigureGrid figures={costFigures} />
        </div>
      </Section>

      <Section>
        <SectionHead title="Our Guarantees" />
        <RuledList items={guarantees} />
      </Section>

      <Section>
        <SectionHead title="Limited Time Offer for Small Businesses" />
        <Offer {...bundleOffer} />
      </Section>

      <Section id="contact">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="grid content-start gap-6">
            <SectionHead
              title="Take the First Step Today"
              lede="We're ready to help your small business leverage the power of enterprise-grade technology without the enterprise-level complexity or cost."
            />
            <div className="grid gap-1">
              <h3 className="m-0 text-h3 leading-tight font-semibold">
                Contact Us
              </h3>
              <p className="m-0">Toronto</p>
              <p className="m-0">Ontario, Canada</p>
            </div>
            <div className="grid gap-1">
              <p className="m-0">
                <a
                  href="mailto:hi@boximity.ca"
                  className={TEXT_LINK_CLASS_NAME}
                >
                  hi@boximity.ca
                </a>
              </p>
              <p className="m-0">
                <a href="tel:+12895390098" className={TEXT_LINK_CLASS_NAME}>
                  (289) 539-0098
                </a>
              </p>
            </div>
            {/* The spec's "Note" status line */}
            <p className="m-0 grid max-w-[560px] grid-cols-[auto_1fr] gap-x-3.5 border border-l-3 border-rule border-l-ink bg-cell px-3.5 py-3 text-small">
              <b className="pt-1 font-mono text-label font-medium">Note</b>
              <span>
                &quot;We value your confidence and the privilege to manage your
                corporate data and will not disclose any sensitive
                information.&quot;
              </span>
            </p>
          </div>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
