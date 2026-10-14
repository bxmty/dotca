// Tick list from the Component Spec: a drawn 1.5 px tick in muted ink, in
// place of Bootstrap's green success checkmarks. The tick is a pseudo-element,
// so it is never announced.

export type TickListItem = {
  label: string;
  /** Optional muted line under the label. */
  detail?: string;
};

const TICK_CLASS_NAME =
  "before:mt-1.75 before:ml-0.5 before:h-1.75 before:w-3 before:-rotate-45 before:border-b-[1.5px] before:border-l-[1.5px] before:border-muted before:content-['']";

export default function TickList({
  items,
}: {
  items: readonly TickListItem[];
}) {
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {items.map(({ label, detail }) => (
        <li
          key={label}
          className={`grid grid-cols-[18px_1fr] items-start gap-2.5 ${TICK_CLASS_NAME}`}
        >
          <span>
            {label}
            {detail && (
              <span className="block text-small text-muted">{detail}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
