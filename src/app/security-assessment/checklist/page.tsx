import { ButtonLink } from "@/app/components/Button";
import PageHero from "@/app/components/PageHero";
import Section from "@/app/components/Section";
import SectionHead from "@/app/components/SectionHead";
import Steps from "@/app/components/Steps";
import { securityChecklistItems } from "./checklist-items";

const checklistSteps = securityChecklistItems.map((item) => ({
  title: item.title,
  body: item.detail,
}));

export default function SecurityChecklistPage() {
  return (
    <>
      <PageHero
        heading="The 10-Point Small Business Security Checklist"
        lead="The ten highest-impact security fixes for a small business, in priority order. Most take under an hour; together they close the gaps behind the large majority of small-business incidents."
        facts={
          <>
            <span>Free resource</span>
            <span>Priority order</span>
            <span>No signup required</span>
          </>
        }
      />

      <Section>
        <SectionHead
          title="Work down the list"
          lede="Print it, work through it, done. The order matters — start at one and keep going."
        />
        <Steps steps={checklistSteps} />
      </Section>

      <Section>
        <SectionHead
          title="Want a second pair of eyes?"
          lede="If you'd rather have someone walk through your setup with you, we do free, no-pressure consultations for small businesses across Ontario."
        />
        <div>
          <ButtonLink variant="primary" href="/#contact">
            Book a free consultation
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
