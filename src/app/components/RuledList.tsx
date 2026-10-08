import type { ReactNode } from "react";

// A ruled list with a muted mono letter per row (Component Spec,
// guarantees). Letters, not numbers: A–C marks the rows as a set rather
// than a ranking, so this is a <ul>.

const FIRST_LETTER_CODE = "A".charCodeAt(0);

export default function RuledList({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="m-0 grid max-w-[780px] list-none border-t border-rule p-0">
      {items.map((item, index) => (
        <li
          key={index}
          className="grid grid-cols-[3rem_1fr] gap-3 border-b border-rule py-4 text-prose leading-snug"
        >
          <span
            aria-hidden="true"
            className="pt-[0.35em] font-mono text-label font-medium text-muted"
          >
            {String.fromCharCode(FIRST_LETTER_CODE + index)}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
