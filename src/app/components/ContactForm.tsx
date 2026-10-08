"use client";

import { useState, FormEvent } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Button } from "./Button";
import { TEXT_LINK_CLASS_NAME } from "./TextLink";

interface ContactFormProps {
  className?: string;
}

type ContactFields = { name: string; email: string; phone: string };
type FieldName = keyof ContactFields;
type FieldErrors = Partial<Record<FieldName, string>>;

// Field order, for moving focus to the first invalid one
const FIELD_NAMES: readonly FieldName[] = ["name", "email", "phone"];

// The same pattern the contact API applies
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A country code is at most three digits, so anything shorter is no number
// at all. Whether a longer one is valid stays the API's call (libphonenumber),
// so the client never blocks a number the API would accept.
const MAX_COUNTRY_CODE_DIGITS = 3;

/** Errors worded as the fix (Component Spec, forms). */
function validateContactFields({
  name,
  email,
  phone,
}: ContactFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) {
    errors.name = "enter your name";
  }
  if (!email.trim()) {
    errors.email = "enter your email address";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "enter the full address, like dana@company.ca";
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length <= MAX_COUNTRY_CODE_DIGITS) {
    errors.phone = "enter a phone number we can reach you on";
  }
  return errors;
}

const getFieldId = (field: FieldName) => `contact-${field}`;
const getErrorId = (field: FieldName) => `contact-${field}-error`;

/** Ties a field to its inline error while it has one. */
function getErrorProps(field: FieldName, errors: FieldErrors) {
  return errors[field]
    ? { "aria-invalid": true, "aria-describedby": getErrorId(field) }
    : {};
}

// Fields from the Component Spec: cell fill, a 3:1 --field edge, 2 px
// corners, 46 px tall. An invalid field takes the danger edge and an inset
// bar. The phone field's equivalent lives in globals.css (.tel-field),
// because react-phone-input-2's unlayered stylesheet outranks utilities.
const INPUT_CLASS_NAME =
  "min-h-11.5 w-full rounded-ctl border border-field bg-cell px-3 py-2.75 text-body text-ink focus:border-fig focus:outline-2 focus:-outline-offset-1 focus:outline-fig aria-invalid:border-danger aria-invalid:shadow-[inset_3px_0_0_var(--danger)]";
const LABEL_CLASS_NAME = "text-small font-semibold";

function FieldError({
  field,
  errors,
}: {
  field: FieldName;
  errors: FieldErrors;
}) {
  const message = errors[field];
  if (!message) return null;
  return (
    <p id={getErrorId(field)} className="m-0 text-small text-danger">
      <span className="font-mono">Fix: </span>
      {message}
    </p>
  );
}

const ContactForm = ({ className = "" }: ContactFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Honeypot: humans never see this field; bots that fill it are dropped
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  const clearFieldError = (field: FieldName) =>
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const errors = validateContactFields({ name, email, phone });
    setFieldErrors(errors);
    const firstInvalidField = FIELD_NAMES.find((field) => errors[field]);
    if (firstInvalidField) {
      setSubmitStatus({ type: null, message: "" });
      document.getElementById(getFieldId(firstInvalidField))?.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // The phone number already contains country code from the PhoneInput component

      // Send form data to API
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, website }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        // Handle error case
        if (responseData && responseData.error) {
          throw new Error(`Error: ${responseData.error}`);
        } else {
          throw new Error(`Failed to submit form (Status: ${response.status})`);
        }
      }

      // Handle custom success message if provided by the API
      if (responseData && responseData.message) {
        setSubmitStatus({
          type: "success",
          message: responseData.message,
        });
        setIsSubmitting(false);
        return; // Don't redirect if we have a custom message
      }

      // Display success message
      setSubmitStatus({
        type: "success",
        message:
          "Thank you! Your consultation request has been submitted successfully.",
      });

      // Reset form fields
      setName("");
      setEmail("");
      setPhone("");
      setIsSubmitting(false);
    } catch (error) {
      // Log error submitting form
      console.error("Contact form submission error:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? `${error.message}. Please try again.`
            : "Failed to submit request. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const isSuccess = submitStatus.type === "success";

  return (
    <form
      className={`grid max-w-[560px] content-start gap-4.5 ${className}`}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="contact-form-heading"
    >
      <div className="grid gap-1">
        <h3
          id="contact-form-heading"
          className="m-0 text-h3 leading-tight font-semibold"
        >
          Book Your Consultation
        </h3>
        <p className="m-0 text-small text-muted">
          We&apos;ll contact you to schedule your session
        </p>
      </div>

      {/* Status line from the Component Spec: a ruled note with a mono
          label, its left edge in ink for success and danger for errors. */}
      {submitStatus.type && (
        <div
          role={isSuccess ? "status" : "alert"}
          className={`grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 border border-l-3 border-rule bg-cell px-3.5 py-3 text-small ${isSuccess ? "border-l-ink" : "border-l-danger"}`}
        >
          <b
            className={`pt-1 font-mono text-label font-medium ${isSuccess ? "text-fig" : "text-danger"}`}
          >
            {isSuccess ? "Sent" : "Error"}
          </b>
          <span>{submitStatus.message}</span>
        </div>
      )}

      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
      >
        <label htmlFor="contact-website">Website</label>
        <input
          type="text"
          id="contact-website"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="grid min-w-0 gap-1.5">
        <label htmlFor={getFieldId("name")} className={LABEL_CLASS_NAME}>
          Name
        </label>
        <input
          type="text"
          id={getFieldId("name")}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError("name");
          }}
          className={INPUT_CLASS_NAME}
          required
          {...getErrorProps("name", fieldErrors)}
        />
        <FieldError field="name" errors={fieldErrors} />
      </div>
      <div className="grid min-w-0 gap-1.5">
        <label htmlFor={getFieldId("email")} className={LABEL_CLASS_NAME}>
          Email
        </label>
        <input
          type="email"
          id={getFieldId("email")}
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError("email");
          }}
          className={INPUT_CLASS_NAME}
          required
          {...getErrorProps("email", fieldErrors)}
        />
        <FieldError field="email" errors={fieldErrors} />
      </div>
      <div className="grid min-w-0 gap-1.5">
        <label htmlFor={getFieldId("phone")} className={LABEL_CLASS_NAME}>
          Phone
        </label>
        <PhoneInput
          country={"ca"} // Default country
          value={phone}
          onChange={(phone) => {
            setPhone(`+${phone}`); // Add + prefix for E.164 format
            clearFieldError("phone");
          }}
          containerClass="tel-field"
          inputProps={{
            id: getFieldId("phone"),
            name: "phone",
            required: true,
            autoFocus: false,
            autoComplete: "tel",
            ...getErrorProps("phone", fieldErrors),
          }}
        />
        <FieldError field="phone" errors={fieldErrors} />
      </div>
      <Button
        type="submit"
        variant="primary"
        isBlock
        disabled={isSubmitting}
        data-testid="contact-submit-button"
      >
        {isSubmitting ? "Submitting..." : "Book Your Consult"}
      </Button>

      <div className="grid gap-1 text-small text-muted">
        <p className="m-0">
          We&apos;ll reach out within 24 hours to schedule your consultation.
        </p>
        <p className="m-0">
          Prefer to pick a time yourself?{" "}
          <a
            href="/book"
            target="_blank"
            rel="noopener noreferrer"
            className={TEXT_LINK_CLASS_NAME}
            data-testid="contact-book-link"
          >
            Book a time now
          </a>
          .
        </p>
      </div>
    </form>
  );
};

export default ContactForm;
