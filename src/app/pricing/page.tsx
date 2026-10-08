import { ButtonLink } from "../components/Button";
import FaqList from "../components/FaqList";
import Section from "../components/Section";
import SectionHead from "../components/SectionHead";
import { getPlanHref, pricingPlans, type PricingPlan } from "./plans";

const FAQ_ITEMS = [
  {
    question: "What's included in the Password Manager?",
    answer:
      "Our Password Manager includes secure credential storage, password generation, multi-factor authentication, and admin controls to manage team access to company accounts.",
  },
  {
    question: "How long does implementation typically take?",
    answer:
      "For most small businesses, our Basic package can be implemented within 1-2 weeks, Standard within 3-5 weeks, and Premium within 5-7 weeks, depending on your team size and existing infrastructure.",
  },
  {
    question: "Do these prices include all necessary software licenses?",
    answer:
      "Yes, all packages include the necessary licenses for the specified features. There are no hidden costs or additional software purchases required.",
  },
  {
    question: "What if my business needs change and I need to upgrade?",
    answer:
      "You can upgrade your plan at any time. We'll prorate the difference and apply any unused portion of your current subscription to your new plan.",
  },
];

// Pricing sheet from the Component Spec: a ruled table from 900 px, and one
// stacked block per plan below it, both drawn from pricingPlans. The
// Recommended plan is a pale-purple .hl island in both modes, topped by a
// 3 px CTA rule; it stops above the button, so each mode keeps one CTA
// colour. Prices are mono 500 at 28 px (text-h2), never smaller: queen on
// pale purple passes only as large text.

const PRICE_CLASS_NAME =
  "font-mono text-h2 leading-[1.05] font-medium tabular-nums";
const RECOMMENDED_RULE_CLASS_NAME = "shadow-[inset_0_3px_0_var(--cta)]";
const ROW_LABEL_CLASS_NAME =
  "w-32.5 px-4 py-3.5 text-left align-top font-mono text-label font-normal text-muted";
const ROW_HEADER_CLASS_NAME = `${ROW_LABEL_CLASS_NAME} border-t border-rule`;
const CELL_CLASS_NAME = "border-t border-rule px-4 py-3.5 text-left align-top";

function RecommendedTag({ className }: { className: string }) {
  return (
    <span className={`font-mono text-label font-normal text-ink ${className}`}>
      Recommended
    </span>
  );
}

function PlanPrice({ plan }: { plan: PricingPlan }) {
  return (
    <span
      className={`${PRICE_CLASS_NAME} ${plan.highlighted ? "text-fig" : ""}`}
    >
      {plan.price}
    </span>
  );
}

function FeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="m-0 grid list-none gap-1.25 p-0 text-small">
      {features.map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
  );
}

function PlanAction({
  plan,
  isCompact = false,
}: {
  plan: PricingPlan;
  isCompact?: boolean;
}) {
  return (
    <ButtonLink
      variant={plan.highlighted ? "primary" : "secondary"}
      isBlock
      isCompact={isCompact}
      href={getPlanHref(plan)}
    >
      {plan.cta}
    </ButtonLink>
  );
}

/** The Recommended plan's island head: pale purple under a 3 px CTA rule. */
function getIslandHeadClassName(plan: PricingPlan): string {
  return plan.highlighted ? `hl ${RECOMMENDED_RULE_CLASS_NAME}` : "";
}

/** Cells of the Recommended column carry the island, except the action row. */
function getPlanCellClassName(plan: PricingPlan): string {
  return plan.highlighted ? `${CELL_CLASS_NAME} hl` : CELL_CLASS_NAME;
}

function PricingTable() {
  return (
    <table
      aria-labelledby="plans-heading"
      className="hidden w-full table-fixed border-collapse border border-rule bg-cell text-small min-[900px]:table"
    >
      <thead>
        <tr>
          <th scope="col" className={`${ROW_LABEL_CLASS_NAME} pt-4.5`}>
            Plan
          </th>
          {pricingPlans.map((plan) => (
            <th
              key={plan.name}
              scope="col"
              className={`px-4 pt-4.5 pb-3.5 text-left align-top text-h3 font-semibold ${getIslandHeadClassName(
                plan,
              )}`}
            >
              {plan.name}
              {plan.highlighted && <RecommendedTag className="mt-1 block" />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" className={ROW_HEADER_CLASS_NAME}>
            Per user / month
          </th>
          {pricingPlans.map((plan) => (
            <td key={plan.name} className={getPlanCellClassName(plan)}>
              <PlanPrice plan={plan} />
            </td>
          ))}
        </tr>
        <tr>
          <th scope="row" className={ROW_HEADER_CLASS_NAME}>
            For
          </th>
          {pricingPlans.map((plan) => (
            <td
              key={plan.name}
              className={`${getPlanCellClassName(plan)} text-muted`}
            >
              {plan.description}
            </td>
          ))}
        </tr>
        <tr>
          <th scope="row" className={ROW_HEADER_CLASS_NAME}>
            Includes
          </th>
          {pricingPlans.map((plan) => (
            <td key={plan.name} className={getPlanCellClassName(plan)}>
              <FeatureList features={plan.features} />
            </td>
          ))}
        </tr>
        <tr>
          <td className={CELL_CLASS_NAME} />
          {pricingPlans.map((plan) => (
            <td key={plan.name} className={CELL_CLASS_NAME}>
              <PlanAction plan={plan} isCompact />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function StackedPlans() {
  return (
    <div className="grid border border-rule bg-cell min-[900px]:hidden">
      {pricingPlans.map((plan) => (
        <section
          key={plan.name}
          data-testid="plan-block"
          className="border-t border-rule first:border-t-0"
        >
          <div
            className={`grid gap-2.5 px-4.5 pt-4.5 pb-3 ${getIslandHeadClassName(
              plan,
            )}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="m-0 text-h3 leading-tight font-semibold">
                {plan.name}
                {plan.highlighted && <RecommendedTag className="ml-1.5" />}
              </h3>
              <span>
                <PlanPrice plan={plan} />{" "}
                <span className="font-mono text-label text-muted">
                  / user / month
                </span>
              </span>
            </div>
            <p className="m-0 text-small text-muted">
              <b className="mr-1.5 font-mono text-label font-normal">For</b>
              {plan.description}
            </p>
            <FeatureList features={plan.features} />
          </div>
          <div className="px-4.5 pt-1.5 pb-4.5">
            <PlanAction plan={plan} />
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Pricing() {
  return (
    <>
      {/* Type-only hero, left-aligned like every other route. */}
      <section className="grid gap-5.5 px-4 pt-14 pb-12 md:px-7">
        <h1 className="m-0 max-w-[17ch] font-sans text-section leading-[1.04] font-light tracking-tight md:text-display">
          Technology Solutions That Fit Your Budget
        </h1>
        <p className="m-0 max-w-[52ch] text-h3 leading-snug text-muted">
          Enterprise-grade technology solutions without enterprise-level
          complexity or cost. Choose the package that best fits your business
          needs.
        </p>
      </section>

      <section
        aria-labelledby="plans-heading"
        className="grid px-4 pb-8 md:px-7 md:pb-12"
      >
        <h2 id="plans-heading" className="sr-only">
          Plans
        </h2>
        <PricingTable />
        <StackedPlans />
      </section>

      <Section>
        <SectionHead title="Frequently Asked Questions" />
        <FaqList items={FAQ_ITEMS} />
      </Section>

      <Section>
        <SectionHead
          title="Ready to Transform Your Business Technology?"
          lede="Take the first step today to eliminate IT headaches and focus on what you do best: serving your customers and growing your business."
        />
        <div>
          <ButtonLink variant="primary" href="/#contact">
            Get a Business-First IT Assessment
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
