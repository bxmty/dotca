import type { ReactNode } from "react";

// Steps from the Component Spec: numbered because the order is real. The
// numeral is mono ink on a rule, never the accent. The <ol> carries the
// position for assistive tech, so the drawn numeral is hidden from it.

export type Step = {
  title: string;
  body: ReactNode;
};

export default function Steps({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 p-0 min-[700px]:gap-0">
      {steps.map(({ title, body }, index) => (
        <li key={title} className="grid content-start gap-2 pr-6">
          <span
            aria-hidden="true"
            className="mb-1.5 border-b border-rule pb-3 font-mono text-h2 leading-none font-medium text-ink"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="m-0 text-h3 leading-tight font-semibold">{title}</h3>
          <div className="text-small text-muted">{body}</div>
        </li>
      ))}
    </ol>
  );
}
