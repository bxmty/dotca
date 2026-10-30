import { INCOMPLETE_EMAIL_MESSAGE, isEmailAddress } from "@/lib/formValidation";

export type LeadFields = { name: string; email: string; company: string };
export type LeadFieldName = keyof LeadFields;
export type LeadFieldErrors = Partial<Record<LeadFieldName, string>>;

/** Field order, for moving focus to the first invalid one. */
export const LEAD_FIELD_NAMES: readonly LeadFieldName[] = [
  "name",
  "email",
  "company",
];

/** Errors worded as the fix (Component Spec, forms). */
export function validateLeadFields({
  name,
  email,
  company,
}: LeadFields): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  if (!name.trim()) {
    errors.name = "enter your name";
  }
  if (!email.trim()) {
    errors.email = "enter your email address";
  } else if (!isEmailAddress(email)) {
    errors.email = INCOMPLETE_EMAIL_MESSAGE;
  }
  if (!company.trim()) {
    errors.company = "enter your company name";
  }
  return errors;
}
