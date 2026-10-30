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

const VISITOR_BLANK_FIELD_MESSAGES: Record<LeadFieldName, string> = {
  name: "enter your name",
  email: "enter your email address",
  company: "enter your company name",
};

/** For an SDR's console: the details being typed are the prospect's, not theirs. */
export const PROSPECT_BLANK_FIELD_MESSAGES: Record<LeadFieldName, string> = {
  name: "enter the prospect's name",
  email: "enter the prospect's email address",
  company: "enter the prospect's company name",
};

/** Errors worded as the fix (Component Spec, forms). */
export function validateLeadFields(
  { name, email, company }: LeadFields,
  blankFieldMessages = VISITOR_BLANK_FIELD_MESSAGES,
): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  if (!name.trim()) {
    errors.name = blankFieldMessages.name;
  }
  if (!email.trim()) {
    errors.email = blankFieldMessages.email;
  } else if (!isEmailAddress(email)) {
    errors.email = INCOMPLETE_EMAIL_MESSAGE;
  }
  if (!company.trim()) {
    errors.company = blankFieldMessages.company;
  }
  return errors;
}
