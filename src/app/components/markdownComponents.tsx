import type { ComponentProps } from "react";

// Element overrides for react-markdown in blog posts. Kept apart from the
// page so they can be tested: react-markdown is ESM-only and Jest can't load
// it. Only children are passed on, which drops
// react-markdown's `node` prop before it reaches the DOM.

/** A markdown blockquote (`> ...`) is a callout: the pale-purple .hl island. */
function Callout({ children }: Pick<ComponentProps<"blockquote">, "children">) {
  return <blockquote className="callout hl">{children}</blockquote>;
}

/**
 * The page already sets the post title as its h1, so a `# ...` line in the
 * body renders one level down rather than as a second page title.
 */
function BodyTitle({ children }: Pick<ComponentProps<"h1">, "children">) {
  return <h2>{children}</h2>;
}

export const markdownComponents = {
  blockquote: Callout,
  h1: BodyTitle,
};
