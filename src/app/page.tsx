import { ButtonLink } from "./components/Button";
import ContactForm from "./components/ContactForm";
import HeroWaypoints from "./components/HeroWaypoints";
import PageHero from "./components/PageHero";
import RuledGrid from "./components/RuledGrid";
import RuledList from "./components/RuledList";
import Section from "./components/Section";
import SectionHead from "./components/SectionHead";
import Steps from "./components/Steps";
import TickList from "./components/TickList";
import { TEXT_LINK_CLASS_NAME } from "./components/TextLink";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Managed IT That Connects Your Business",
  description:
    "Enter it once. Get it right. Bill it on time. Managed IT that connects your business.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Managed IT That Connects Your Business | Boximity MSP",
    description:
      "Enter it once. Get it right. Bill it on time. Managed IT that connects your business.",
  },
};

// Content is kept as data so each section renders through the shared
// Technical Manual primitives (#618).

const trapItems = [
  {
    title: "The same information, retyped",
    body: "Every system keeps its own copy of the job, and someone keys it in again, system by system.",
  },
  {
    title: "Mistakes found by the customer",
    body: "A retyped number is a wrong number, and it surfaces after the customer finds it.",
  },
  {
    title: "Invoices that run late",
    body: "Billing waits while paperwork is retyped before it can go out.",
  },
  {
    title: "Nothing you can automate",
    body: "The systems don't talk, so there is nothing for automation to connect.",
  },
  {
    title: "Wasted Time",
    body: "Hours every week lost to rework and chasing status instead of serving your customers.",
  },
];

const packageItems = [
  {
    label: "Your business systems, connected",
    detail:
      "Dispatch, ERP, accounting, CRM and CAD, entered once and kept in step",
  },
  {
    label: "24/7 monitoring and help desk",
    detail: "Problems caught early, and someone to call who answers",
  },
  {
    label: "Microsoft 365 and security",
    detail: "Managed accounts, protection and backup, without the overhead",
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
  {
    label:
      "Data entered once. It reaches dispatch, accounting and the CRM without retyping.",
  },
  {
    label:
      "Invoices go out the day the job closes, not when someone finds time to key it in.",
  },
  {
    label: "Mistakes get caught by your systems before the customer sees them.",
  },
  {
    label:
      "Nothing stalls when someone is away: the process lives in the systems, not in one person's head.",
  },
  {
    label:
      "One team owns the connections we build: we monitor them, fix our side, and coordinate with the vendor when the cause is theirs.",
  },
];

const disconnectedCosts = [
  "Hours every week spent retyping the same information.",
  "Billing that lags the work by days.",
  "Errors that surface only after the customer finds them.",
];

const guarantees = [
  "Every recommendation comes with a plain-language reason you can repeat back — if you can't, the conversation is free.",
  "No line item you weren't told about in advance — or that line item is free.",
  "A free written second opinion on any vendor quote or existing IT contract.",
];

export default function Home() {
  return (
    <>
      <PageHero
        heading="Enter it once. Get it right. Bill it on time."
        lead="Managed IT for firms with 25-100 staff that connects your dispatch, ERP, accounting and CRM."
        actions={
          <>
            <ButtonLink variant="primary" href="#contact">
              Get a Business-First IT Assessment
            </ButtonLink>
            <ButtonLink variant="secondary" href="#solutions">
              See the Managed Package
            </ButtonLink>
          </>
        }
        // The audience, not a price: the home page shows no prices.
        facts={
          <>
            <span>
              <b className="font-medium text-ink">25-100</b> staff firms
            </span>
            <span>
              <b className="font-medium text-ink">Toronto</b> Ontario, Canada
            </span>
          </>
        }
        aside={<HeroWaypoints />}
      />

      <Section>
        <SectionHead
          title="The Reactive IT Trap"
          lede="Too often your business systems each hold their own copy of the work — leaving you retyping, correcting and chasing instead of running the business."
        />
        <RuledGrid items={trapItems} hasTwoColumns />
      </Section>

      <Section id="solutions">
        <SectionHead title="Managed IT for firms with 25-100 staff" />
        <div className="grid gap-10 md:grid-cols-2">
          <div className="grid max-w-[66ch] content-start gap-4">
            <p className="m-0">
              Your dispatch, ERP, accounting and CRM each hold their own copy of
              the job. We connect them and keep them running, so work is entered
              once and flows everywhere.
            </p>
            <p className="m-0">
              Connections are scoped and quoted separately from the package,
              before you spend anything. We work with what you already run:
              nothing gets replaced unless it should. Platforms we have
              connected include Microsoft 365, Salesforce and Sage Intacct.
            </p>
            <p className="m-0">
              Our founder has spent 19 years running application development and
              support for other businesses — that background is why we build
              solutions that actually fit how you work, not the other way
              around.
            </p>
          </div>
          <div className="grid content-start gap-4">
            <h3 className="m-0 text-h3 leading-tight font-semibold">
              What the managed package covers:
            </h3>
            <TickList items={packageItems} />
            <div className="flex flex-wrap gap-3 border-t border-rule pt-3">
              <ButtonLink variant="primary" href="/security-assessment">
                Start Your Free Assessment
              </ButtonLink>
              <ButtonLink variant="secondary" href="/pricing">
                See Pricing
              </ButtonLink>
            </div>
            <p className="m-0 text-small text-muted">
              The free assessment takes 30 minutes to an hour and covers your IT
              and security. We scope connections after it, as a separate step.
            </p>
          </div>
        </div>
      </Section>

      <Section id="process">
        <SectionHead title="Our Simple Process Gets You Up and Running Fast" />
        <Steps steps={processSteps} />
      </Section>

      <Section id="benefits">
        <SectionHead title="What changes when your systems connect" />
        <TickList items={experienceItems} />
        <div className="mt-6 grid gap-5.5">
          <SectionHead title="What disconnected systems cost you" />
          <RuledList items={disconnectedCosts} />
        </div>
      </Section>

      <Section id="proof">
        <SectionHead title="How it works for a client" />
        <div className="grid max-w-[780px] gap-5.5">
          <p className="m-0 text-prose leading-snug">
            A real client, shared with their permission: a logistics firm with
            around 100 staff. Before: the TMS, the accounting suite and GPS
            tracking each kept their own copy of the job, and someone retyped
            it. Now: the job is entered once, and the invoice goes out the day
            it delivers.
          </p>
          <p className="m-0 font-semibold">Reference call available.</p>
          <div>
            <ButtonLink variant="secondary" href="#contact">
              Book a reference call
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead title="Our Guarantees" />
        <RuledList items={guarantees} />
      </Section>

      <Section id="contact">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="grid content-start gap-6">
            <SectionHead
              title="Take the First Step Today"
              lede="We're ready to help your firm connect its systems and run on technology that works, without the enterprise-level complexity or cost."
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
