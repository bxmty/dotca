import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ServiceLandingPage, {
  type ServiceLandingContent,
} from "@/app/services/ServiceLandingPage";
import ArchitectureFirmsPage from "@/app/services/it-services-for-architecture-firms/page";
import { architectureFirmsContent } from "@/app/services/it-services-for-architecture-firms/content";
import OntarioPage from "@/app/services/managed-it-services-ontario/page";
import { ontarioContent } from "@/app/services/managed-it-services-ontario/content";

// Representative content: every optional section is present, and the key
// figures include one with a source and one without (decision 5).
const content: ServiceLandingContent = {
  hero: {
    heading: "IT Services for Test Firms",
    lead: "Managed IT for firms that test things.",
    trustLine: "Serving test firms across Canada",
    imageAlt: "Unused since the hero went type-only",
    card: {
      intro: "Everything your test team needs:",
      items: ["24/7 Proactive Monitoring", "Unlimited Help Desk Support"],
    },
  },
  pricingNote: "See pricing page for full details and team sizes",
  trustSignal: "Trusted by test firms since 2020",
  keyFigures: [
    {
      value: "15",
      unit: "minutes",
      label: "average help desk response",
      source: "Boximity ticket data, 2025",
    },
    { value: "$1,250", label: "per month for five users" },
  ],
  why: {
    heading: "Why Test Firms Need IT",
    cards: [
      { icon: "lock", title: "Protect Test Data", body: "Data body." },
      { icon: "clock", title: "Meet Deadlines", body: "Deadline body." },
    ],
  },
  what: {
    heading: "What Is Test IT?",
    paragraphs: ["First paragraph about test IT.", "Second paragraph."],
    highlight: { title: "Test-First Approach", body: "Highlight body." },
    components: {
      heading: "Key Components",
      tiles: [
        { emoji: "🔒", label: "Security" },
        { emoji: "💾", label: "Backup" },
      ],
    },
  },
  pack: {
    heading: "Cloud 5 Pack for Test Firms",
    groups: [
      { title: "Cybersecurity", items: ["Endpoint protection"] },
      { title: "Backup", items: ["Daily backups", "Restore testing"] },
    ],
  },
  serviceAreas: {
    heading: "Test Coverage",
    lead: "We cover the test region.",
    areas: [
      {
        emoji: "🏢",
        name: "Testville",
        description: "Where the tests live.",
        coverageNote: "Onsite and remote support",
      },
    ],
    footer: "Don't see your city?",
    ctaLabel: "Check Service Availability",
  },
  faq: {
    heading: "Test FAQ",
    items: [
      { question: "First question?", answer: "First answer." },
      { question: "Second question?", answer: "Second answer." },
    ],
  },
  finalCta: {
    heading: "Ready to Test?",
    lead: "Start with a free IT assessment today.",
  },
};

function getSectionByHeading(name: string) {
  return screen.getByRole("heading", { level: 2, name }).closest("section")!;
}

describe("ServiceLandingPage", () => {
  it("has a type-only hero with the H1, both actions and the fact line", () => {
    const { container } = render(<ServiceLandingPage content={content} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("IT Services for Test Firms");
    expect(heading).toHaveClass("font-sans", "font-light", "md:text-display");

    const hero = heading.closest("section")!;
    expect(
      within(hero).getByText("Managed IT for firms that test things."),
    ).toBeInTheDocument();
    expect(
      within(hero).getByRole("link", { name: "Get Free IT Assessment" }),
    ).toHaveAttribute("href", "/#contact");
    expect(
      within(hero).getByRole("link", { name: "View Cloud 5 Pack Pricing" }),
    ).toHaveAttribute("href", "/pricing");

    // The price is the accent in the fact line; the trust lines ride along
    expect(within(hero).getByText("$1,250")).toHaveClass("text-fig");
    expect(
      within(hero).getByText("Serving test firms across Canada"),
    ).toBeInTheDocument();
    expect(
      within(hero).getByText("Trusted by test firms since 2020"),
    ).toBeInTheDocument();

    // The H1 is the LCP element: no photo anywhere on the page
    expect(container.querySelector("img, picture")).toBeNull();
  });

  it("renders the why cards as a ruled grid under a section head", () => {
    render(<ServiceLandingPage content={content} />);

    const why = getSectionByHeading("Why Test Firms Need IT");
    // The first list is the grid; the key figures follow it
    const grid = within(why).getAllByRole("list")[0];
    expect(within(grid).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(why).getByRole("heading", { level: 3, name: "Protect Test Data" }),
    ).toBeInTheDocument();
    expect(within(why).getByText("Deadline body.")).toBeInTheDocument();
    // No icon discs
    expect(why.querySelector("svg")).toBeNull();
  });

  it("renders key figures, with a source line only where one is given", () => {
    render(<ServiceLandingPage content={content} />);

    const sourced = screen.getByText("average help desk response");
    expect(screen.getByText("15")).toHaveClass("font-mono", "text-fig");
    expect(
      within(sourced.parentElement!).getByText(
        "Source: Boximity ticket data, 2025",
      ),
    ).toBeInTheDocument();

    const unsourced = screen.getByText("per month for five users");
    expect(
      within(unsourced.parentElement!).queryByText(/^Source:/),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Source:/)).toHaveLength(1);
  });

  it("leaves out key figures when the content has none", () => {
    render(
      <ServiceLandingPage content={{ ...content, keyFigures: undefined }} />,
    );
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("average help desk response"),
    ).not.toBeInTheDocument();
  });

  it("renders the what section with its highlight and components", () => {
    render(<ServiceLandingPage content={content} />);

    const what = getSectionByHeading("What Is Test IT?");
    expect(
      within(what).getByText("First paragraph about test IT."),
    ).toBeInTheDocument();
    const highlight = within(what)
      .getByRole("heading", { name: "Test-First Approach" })
      .closest(".hl");
    expect(highlight).not.toBeNull();
    expect(within(what).getByText("Security")).toBeInTheDocument();
    expect(within(what).getByText("Backup")).toBeInTheDocument();
  });

  it("renders one offer with the pack groups beside it", () => {
    render(<ServiceLandingPage content={content} />);

    const pack = getSectionByHeading("Cloud 5 Pack for Test Firms");
    expect(
      within(pack).getByText("Everything your test team needs:"),
    ).toBeInTheDocument();

    // A single offer: one price, one action
    expect(
      within(pack).getByRole("heading", { level: 3, name: "Cloud 5 Pack" }),
    ).toBeInTheDocument();
    expect(within(pack).getAllByText("$1,250")).toHaveLength(1);
    expect(
      within(pack).getByRole("link", { name: "Start Your Free Assessment" }),
    ).toHaveAttribute("href", "/#contact");
    expect(
      within(pack).getByText(/No contracts · 30-day money-back guarantee/),
    ).toBeInTheDocument();
    expect(
      within(pack).getByText("24/7 Proactive Monitoring"),
    ).toBeInTheDocument();

    expect(
      within(pack).getByRole("heading", { level: 3, name: "Backup" }),
    ).toBeInTheDocument();
    expect(within(pack).getByText("Restore testing")).toBeInTheDocument();
    expect(
      within(pack).getByRole("link", {
        name: "See pricing page for full details and team sizes",
      }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("renders the service areas when given", () => {
    render(<ServiceLandingPage content={content} />);

    const areas = getSectionByHeading("Test Coverage");
    expect(within(areas).getByText("We cover the test region.")).toBeVisible();
    expect(
      within(areas).getByRole("heading", { level: 3, name: "Testville" }),
    ).toBeInTheDocument();
    expect(
      within(areas).getByText("Onsite and remote support"),
    ).toBeInTheDocument();
    expect(
      within(areas).getByRole("link", { name: "Check Service Availability" }),
    ).toHaveAttribute("href", "/#contact");
  });

  it("leaves out the service areas and trust signal when absent", () => {
    render(
      <ServiceLandingPage
        content={{
          ...content,
          serviceAreas: undefined,
          trustSignal: undefined,
        }}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Test Coverage" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Trusted by test firms since 2020"),
    ).not.toBeInTheDocument();
  });

  it("renders the FAQ as independent details, all starting closed", () => {
    render(<ServiceLandingPage content={content} />);

    const faq = getSectionByHeading("Test FAQ");
    const details = faq.querySelectorAll("details");
    expect(details).toHaveLength(2);
    details.forEach((item) => {
      expect(item).not.toHaveAttribute("open");
      expect(item).not.toHaveAttribute("name");
    });
    expect(
      within(faq).getByText("First question?").closest("summary"),
    ).not.toBeNull();
    expect(within(faq).getByText("Second answer.")).toBeInTheDocument();
  });

  it("closes with the final call to action", () => {
    render(<ServiceLandingPage content={content} />);

    const cta = getSectionByHeading("Ready to Test?");
    expect(
      within(cta).getByText("Start with a free IT assessment today."),
    ).toBeInTheDocument();
    expect(
      within(cta).getByRole("link", { name: "Get Free IT Assessment" }),
    ).toHaveAttribute("href", "/#contact");
    expect(
      within(cta).getByRole("link", { name: "View All Pricing Options" }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("uses no Bootstrap layout or component classes", () => {
    const { container } = render(<ServiceLandingPage content={content} />);

    const classNames = new Set(
      Array.from(container.querySelectorAll("[class]")).flatMap((element) =>
        Array.from(element.classList),
      ),
    );
    const bootstrapClassNames = [...classNames].filter((className) =>
      /^(container|row|col(-\w+)*|card(-\w+)*|btn(-\w+)*|accordion(-\w+)*|bg-alt|bg-primary|text-white|text-body-secondary|fs-\d|fw-\w+|py-md-\d|position-\w+|d-flex)$/.test(
        className,
      ),
    );
    expect(bootstrapClassNames).toEqual([]);
  });
});

function getJsonLd(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll('script[type="application/ld+json"]'),
  ).map((script) => JSON.parse(script.innerHTML));
}

describe.each([
  {
    name: "/services/it-services-for-architecture-firms",
    Page: ArchitectureFirmsPage,
    pageContent: architectureFirmsContent,
  },
  {
    name: "/services/managed-it-services-ontario",
    Page: OntarioPage,
    pageContent: ontarioContent,
  },
])("$name", ({ Page, pageContent }) => {
  it("renders from its content object", () => {
    render(<Page />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      pageContent.hero.heading,
    );
    for (const heading of [
      pageContent.why.heading,
      pageContent.what.heading,
      pageContent.pack.heading,
      pageContent.faq.heading,
      pageContent.finalCta.heading,
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: heading }),
      ).toBeInTheDocument();
    }
    expect(document.querySelectorAll("details")).toHaveLength(
      pageContent.faq.items.length,
    );
  });

  it("keeps the FAQPage JSON-LD unchanged", () => {
    const { container } = render(<Page />);

    const faqPage = getJsonLd(container).find(
      (item) => item["@type"] === "FAQPage",
    );
    // Spelled out rather than built with getFAQPageSchema, so a change to
    // either the builder or the page's wiring shows up here.
    expect(faqPage).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pageContent.faq.items.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
  });
});
