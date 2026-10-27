import { LABEL_CLASS_NAME } from "./Field";

// Stacked answer list from the Component Spec: long prose options, one ruled
// row per answer on the shared --field edge, the selected row ringed in the
// accent. Real radio inputs stay grouped under the legend.

export type StackedAnswerOption<Value extends string> = {
  value: Value;
  label: string;
};

type StackedAnswerListProps<Value extends string> = {
  legend: string;
  name: string;
  options: readonly StackedAnswerOption<Value>[];
  /** Empty string means no option is selected yet. */
  value: Value | "";
  onChange: (value: Value) => void;
};

export default function StackedAnswerList<Value extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: StackedAnswerListProps<Value>) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className={`mb-1.5 p-0 ${LABEL_CLASS_NAME}`}>{legend}</legend>
      <div className="overflow-hidden rounded-ctl border border-field bg-cell">
        {options.map((option) => (
          <label
            key={option.value}
            className="grid cursor-pointer grid-cols-[20px_1fr] gap-2.5 p-3 not-first:border-t not-first:border-field has-checked:shadow-[inset_0_0_0_2px_var(--fig)]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 size-4.5 accent-cta"
            />
            <span className="text-body text-ink">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
