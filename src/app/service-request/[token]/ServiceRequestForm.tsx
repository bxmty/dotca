"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/app/components/Button";
import {
  Field,
  getErrorProps,
  INPUT_CLASS_NAME,
  PhoneField,
  TextField,
} from "@/app/components/Field";
import SegmentedChoice from "@/app/components/SegmentedChoice";
import StatusNote from "@/app/components/StatusNote";
import { omitFieldErrors } from "@/lib/formValidation";
import { isRecord } from "@/lib/isRecord";
import {
  getServiceRequestFieldSpecs,
  SERVICE_REQUEST_LONG_TEXT_MAX_LENGTH,
  SERVICE_REQUEST_TEXT_MAX_LENGTH,
  validateServiceRequest,
  type ServiceRequestFieldSpec,
  type ServiceRequestMode,
} from "@/lib/service-request";
import { formatUnavailableMessage } from "@/lib/service-unavailable";

// Joiner/leaver intake form (#565): one scrolling page per mode, built from
// the field tables in src/lib/service-request.ts so the form, the ticket and
// the notification never disagree about a field or its label.

const MODE_OPTIONS = [
  { value: "joiner", label: "Someone is joining" },
  { value: "leaver", label: "Someone is leaving" },
] as const;

const INPUT_TYPE_BY_KIND = {
  text: "text",
  email: "email",
  date: "date",
  dateTime: "datetime-local",
} as const;

const AUTO_COMPLETE_BY_KEY: Record<string, string> = {
  requesterName: "name",
  requesterEmail: "email",
};

/** Shown when the server gave no usable message: say so, and give a phone number. */
const SUBMIT_FAILED_MESSAGE = formatUnavailableMessage(
  "Your request did not go through.",
);

type FieldErrors = Partial<Record<string, string>>;

/** The ticket reference is absent when only the email notification landed. */
type Confirmation = { ticketNumber?: string };

const getFieldId = (key: string) => `service-request-${key}`;

/** The field table split into its labelled sections, in form order. */
function groupBySection(specs: readonly ServiceRequestFieldSpec[]) {
  const sections: { name: string; specs: ServiceRequestFieldSpec[] }[] = [];
  for (const spec of specs) {
    const current = sections.at(-1);
    if (current?.name === spec.section) {
      current.specs.push(spec);
    } else {
      sections.push({ name: spec.section, specs: [spec] });
    }
  }
  return sections;
}

/** The server's field errors from a 400 body, ignoring anything malformed. */
function readFieldErrors(body: unknown): FieldErrors {
  if (!isRecord(body) || !isRecord(body.fieldErrors)) return {};
  const fieldErrors: FieldErrors = {};
  for (const [key, message] of Object.entries(body.fieldErrors)) {
    if (typeof message === "string") fieldErrors[key] = message;
  }
  return fieldErrors;
}

function ConfirmationScreen({ ticketNumber }: Confirmation) {
  // The requester gets nothing else from this site, so this wording is what
  // sets up the confirmation call (#565, Further Notes). It must hold with or
  // without a ticket reference.
  return (
    <section className="mx-auto grid max-w-[720px] gap-6 px-4 py-12 md:py-16">
      <div className="grid gap-4 border-t-2 border-ink pt-6">
        <p className="m-0 font-mono text-label text-muted">Service request</p>
        <h1 className="m-0 text-h2 leading-tight font-light tracking-[-0.02em] text-balance md:text-section">
          Request received
        </h1>
      </div>
      <StatusNote tone="ok" label="Next">
        <p className="m-0 font-semibold">Nothing has been changed yet.</p>
        <p className="m-0">
          Boximity will phone you to confirm before any change is made. We call
          the number you entered on the form.
        </p>
      </StatusNote>
      {ticketNumber && (
        <p className="m-0 font-mono text-small">
          Ticket reference: {ticketNumber}
        </p>
      )}
      <p className="m-0 text-small text-muted">
        {formatUnavailableMessage("Urgent, or no call yet?")}
      </p>
    </section>
  );
}

export default function ServiceRequestForm({ token }: { token: string }) {
  const [mode, setMode] = useState<ServiceRequestMode>("joiner");
  // One map for both modes, so the requester's details survive the toggle.
  // Validation drops the other mode's keys before anything is sent.
  const [values, setValues] = useState<Record<string, string>>({});
  // Honeypot: humans never see this field; bots that fill it are dropped
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (confirmation) return <ConfirmationScreen {...confirmation} />;

  const specs = getServiceRequestFieldSpecs(mode);

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((errors) => omitFieldErrors(errors, [key]));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validation = validateServiceRequest(mode, values);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setSubmitError(null);
      const firstInvalid = specs.find(
        (spec) => validation.fieldErrors[spec.key],
      );
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid?.key}"]`)
        ?.focus();
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          mode,
          fields: validation.request.fields,
          website,
        }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (response.ok && isRecord(body) && body.success === true) {
        setConfirmation({
          ticketNumber:
            typeof body.ticketNumber === "string" && body.ticketNumber !== ""
              ? body.ticketNumber
              : undefined,
        });
        return;
      }

      setFieldErrors(readFieldErrors(body));
      setSubmitError(
        isRecord(body) && typeof body.error === "string" && body.error !== ""
          ? body.error
          : SUBMIT_FAILED_MESSAGE,
      );
    } catch {
      setSubmitError(SUBMIT_FAILED_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (spec: ServiceRequestFieldSpec) => {
    const id = getFieldId(spec.key);
    const value = values[spec.key] ?? "";
    const error = fieldErrors[spec.key];
    const isOptional = spec.requiredMessage === undefined;

    switch (spec.kind) {
      case "choice":
        return (
          <SegmentedChoice
            key={spec.key}
            legend={spec.label}
            name={spec.key}
            options={spec.choices ?? []}
            value={value}
            onChange={(choice) => setValue(spec.key, choice)}
            error={error}
            isOptional={isOptional}
          />
        );
      case "phone":
        return (
          <PhoneField
            key={spec.key}
            id={id}
            name={spec.key}
            label={spec.label}
            value={value}
            onChange={(phone) => setValue(spec.key, phone)}
            error={error}
            isOptional={isOptional}
          />
        );
      case "longText":
        return (
          <Field
            key={spec.key}
            id={id}
            label={spec.label}
            error={error}
            isOptional={isOptional}
          >
            <textarea
              id={id}
              name={spec.key}
              rows={3}
              maxLength={SERVICE_REQUEST_LONG_TEXT_MAX_LENGTH}
              value={value}
              onChange={(event) => setValue(spec.key, event.target.value)}
              className={`${INPUT_CLASS_NAME} resize-y`}
              {...getErrorProps(id, error)}
            />
          </Field>
        );
      default:
        return (
          <TextField
            key={spec.key}
            id={id}
            name={spec.key}
            label={spec.label}
            type={INPUT_TYPE_BY_KIND[spec.kind]}
            autoComplete={AUTO_COMPLETE_BY_KEY[spec.key] ?? "off"}
            maxLength={SERVICE_REQUEST_TEXT_MAX_LENGTH}
            value={value}
            onChange={(event) => setValue(spec.key, event.target.value)}
            required={!isOptional}
            error={error}
            isOptional={isOptional}
          />
        );
    }
  };

  return (
    <section className="mx-auto grid max-w-[720px] gap-6 px-4 py-12 md:py-16">
      <div className="grid gap-4 border-t-2 border-ink pt-6">
        <p className="m-0 font-mono text-label text-muted">Service request</p>
        <h1 className="m-0 text-h2 leading-tight font-light tracking-[-0.02em] text-balance md:text-section">
          Tell us who is joining or leaving
        </h1>
        <p className="m-0 text-prose text-muted">
          Nothing changes when you send this form. Boximity phones you to
          confirm first.
        </p>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-8"
      >
        <SegmentedChoice
          legend="What are you reporting?"
          name="mode"
          options={MODE_OPTIONS}
          value={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setFieldErrors({});
            setSubmitError(null);
          }}
        />

        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        >
          <label htmlFor="service-request-website">Website</label>
          <input
            type="text"
            id="service-request-website"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {groupBySection(specs).map((section) => {
          const headingId = `service-request-section-${section.specs[0].key}`;
          return (
            <section
              key={section.name}
              aria-labelledby={headingId}
              className="grid gap-4.5 border-t border-rule pt-5"
            >
              <h2
                id={headingId}
                className="m-0 text-h3 leading-tight font-semibold"
              >
                {section.name}
              </h2>
              {section.specs.map((spec) => renderField(spec))}
              {section.specs.some((spec) => spec.key === "departureType") &&
                values.departureType === "involuntary" && (
                  <StatusNote tone="note" label="Note">
                    We handle an involuntary departure ahead of other requests.
                    We phone you to confirm as soon as we see it, and access is
                    cut once you confirm.
                  </StatusNote>
                )}
            </section>
          );
        })}

        {submitError && (
          <StatusNote tone="error" label="Error">
            {submitError}
          </StatusNote>
        )}

        <Button type="submit" variant="primary" isBlock disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send request"}
        </Button>
      </form>
    </section>
  );
}
