import { LABEL_CLASS_NAME } from "./Field";

// Choice from the Component Spec: radios drawn as one segmented control on a
// --field edge, the selected cell ringed in the accent. The radios stay real
// inputs, so arrow keys and form semantics work as usual.

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  /** A mono line under the label, e.g. a price or a saving. */
  detail?: string;
};

type SegmentedChoiceProps<Value extends string> = {
  legend: string;
  name: string;
  options: readonly SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

export default function SegmentedChoice<Value extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: SegmentedChoiceProps<Value>) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className={`mb-1.5 p-0 ${LABEL_CLASS_NAME}`}>{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col overflow-hidden rounded-ctl border border-field bg-cell">
        {options.map((option) => (
          <label
            key={option.value}
            className="grid cursor-pointer grid-cols-[20px_1fr] gap-2.5 p-3 not-first:border-l not-first:border-field has-checked:shadow-[inset_0_0_0_2px_var(--fig)]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 size-4.5 accent-cta"
            />
            <span>
              {option.label}
              {option.detail && (
                <small className="block font-mono text-label text-muted">
                  {option.detail}
                </small>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
