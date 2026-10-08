import type { ReactNode } from "react";

// The ruled grid replaces Bootstrap's card rows (Component Spec): cells share
// hairline rules, with no shadows and no icon discs. Cells stack under a
// rule each on phones and sit side by side, divided by vertical rules, from
// 700 px.

export type RuledGridItem = {
  /** Optional muted mono label above the heading. */
  kicker?: string;
  title: string;
  body: ReactNode;
};

export default function RuledGrid({
  items,
}: {
  items: readonly RuledGridItem[];
}) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] border-t border-rule p-0">
      {items.map(({ kicker, title, body }) => (
        <li
          key={title}
          className="grid content-start gap-2 border-b border-rule pt-4.5 pr-5 pb-5.5 min-[700px]:border-b-0 min-[700px]:pr-7 min-[700px]:[&+&]:border-l min-[700px]:[&+&]:pl-5"
        >
          {kicker && (
            <p className="m-0 font-mono text-label text-muted">{kicker}</p>
          )}
          <h3 className="m-0 text-h3 leading-tight font-semibold">{title}</h3>
          <div className="text-small text-muted">{body}</div>
        </li>
      ))}
    </ul>
  );
}
