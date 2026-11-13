import { INCOMPLETE_EMAIL_MESSAGE, isEmailAddress } from "@/lib/formValidation";
import { isRecord } from "@/lib/isRecord";
import { formatE164Phone } from "@/lib/phone";

/**
 * Joiner/leaver service requests (#565): the one definition of what a request
 * holds, shared by the intake form and the submission route. The field tables
 * drive validation, the Syncro ticket subject and comment, and the webmaster
 * notification, so a field added here reaches all of them.
 *
 * No server-only imports: the client form imports this module.
 */

export type ServiceRequestMode = "joiner" | "leaver";

export type YesNoAnswer = "yes" | "no";

export type DepartureType = "amicable" | "involuntary";

/** Who is filing. Matched against the client's authorized contacts by email. */
interface RequesterFields {
  requesterName: string;
  requesterEmail: string;
  /** E.164 once validated; the number the confirmation call goes to */
  requesterPhone: string;
}

/** Every value is a string, "" where an optional field was left blank. */
export interface JoinerFields extends RequesterFields {
  newHireName: string;
  jobTitle: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** The existing employee whose access the new hire should match */
  matchAccessOf: string;
  apps: string;
  licenses: string;
  hardware: string;
  remoteAccess: YesNoAnswer | "";
  distributionLists: string;
  notes: string;
}

export interface LeaverFields extends RequesterFields {
  employeeName: string;
  departureType: DepartureType;
  /** YYYY-MM-DD */
  lastWorkingDay: string;
  /** YYYY-MM-DDTHH:mm, the requester's local time (a datetime-local value) */
  accessCutoff: string;
  mailboxRecipient: string;
  fileOwner: string;
  hardwareReturn: YesNoAnswer | "";
  notes: string;
}

export type ServiceRequest =
  | { mode: "joiner"; fields: JoinerFields }
  | { mode: "leaver"; fields: LeaverFields };

export type ServiceRequestFieldKind =
  "text" | "longText" | "email" | "phone" | "date" | "dateTime" | "choice";

export interface ServiceRequestChoice {
  value: string;
  label: string;
}

export interface ServiceRequestFieldSpec<Key extends string = string> {
  key: Key;
  /** Used on the form, in the ticket comment and in the notification */
  label: string;
  /** The labelled group the field sits in, on the form and in the comment */
  section: string;
  kind: ServiceRequestFieldKind;
  /** The fix shown when the field is blank. Present on required fields only. */
  requiredMessage?: string;
  /** Present on `choice` fields only */
  choices?: readonly ServiceRequestChoice[];
}

const YES_NO_CHOICES: readonly ServiceRequestChoice[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const REQUESTER_FIELD_SPECS: readonly ServiceRequestFieldSpec<
  keyof RequesterFields
>[] = [
  {
    key: "requesterName",
    label: "Your name",
    section: "Your details",
    kind: "text",
    requiredMessage: "enter your name",
  },
  {
    key: "requesterEmail",
    label: "Your email",
    section: "Your details",
    kind: "email",
    requiredMessage: "enter your email",
  },
  {
    key: "requesterPhone",
    label: "Your phone",
    section: "Your details",
    kind: "phone",
    requiredMessage: "enter your phone",
  },
];

export const JOINER_FIELD_SPECS: readonly ServiceRequestFieldSpec<
  keyof JoinerFields
>[] = [
  ...REQUESTER_FIELD_SPECS,
  {
    key: "newHireName",
    label: "New hire's name",
    section: "New hire",
    kind: "text",
    requiredMessage: "enter the new hire's name",
  },
  {
    key: "jobTitle",
    label: "Job title",
    section: "New hire",
    kind: "text",
  },
  {
    key: "startDate",
    label: "Start date",
    section: "New hire",
    kind: "date",
    requiredMessage: "enter the start date",
  },
  {
    key: "matchAccessOf",
    label: "Match the access of",
    section: "Access and equipment",
    kind: "text",
    requiredMessage: "enter whose access to match",
  },
  {
    key: "apps",
    label: "Apps",
    section: "Access and equipment",
    kind: "longText",
  },
  {
    key: "licenses",
    label: "Licenses",
    section: "Access and equipment",
    kind: "longText",
  },
  {
    key: "hardware",
    label: "Hardware",
    section: "Access and equipment",
    kind: "longText",
  },
  {
    key: "remoteAccess",
    label: "Remote access",
    section: "Access and equipment",
    kind: "choice",
    choices: YES_NO_CHOICES,
  },
  {
    key: "distributionLists",
    label: "Distribution lists",
    section: "Access and equipment",
    kind: "longText",
  },
  {
    key: "notes",
    label: "Notes",
    section: "Anything else",
    kind: "longText",
  },
];

export const LEAVER_FIELD_SPECS: readonly ServiceRequestFieldSpec<
  keyof LeaverFields
>[] = [
  ...REQUESTER_FIELD_SPECS,
  {
    key: "employeeName",
    label: "Departing employee's name",
    section: "Departing employee",
    kind: "text",
    requiredMessage: "enter the departing employee's name",
  },
  {
    key: "departureType",
    label: "Departure type",
    section: "Departing employee",
    kind: "choice",
    requiredMessage: "choose a departure type",
    choices: [
      { value: "amicable", label: "Amicable" },
      { value: "involuntary", label: "Involuntary" },
    ],
  },
  {
    key: "lastWorkingDay",
    label: "Last working day",
    section: "Timing",
    kind: "date",
    requiredMessage: "enter the last working day",
  },
  {
    key: "accessCutoff",
    label: "Cut access at",
    section: "Timing",
    kind: "dateTime",
    requiredMessage: "enter when to cut access",
  },
  {
    key: "mailboxRecipient",
    label: "Mailbox goes to",
    section: "Handover",
    kind: "text",
  },
  {
    key: "fileOwner",
    label: "Files go to",
    section: "Handover",
    kind: "text",
  },
  {
    key: "hardwareReturn",
    label: "Hardware coming back",
    section: "Handover",
    kind: "choice",
    choices: YES_NO_CHOICES,
  },
  {
    key: "notes",
    label: "Notes",
    section: "Anything else",
    kind: "longText",
  },
];

/** The field table for a mode, in form and ticket order. */
export function getServiceRequestFieldSpecs(
  mode: ServiceRequestMode,
): readonly ServiceRequestFieldSpec[] {
  return mode === "joiner" ? JOINER_FIELD_SPECS : LEAVER_FIELD_SPECS;
}

export function isServiceRequestMode(
  value: unknown,
): value is ServiceRequestMode {
  return value === "joiner" || value === "leaver";
}

export type ServiceRequestValidation =
  | { ok: true; request: ServiceRequest }
  | {
      ok: false;
      /** One sentence for the route's 400 body */
      error: string;
      /** Field key → the fix, for the form to show beside each field */
      fieldErrors: Record<string, string>;
    };

export const SERVICE_REQUEST_TEXT_MAX_LENGTH = 200;
export const SERVICE_REQUEST_LONG_TEXT_MAX_LENGTH = 2000;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::\d{2})?$/;

/** A real calendar day written as YYYY-MM-DD. */
function isCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date rolls an impossible day over (Feb 30 → Mar 2), so compare it back
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** A datetime-local value: YYYY-MM-DDTHH:mm, seconds optional. */
function isLocalDateTime(value: string): boolean {
  const [date, time = "", ...extra] = value.split("T");
  const match = TIME_PATTERN.exec(time);
  if (!match || extra.length > 0 || !isCalendarDate(date)) return false;
  return Number(match[1]) < 24 && Number(match[2]) < 60;
}

/** The fix for a filled-in value that is not acceptable, or null when it is. */
function findValueError(
  spec: ServiceRequestFieldSpec,
  value: string,
): string | null {
  const maxLength =
    spec.kind === "longText"
      ? SERVICE_REQUEST_LONG_TEXT_MAX_LENGTH
      : SERVICE_REQUEST_TEXT_MAX_LENGTH;
  if (value.length > maxLength) {
    return `keep this under ${maxLength} characters`;
  }
  switch (spec.kind) {
    case "email":
      return isEmailAddress(value) ? null : INCOMPLETE_EMAIL_MESSAGE;
    case "phone":
      return formatE164Phone(value) === null
        ? "enter a full phone number with its area code"
        : null;
    case "date":
      return isCalendarDate(value) ? null : "enter the date as YYYY-MM-DD";
    case "dateTime":
      return isLocalDateTime(value) ? null : "enter the date and time";
    case "choice":
      return spec.choices?.some((choice) => choice.value === value)
        ? null
        : "choose one of the options";
    default:
      return null;
  }
}

/**
 * Check a submission and return it cleaned: values trimmed, the phone in
 * E.164, blank optional fields as "", fields the mode does not have dropped.
 * Takes `unknown` because the route validates a parsed JSON body; the form
 * passes its state through the same check before it submits.
 */
export function validateServiceRequest(
  mode: unknown,
  fields: unknown,
): ServiceRequestValidation {
  if (!isServiceRequestMode(mode)) {
    return {
      ok: false,
      error: "Choose a joiner or a leaver request.",
      fieldErrors: {},
    };
  }

  const submitted = isRecord(fields) ? fields : {};
  const cleaned: Record<string, string> = {};
  const fieldErrors: Record<string, string> = {};
  const missingLabels: string[] = [];

  for (const spec of getServiceRequestFieldSpecs(mode)) {
    const raw = submitted[spec.key];
    const value = typeof raw === "string" ? raw.trim() : "";
    cleaned[spec.key] = value;

    if (value === "") {
      if (spec.requiredMessage !== undefined) {
        missingLabels.push(spec.label);
        fieldErrors[spec.key] = spec.requiredMessage;
      }
      continue;
    }

    const valueError = findValueError(spec, value);
    if (valueError !== null) {
      fieldErrors[spec.key] = valueError;
    }
  }
  cleaned.requesterPhone =
    formatE164Phone(cleaned.requesterPhone) ?? cleaned.requesterPhone;

  if (missingLabels.length > 0) {
    return {
      ok: false,
      error: `Please fill in: ${missingLabels.join(", ")}.`,
      fieldErrors,
    };
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors,
    };
  }

  return {
    ok: true,
    request: { mode, fields: cleaned } as unknown as ServiceRequest,
  };
}

const MODE_LABEL: Record<ServiceRequestMode, string> = {
  joiner: "Joiner",
  leaver: "Leaver",
};

/**
 * The ticket subject: mode, person and date, so the queue can be triaged
 * without opening each ticket.
 */
export function formatServiceRequestSubject(request: ServiceRequest): string {
  return request.mode === "joiner"
    ? `Joiner: ${request.fields.newHireName}, starts ${request.fields.startDate}`
    : `Leaver: ${request.fields.employeeName}, last day ${request.fields.lastWorkingDay}`;
}

/** A field's value as a person reads it; a blank stays "". */
function readFieldValue(
  request: ServiceRequest,
  spec: ServiceRequestFieldSpec,
): string {
  const values: Record<string, string> = { ...request.fields };
  const value = values[spec.key];
  if (spec.kind === "choice") {
    return spec.choices?.find((choice) => choice.value === value)?.label ?? "";
  }
  return spec.kind === "dateTime" ? value.replace("T", " ") : value;
}

/**
 * Every field as label → value in form order, led by the mode: the shape the
 * webmaster notification takes. Blank fields are "".
 */
export function formatServiceRequestFields(
  request: ServiceRequest,
): Record<string, string> {
  const fields: Record<string, string> = { Request: MODE_LABEL[request.mode] };
  for (const spec of getServiceRequestFieldSpecs(request.mode)) {
    fields[spec.label] = readFieldValue(request, spec);
  }
  return fields;
}

/**
 * The ticket's initial comment: every field under its section heading, blanks
 * marked rather than dropped so the reader can see what was left unanswered.
 */
export function formatServiceRequestComment(request: ServiceRequest): string {
  const lines = [`${MODE_LABEL[request.mode]} request`];
  let currentSection: string | undefined;
  for (const spec of getServiceRequestFieldSpecs(request.mode)) {
    if (spec.section !== currentSection) {
      lines.push("", spec.section);
      currentSection = spec.section;
    }
    lines.push(
      `${spec.label}: ${readFieldValue(request, spec) || "(not provided)"}`,
    );
  }
  return lines.join("\n");
}
