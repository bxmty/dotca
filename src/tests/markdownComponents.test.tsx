import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { markdownComponents } from "@/app/components/markdownComponents";

// react-markdown is ESM-only, so Jest can't load it; the element overrides
// it is handed are tested directly.

describe("markdownComponents", () => {
  it("renders a markdown blockquote as a pale-purple callout", () => {
    const Blockquote = markdownComponents.blockquote as React.ComponentType<
      React.ComponentProps<"blockquote">
    >;
    render(
      <Blockquote>
        <p>Call them on a number you already have.</p>
      </Blockquote>,
    );

    const callout = screen
      .getByText("Call them on a number you already have.")
      .closest("blockquote");
    expect(callout).toHaveClass("callout", "hl");
  });

  it("renders a markdown h1 as an h2, so the page keeps one h1", () => {
    const Heading = markdownComponents.h1 as React.ComponentType<
      React.ComponentProps<"h1">
    >;
    render(<Heading>Body title</Heading>);

    expect(
      screen.getByRole("heading", { level: 2, name: "Body title" }),
    ).toBeInTheDocument();
  });
});
