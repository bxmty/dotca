"use client";

/**
 * The monthly security brief opt-in (bxmty/dotca#599, copy widened by #642
 * so the consent covers the nurture sequence). One component so the contact
 * form, onboarding and checkout all ask for consent in the same words.
 *
 * CASL: consent must be express, so the box is never pre-checked and the
 * caller starts its state at false.
 */
export const BRIEF_OPT_IN_LABEL =
  "Send me Boximity's monthly security brief and occasional tips and offers";

interface BriefOptInCheckboxProps {
  id: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  className?: string;
}

export default function BriefOptInCheckbox({
  id,
  isChecked,
  onChange,
  className = "",
}: BriefOptInCheckboxProps) {
  return (
    <div className={`flex items-start gap-2.5 text-small ${className}`}>
      <input
        type="checkbox"
        id={id}
        name="wantsBrief"
        checked={isChecked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-fig"
      />
      <label htmlFor={id}>{BRIEF_OPT_IN_LABEL}</label>
    </div>
  );
}
