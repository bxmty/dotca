// Key figures from the Component Spec: a 28 px mono number in the accent,
// qualifier and unit words in 14 px muted sans, a muted label, and an
// optional source line (decision 5, msp-playbook#165). Without a source the
// line isn't rendered at all, so the cell closes up under the label.

export type KeyFigureProps = {
  /** The number, with the symbols that belong to it ($ % ,). Mono. */
  value: string;
  /** Words before the number, e.g. "Up to". Sans, muted. */
  prefix?: string;
  /** Words after the number, e.g. "weeks". Sans, muted. */
  unit?: string;
  label: string;
  /** Where the figure comes from. Omit until the claim is sourced. */
  source?: string;
};

const WORD_CLASS_NAME = "font-sans text-small font-normal text-muted";

export default function KeyFigure({
  value,
  prefix,
  unit,
  label,
  source,
}: KeyFigureProps) {
  return (
    <div className="grid content-start gap-1">
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5">
        {prefix && <span className={WORD_CLASS_NAME}>{prefix}</span>}
        <span className="font-mono text-h2 leading-tight font-medium text-fig tabular-nums">
          {value}
        </span>
        {unit && <span className={WORD_CLASS_NAME}>{unit}</span>}
      </p>
      <p className="m-0 text-small text-muted">{label}</p>
      {source && (
        <p className="m-0 font-mono text-label text-muted">Source: {source}</p>
      )}
    </div>
  );
}

/** Figures side by side in one ruled sheet, stacking below 700 px. */
export function KeyFigureGrid({
  figures,
}: {
  figures: readonly KeyFigureProps[];
}) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] border border-rule bg-cell p-0">
      {figures.map((figure) => (
        <li
          key={`${figure.value} ${figure.label}`}
          className="-mt-px border-t border-rule px-4.5 py-4 min-[700px]:[&+&]:border-l"
        >
          <KeyFigure {...figure} />
        </li>
      ))}
    </ul>
  );
}
