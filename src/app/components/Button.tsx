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
  /** 14 px label and 12 px padding, so four plans fit the pricing sheet. */
  isCompact?: boolean;
  className?: string;
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-ctl border min-h-12 font-sans font-semibold leading-none no-underline whitespace-nowrap cursor-pointer disabled:bg-cell disabled:border-field disabled:text-muted disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cta text-cta-ink border-transparent enabled:hover:brightness-108",
  secondary:
    "bg-transparent text-ink border-ink enabled:hover:bg-ink enabled:hover:text-bg",
};

const DEFAULT_SIZE_CLASSES = "px-5 py-3.5 text-body";
const COMPACT_SIZE_CLASSES = "p-3 text-small";

export function getButtonClassName({
  variant,
  isBlock = false,
  isCompact = false,
  className,
}: ButtonStyle): string {
  return [
    BASE_CLASSES,
    isCompact ? COMPACT_SIZE_CLASSES : DEFAULT_SIZE_CLASSES,
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
  isCompact,
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClassName({ variant, isBlock, isCompact, className })}
      {...buttonProps}
    />
  );
}

type ButtonLinkProps = ButtonStyle &
  Omit<ComponentProps<typeof Link>, "className"> & { children: ReactNode };

export function ButtonLink({
  variant,
  isBlock,
  isCompact,
  className,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ variant, isBlock, isCompact, className })}
      {...linkProps}
    />
  );
}

type UnboxLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  children: ReactNode;
  /** What happens next, shown inside the box once the lid opens. */
  peek: string;
};

// The standout CTA: the button is a box. The lid carries the label; on hover
// or focus it flips open on its back edge and the oxford interior says what
// happens next. Only the lid is read aloud, the interior is decoration. Under
// reduced motion the lid simply gives way, with no flip. Use it once per page,
// at the end CTA: the Technical Manual rations its accents.
export function UnboxLink({ children, peek, ...linkProps }: UnboxLinkProps) {
  return (
    <Link
      className="group relative inline-block min-h-13 min-w-0 rounded-ctl no-underline [perspective:700px] max-sm:block sm:min-w-82"
      {...linkProps}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-ctl border border-band-fig bg-band font-mono text-small text-band-ink"
      >
        <span className="text-band-fig">&gt;</span>
        {peek}
      </span>
      <span className="relative flex min-h-13 [transform-origin:50%_0] items-center justify-center gap-2.5 rounded-ctl bg-cta px-5 py-3.5 text-body leading-none font-semibold text-cta-ink transition-[transform,filter] duration-450 ease-[cubic-bezier(.3,1.25,.5,1)] [backface-visibility:hidden] group-hover:brightness-92 group-hover:[transform:rotateX(-118deg)] group-focus-visible:[transform:rotateX(-118deg)] group-active:[transform:rotateX(-118deg)_scale(.98)] motion-reduce:transition-none motion-reduce:group-hover:[transform:none] motion-reduce:group-hover:opacity-0 motion-reduce:group-focus-visible:[transform:none] motion-reduce:group-focus-visible:opacity-0 max-sm:text-center sm:whitespace-nowrap">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 -ml-1.25 w-2.5 bg-[color-mix(in_srgb,var(--cta-ink)_14%,transparent)]"
        />
        <span className="relative">{children}</span>
        <span aria-hidden="true" className="relative font-mono font-normal">
          &rarr;
        </span>
      </span>
    </Link>
  );
}
