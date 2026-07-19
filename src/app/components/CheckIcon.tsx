/**
 * Decorative checkmark used in feature lists. Marked aria-hidden because it
 * only decorates adjacent text and should not be announced by screen readers.
 */
export default function CheckIcon({
  size = 24,
  filled = false,
  className = "text-success-emphasis flex-shrink-0 me-2",
}: {
  size?: number;
  /** Filled circle-less glyph used on service pages; stroke check elsewhere */
  filled?: boolean;
  className?: string;
}) {
  if (filled) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        width={size}
        height={size}
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
