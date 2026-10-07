import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "@/app/components/Navbar";

describe("Navbar mobile toggle", () => {
  it("toggles aria-expanded and label between Menu and Close", () => {
    render(<Navbar />);
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "navbarNav");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes the panel when a nav link is clicked", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("link", { name: "Blog" }));
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("Navbar brand", () => {
  it("links home through the Boximity logo", () => {
    render(<Navbar />);

    const home = screen.getByRole("link", { name: "Boximity" });
    expect(home).toHaveAttribute("href", "/");
    expect(
      within(home).getByRole("img", { name: "Boximity" }),
    ).toBeInTheDocument();
  });
});
