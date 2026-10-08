"use client";

import type { ComponentProps, ReactNode } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// Fields from the Component Spec (forms), shared by the contact form,
// checkout and onboarding: the label sits above the field; the field has a
// cell fill, a 3:1 --field edge, 2 px corners and a 46 px minimum height.
// An invalid field takes the danger edge and an inset bar, and its error is
// worded as the fix and tied to it with aria-describedby.

export const INPUT_CLASS_NAME =
  "min-h-11.5 w-full rounded-ctl border border-field bg-cell px-3 py-2.75 text-body text-ink focus:border-fig focus:outline-2 focus:-outline-offset-1 focus:outline-fig aria-invalid:border-danger aria-invalid:shadow-[inset_3px_0_0_var(--danger)]";

export const LABEL_CLASS_NAME = "text-small font-semibold";

export const getErrorId = (id: string) => `${id}-error`;

/** Ties a control to its inline error while it has one. */
export function getErrorProps(id: string, error: string | undefined) {
  return error
    ? { "aria-invalid": true as const, "aria-describedby": getErrorId(id) }
    : {};
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={getErrorId(id)} className="m-0 text-small text-danger">
      <span className="font-mono">Fix: </span>
      {message}
    </p>
  );
}

type FieldProps = {
  /** The control's id, which the label and error are keyed on. */
  id: string;
  label: ReactNode;
  error?: string;
  isOptional?: boolean;
  className?: string;
  /** The control. Spread getErrorProps(id, error) onto it. */
  children: ReactNode;
};

/** Label, control and inline error. */
export function Field({
  id,
  label,
  error,
  isOptional = false,
  className = "",
  children,
}: FieldProps) {
  return (
    <div className={`grid min-w-0 content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className={LABEL_CLASS_NAME}>
        {label}
        {isOptional && (
          <span className="ml-1.5 font-mono text-label font-normal text-muted">
            optional
          </span>
        )}
      </label>
      {children}
      <FieldError id={id} message={error} />
    </div>
  );
}

type TextFieldProps = Omit<FieldProps, "children"> &
  Omit<ComponentProps<"input">, "id" | "className">;

/** A Field around a text-like <input>. */
export function TextField({
  id,
  label,
  error,
  isOptional,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field
      id={id}
      label={label}
      error={error}
      isOptional={isOptional}
      className={className}
    >
      <input
        id={id}
        className={INPUT_CLASS_NAME}
        {...inputProps}
        {...getErrorProps(id, error)}
      />
    </Field>
  );
}

type PhoneFieldProps = Omit<FieldProps, "children"> & {
  name: string;
  /** E.164, e.g. +12895550142. */
  value: string;
  onChange: (e164: string) => void;
  autoComplete?: string;
};

/**
 * react-phone-input-2 with a Canadian default, in the field style. Its
 * unlayered stylesheet outranks Tailwind's utilities, so the field style is
 * restated for it in globals.css (.tel-field).
 */
export function PhoneField({
  id,
  name,
  label,
  error,
  isOptional,
  className,
  value,
  onChange,
  autoComplete = "tel",
}: PhoneFieldProps) {
  return (
    <Field
      id={id}
      label={label}
      error={error}
      isOptional={isOptional}
      className={className}
    >
      <PhoneInput
        country="ca"
        // The component works in bare digits; the form keeps E.164
        value={value.replace(/^\+/, "")}
        onChange={(digits) => onChange(`+${digits}`)}
        containerClass="tel-field"
        inputProps={{
          id,
          name,
          required: !isOptional,
          autoFocus: false,
          autoComplete,
          ...getErrorProps(id, error),
        }}
      />
    </Field>
  );
}
