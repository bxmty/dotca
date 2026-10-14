import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Button,
  ButtonLink,
  getButtonClassName,
} from "@/app/components/Button";

describe("Button", () => {
  it("draws the primary variant on the CTA tokens", () => {
    render(<Button variant="primary">Pay $249.00</Button>);

    const button = screen.getByRole("button", { name: "Pay $249.00" });
    expect(button).toHaveClass("bg-cta", "text-cta-ink");
    expect(button).toHaveAttribute("type", "button");
  });

  it("draws the secondary variant as an ink outline", () => {
    render(<Button variant="secondary">See pricing</Button>);

    expect(screen.getByRole("button", { name: "See pricing" })).toHaveClass(
      "border-ink",
      "text-ink",
      "bg-transparent",
    );
  });

  it("draws the disabled state as a ruled, muted control", () => {
    render(
      <Button variant="primary" disabled>
        Pay $249.00
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Pay $249.00" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      "disabled:bg-cell",
      "disabled:border-field",
      "disabled:text-muted",
      "disabled:cursor-not-allowed",
    );
    expect(button.className).not.toMatch(/opacity/);
  });

  it("keeps every variant on one line with 2px corners", () => {
    for (const variant of ["primary", "secondary"] as const) {
      const classes = getButtonClassName({ variant }).split(" ");
      expect(classes).toEqual(
        expect.arrayContaining(["whitespace-nowrap", "rounded-ctl"]),
      );
    }
  });

  it("draws the compact size at 14 px with 12 px padding", () => {
    const classes = getButtonClassName({
      variant: "secondary",
      isCompact: true,
    }).split(" ");

    expect(classes).toEqual(expect.arrayContaining(["text-small", "p-3"]));
    expect(classes).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^(text-body|px-5)$/)]),
    );
  });

  it("passes a submit type through", () => {
    render(
      <Button variant="primary" type="submit">
        Send
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});

describe("ButtonLink", () => {
  it("renders a link styled as a button", () => {
    render(
      <ButtonLink href="/pricing" variant="secondary">
        See pricing
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "See pricing" });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(link).toHaveClass("border-ink", "rounded-ctl");
  });

  it("offers a full-width block with a 48px target", () => {
    const classes = getButtonClassName({
      variant: "primary",
      isBlock: true,
    }).split(" ");

    expect(classes).toEqual(expect.arrayContaining(["w-full", "min-h-12"]));
    expect(getButtonClassName({ variant: "primary" })).not.toMatch(/w-full/);
  });

  it("appends extra classes", () => {
    render(
      <ButtonLink href="/book" variant="primary" className="mt-6">
        Book
      </ButtonLink>,
    );

    expect(screen.getByRole("link", { name: "Book" })).toHaveClass(
      "mt-6",
      "bg-cta",
    );
  });
});
