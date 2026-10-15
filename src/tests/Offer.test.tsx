import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Offer from "@/app/components/Offer";

const offer = {
  title: "Complete Bundle",
  price: "$99",
  priceUnit: "per user per month",
  action: { href: "/pricing", label: "Choose A Plan Today" },
  terms: "First month free when you sign up for annual service",
  includes: ["Password Manager", "Web Hosting", "Business Email"],
};

describe("Offer", () => {
  it("shows the price in mono accent with the per line, action and terms", () => {
    render(<Offer {...offer} />);

    expect(screen.getByText("$99")).toHaveClass(
      "font-mono",
      "text-h2",
      "text-fig",
    );
    expect(screen.getByText("per user per month")).toHaveClass(
      "font-mono",
      "text-label",
      "text-muted",
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Complete Bundle" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Choose A Plan Today" }),
    ).toHaveAttribute("href", "/pricing");
    // A mono terms line, not a green alert box
    const terms = screen.getByText(offer.terms);
    expect(terms).toHaveClass("font-mono", "text-label", "border-t");
    expect(terms).not.toHaveClass("alert");
  });

  it("lists what's included in the second ruled cell", () => {
    render(<Offer {...offer} />);

    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      offer.includes,
    );
  });
});
