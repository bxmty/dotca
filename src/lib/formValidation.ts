// Client-side checks shared by the contact, checkout and onboarding forms.
// Errors are worded as the fix (Component Spec, forms).

// The same pattern the contact, subscription and onboarding APIs apply
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INCOMPLETE_EMAIL_MESSAGE =
  "enter the full address, like dana@company.ca";

export function isEmailAddress(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** A copy of a field-error map without the given fields' errors. */
export function omitFieldErrors<Field extends string>(
  errors: Partial<Record<Field, string>>,
  fields: readonly Field[],
): Partial<Record<Field, string>> {
  const remaining = { ...errors };
  fields.forEach((field) => delete remaining[field]);
  return remaining;
}
