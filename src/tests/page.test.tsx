import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "@/app/page";
import { expectWaypointStops, WAYPOINT_CAPTION } from "./heroExpectations";

// Mock the ContactForm component
jest.mock("@/app/components/ContactForm", () => {
  return function MockContactForm({ className }: { className?: string }) {
    return (
      <div data-testid="contact-form" className={className}>
        Contact Form Mock
      </div>
    );
  };
});

function getHero() {
  return screen.getByRole("heading", { level: 1 }).closest("section")!;
}

describe("Home page", () => {
  it("has a type-only hero with the H1 in Chivo", () => {
    const { container } = render(<Home />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe(
      "Enter it once. Get it right. Bill it on time.",
    );
    expect(
      screen.getByText(
        "Managed IT for firms with 25-100 staff that connects your dispatch, ERP, accounting and CRM.",
      ),
    ).toBeInTheDocument();
    expect(heading).toHaveClass("font-sans", "font-light", "md:text-display");

    // No photo above the fold, or anywhere on the page
    const hero = getHero();
    expect(within(hero).queryByRole("img")).not.toBeInTheDocument();
    expect(hero.querySelector("img, picture")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("links the hero to the contact form and the managed package", () => {
    render(<Home />);

    const hero = getHero();
    expect(
      within(hero).getByRole("link", {
        name: "Get a Business-First IT Assessment",
      }),
    ).toHaveAttribute("href", "#contact");
    expect(
      within(hero).getByRole("link", { name: "See the Managed Package" }),
    ).toHaveAttribute("href", "#solutions");
  });

  it("shows the audience, not a price, in the hero fact line", () => {
    render(<Home />);

    const hero = getHero();
    const facts = within(hero).getByText("25-100");
    expect(facts).toHaveClass("text-ink");
    expect(facts.parentElement?.parentElement).toHaveClass(
      "border-t",
      "font-mono",
    );
    expect(hero).not.toHaveTextContent("$");
  });

  it("plots one job through four systems over the hero's right half", () => {
    render(<Home />);

    const hero = getHero();
    expectWaypointStops(hero);
    expect(within(hero).getByText(WAYPOINT_CAPTION)).toBeInTheDocument();
    expect(hero).toHaveClass("lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]");
  });

  it("lists the four connection problems and Wasted Time in the trap", () => {
    render(<Home />);

    const trap = screen
      .getByRole("heading", { name: "The Reactive IT Trap" })
      .closest("section")!;
    const titles = within(trap)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual([
      "The same information, retyped",
      "Mistakes found by the customer",
      "Invoices that run late",
      "Nothing you can automate",
      "Wasted Time",
    ]);
    expect(trap).not.toHaveTextContent(/Security Threats|Employee Frustration/);
  });

  it("pitches the managed package to 25-100 staff firms, with no prices", () => {
    render(<Home />);

    const solutions = document.getElementById("solutions")!;
    expect(
      within(solutions).getByRole("heading", {
        name: "Managed IT for firms with 25-100 staff",
      }),
    ).toBeInTheDocument();
    expect(solutions).not.toHaveTextContent("$");
    expect(
      within(solutions).getByRole("link", {
        name: "Start Your Free Assessment",
      }),
    ).toHaveAttribute("href", "/security-assessment");
    expect(
      within(solutions).getByRole("link", { name: "See Pricing" }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("has none of the retired home copy", () => {
    const { container } = render(<Home />);

    expect(container).not.toHaveTextContent(
      /away from the desk|Small Business Cloud Bundle|Limited Time Offer|Basic Bundle/i,
    );
  });

  it("lists the connected-systems outcomes and the cost of disconnection", () => {
    render(<Home />);

    const benefits = document.getElementById("benefits")!;
    expect(
      within(benefits).getByRole("heading", {
        name: "What changes when your systems connect",
      }),
    ).toBeInTheDocument();
    expect(within(benefits).getAllByRole("listitem")).toHaveLength(8);
    expect(
      within(benefits).getByText(/Invoices go out the day the job closes/),
    ).toBeInTheDocument();
    expect(benefits).not.toHaveTextContent(/breach|\$108,000|downtime/i);
  });

  it("shows the anonymised proof case with a reference-call CTA", () => {
    render(<Home />);

    const proof = document.getElementById("proof")!;
    expect(proof).toHaveTextContent(
      "A real client, shared with their permission: a logistics firm with around 100 staff",
    );
    expect(proof).toHaveTextContent("Reference call available.");
    expect(
      within(proof).getByRole("link", { name: "Book a reference call" }),
    ).toHaveAttribute("href", "#contact");
  });

  it("numbers the process steps 01 to 03", () => {
    render(<Home />);

    const process = document.getElementById("process")!;
    const steps = within(process).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps.map((step) => step.textContent?.slice(0, 2))).toEqual([
      "01",
      "02",
      "03",
    ]);
  });

  it("lists the three guarantees as a lettered ruled list", () => {
    render(<Home />);

    const guarantees = screen
      .getByRole("heading", { level: 2, name: "Our Guarantees" })
      .closest("section")!;
    const rows = within(guarantees).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[2]).toHaveTextContent(
      /A free written second opinion on any vendor quote/,
    );
  });

  it("shows no price and no plan offer anywhere on the page", () => {
    const { container } = render(<Home />);

    expect(
      screen.queryByRole("link", { name: "Choose A Plan Today" }),
    ).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(/\$\d/);
  });

  it("keeps the in-page anchors, with the form at #contact", () => {
    render(<Home />);

    ["solutions", "process", "benefits", "contact"].forEach((id) => {
      expect(document.getElementById(id)).toBeInTheDocument();
    });
    expect(
      within(document.getElementById("contact")!).getByTestId("contact-form"),
    ).toBeInTheDocument();
  });

  it("uses no Bootstrap layout or component classes", () => {
    const { container } = render(<Home />);

    const classNames = new Set(
      Array.from(container.querySelectorAll("[class]")).flatMap((element) =>
        Array.from(element.classList),
      ),
    );
    const bootstrapClassNames = [...classNames].filter((className) =>
      /^(container|row|col(-\w+)*|card(-\w+)*|btn(-\w+)*|alert(-\w+)*|bg-alt|text-danger-emphasis|fs-\d|fw-\w+|py-md-\d)$/.test(
        className,
      ),
    );
    expect(bootstrapClassNames).toEqual([]);
  });
});
