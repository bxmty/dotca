import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "@/app/page";

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
    // A word joiner and no-break space keep the dash off the line start
    expect(heading.textContent).toMatch(
      /IT that just works\u2060\u00a0— for businesses whose work happens away from the desk\./,
    );
    expect(heading).toHaveClass("font-sans", "font-light", "md:text-display");

    // No photo above the fold, or anywhere on the page
    const hero = getHero();
    expect(within(hero).queryByRole("img")).not.toBeInTheDocument();
    expect(hero.querySelector("img, picture")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("links the hero to the contact form and the pricing page", () => {
    render(<Home />);

    const hero = getHero();
    expect(
      within(hero).getByRole("link", {
        name: "Get a Business-First IT Assessment",
      }),
    ).toHaveAttribute("href", "#contact");
    expect(
      within(hero).getByRole("link", { name: "See Pricing Options" }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("shows the published price in the hero fact line", () => {
    render(<Home />);

    const facts = within(getHero()).getByText("$99");
    expect(facts).toHaveClass("text-fig");
    expect(facts.parentElement?.parentElement).toHaveClass(
      "border-t",
      "font-mono",
    );
  });

  it("renders all four key figures, with no source lines yet", () => {
    render(<Home />);

    const figures = screen.getByText("$108,000").closest("ul")!;
    expect(within(figures).getAllByRole("listitem")).toHaveLength(4);
    expect(figures).toHaveTextContent("Up to2weeks");
    expect(figures).toHaveTextContent("up to22%");
    expect(figures).toHaveTextContent("$108,000");
    expect(figures).toHaveTextContent("60%higher");
    expect(within(figures).queryByText(/^Source:/)).not.toBeInTheDocument();
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

  it("makes a single offer", () => {
    render(<Home />);

    expect(
      screen.getAllByRole("link", { name: "Choose A Plan Today" }),
    ).toHaveLength(1);
    expect(
      screen.getByText("First month free when you sign up for annual service"),
    ).toHaveClass("font-mono");
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
    expect(container.querySelector("[data-bs-theme]")).toBeNull();
  });
});
