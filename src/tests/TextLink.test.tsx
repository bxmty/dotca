import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TextLink from "@/app/components/TextLink";

describe("TextLink", () => {
  it("underlines in the accent and thickens on hover", () => {
    render(<TextLink href="/pricing">pricing</TextLink>);

    expect(screen.getByRole("link", { name: "pricing" })).toHaveClass(
      "text-ink",
      "underline",
      "decoration-fig",
      "decoration-1",
      "hover:decoration-2",
    );
  });

  it("keeps the link style when given extra classes", () => {
    render(
      <TextLink href="/" className="text-small">
        home
      </TextLink>,
    );

    expect(screen.getByRole("link", { name: "home" })).toHaveClass(
      "text-small",
      "decoration-fig",
    );
  });
});
