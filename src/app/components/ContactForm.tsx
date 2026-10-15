"use client";

import { useState, FormEvent } from "react";
import { Button } from "./Button";
import { PhoneField, TextField } from "./Field";
import StatusNote from "./StatusNote";
import {
  INCOMPLETE_EMAIL_MESSAGE,
  isEmailAddress,
} from "../../lib/formValidation";
import { TEXT_LINK_CLASS_NAME } from "./TextLink";

interface ContactFormProps {
  className?: string;
}

type ContactFields = { name: string; email: string; phone: string };
type FieldName = keyof ContactFields;
type FieldErrors = Partial<Record<FieldName, string>>;

// Field order, for moving focus to the first invalid one
const FIELD_NAMES: readonly FieldName[] = ["name", "email", "phone"];

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
  } else if (!isEmailAddress(email)) {
    errors.email = INCOMPLETE_EMAIL_MESSAGE;
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length <= MAX_COUNTRY_CODE_DIGITS) {
    errors.phone = "enter a phone number we can reach you on";
  }
  return errors;
}

const getFieldId = (field: FieldName) => `contact-${field}`;

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

      {submitStatus.type && (
        <StatusNote
          tone={isSuccess ? "ok" : "error"}
          label={isSuccess ? "Sent" : "Error"}
        >
          {submitStatus.message}
        </StatusNote>
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
      <TextField
        id={getFieldId("name")}
        label="Name"
        type="text"
        name="name"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          clearFieldError("name");
        }}
        required
        error={fieldErrors.name}
      />
      <TextField
        id={getFieldId("email")}
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          clearFieldError("email");
        }}
        required
        error={fieldErrors.email}
      />
      <PhoneField
        id={getFieldId("phone")}
        label="Phone"
        name="phone"
        value={phone}
        onChange={(phone) => {
          setPhone(phone);
          clearFieldError("phone");
        }}
        error={fieldErrors.phone}
      />
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
