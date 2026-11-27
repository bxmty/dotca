export interface FaqItem {
  question: string;
  answer: string;
}

// FAQ from the Component Spec: native <details> between hairline rules.
// Items open independently and all start closed. The marker is a mono "+"
// in ink that turns to "×" when open; it's a pseudo-element, so it is never
// announced.

const SUMMARY_CLASS_NAME =
  "grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_24px] items-start gap-4 py-4 [&::-webkit-details-marker]:hidden after:text-center after:font-mono after:text-h3 after:leading-none after:text-ink after:transition-transform after:content-['+'] group-open:after:rotate-45 motion-reduce:after:transition-none";

export default function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="max-w-[780px] border-t border-rule">
      {items.map((item) => (
        <details key={item.question} className="group border-b border-rule">
          <summary className={SUMMARY_CLASS_NAME}>
            <h3 className="m-0 text-prose leading-snug font-semibold">
              {item.question}
            </h3>
          </summary>
          <p className="m-0 max-w-[66ch] pr-10 pb-4.5 text-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
