import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Technical Manual buttons (docs/design/component-spec.html): one line each,
// 2 px corners, primary or secondary, and a ruled disabled state (cell fill,
// --field edge, muted label) instead of a faded CTA. Hover sits behind
// `enabled:` so it never fights the disabled look.

export type ButtonVariant = "primary" | "secondary";

type ButtonStyle = {
  variant: ButtonVariant;
  /** Full width, as in the phone menu and the pricing sheet. */
  isBlock?: boolean;
  className?: string;
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-ctl border px-5 py-3.5 min-h-12 font-sans text-body font-semibold leading-none no-underline whitespace-nowrap cursor-pointer disabled:bg-cell disabled:border-field disabled:text-muted disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cta text-cta-ink border-transparent enabled:hover:brightness-108",
  secondary:
    "bg-transparent text-ink border-ink enabled:hover:bg-ink enabled:hover:text-bg",
};

export function getButtonClassName({
  variant,
  isBlock = false,
  className,
}: ButtonStyle): string {
  return [
    BASE_CLASSES,
    variantClasses[variant],
    isBlock ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonStyle &
  Omit<ComponentProps<"button">, "className"> & { children: ReactNode };

export function Button({
  variant,
  isBlock,
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClassName({ variant, isBlock, className })}
      {...buttonProps}
    />
  );
}

type ButtonLinkProps = ButtonStyle &
  Omit<ComponentProps<typeof Link>, "className"> & { children: ReactNode };

export function ButtonLink({
  variant,
  isBlock,
  className,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ variant, isBlock, className })}
      {...linkProps}
    />
  );
}
