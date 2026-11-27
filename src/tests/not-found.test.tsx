import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotFound from "@/app/not-found";

describe("NotFound page", () => {
  it("says the page was not found", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("offers the way home as a secondary button, leaving the nav CTA as the one primary", () => {
    render(<NotFound />);

    const homeLink = screen.getByRole("link", { name: "Return to home" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveClass("border-ink", "rounded-ctl");
    expect(homeLink).not.toHaveClass("btn");
  });
});
