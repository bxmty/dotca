import Link from "next/link";
import type { ComponentProps } from "react";

// Running-text link from the Component Spec: ink text with a 1 px accent
// underline that thickens to 2 px on hover. --fig is band-fig on the oxford
// band, so the same class reads on both grounds.
export const TEXT_LINK_CLASS_NAME =
  "text-ink underline decoration-fig decoration-1 underline-offset-3 hover:decoration-2";

type TextLinkProps = ComponentProps<typeof Link>;

export default function TextLink({ className, ...linkProps }: TextLinkProps) {
  return (
    <Link
      className={
        className
          ? `${TEXT_LINK_CLASS_NAME} ${className}`
          : TEXT_LINK_CLASS_NAME
      }
      {...linkProps}
    />
  );
}
