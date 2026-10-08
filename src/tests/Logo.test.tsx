import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Logo from "@/app/components/Logo";

describe("Logo", () => {
  it("renders the lockup as an image named Boximity", () => {
    render(<Logo />);

    expect(screen.getByRole("img", { name: "Boximity" })).toBeInTheDocument();
  });

  it("paints with currentColor so the --logo token colours it", () => {
    render(<Logo />);

    const logo = screen.getByRole("img", { name: "Boximity" });
    expect(logo).toHaveAttribute("fill", "currentColor");
    expect(logo).toHaveClass("text-logo");
  });

  it("sizes by height and keeps the lockup's aspect ratio", () => {
    render(<Logo height={34} />);

    const logo = screen.getByRole("img", { name: "Boximity" });
    expect(logo).toHaveAttribute("height", "34");
    expect(logo).toHaveAttribute("viewBox", "0 0 594.43 188.67");
    // 34 * 594.43 / 188.67, rounded to two places
    expect(logo).toHaveAttribute("width", "107.12");
  });

  it("accepts extra classes without dropping the token colour", () => {
    render(<Logo className="block" />);

    const logo = screen.getByRole("img", { name: "Boximity" });
    expect(logo).toHaveClass("block", "text-logo");
  });
});
