"use client";

import { useState, FormEvent } from "react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { Button, ButtonLink } from "../components/Button";
import {
  Field,
  getErrorProps,
  INPUT_CLASS_NAME,
  PhoneField,
  TextField,
} from "../components/Field";
import StatusNote from "../components/StatusNote";
import StatusPage from "../components/StatusPage";
import StepProgress from "../components/StepProgress";
import {
  INCOMPLETE_EMAIL_MESSAGE,
  isEmailAddress,
  omitFieldErrors,
} from "@/lib/formValidation";
import type { AddressSuggestion } from "@/lib/nominatim";

interface FormData {
  companyName: string;
  industry: string;
  employeeCount: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  currentITProviders: string;
  softwareUsed: string;
  painPoints: string;
  goals: string;
  /** Honeypot: humans never see this field; bots that fill it are dropped */
  website: string;
}

type FormField = keyof FormData;
type FieldErrors = Partial<Record<FormField, string>>;

const STEP_TITLES = ["Company", "Contact", "IT environment"] as const;
const STEP_HEADINGS = [
  "Company Information",
  "Contact Details",
  "IT Environment",
] as const;

// The fields the onboarding API requires, by step, in field order so focus
// can move to the first invalid one. Messages are worded as the fix
// (Component Spec, forms). Step 3 is all optional.
const REQUIRED_FIELD_MESSAGES: Partial<Record<FormField, string>>[] = [
  {
    companyName: "enter your company name",
    industry: "enter your industry",
    employeeCount: "choose your team size",
  },
  {
    contactName: "enter your name",
    contactEmail: "enter your email address",
    contactPhone: "enter a phone number with at least 10 digits",
    address: "enter your street address",
    city: "enter your city",
    state: "enter your province or state",
    zipCode: "enter your postal code",
  },
  {},
];

// The same phone rule the onboarding API applies
const MIN_PHONE_DIGITS = 10;

function validateStep(step: number, formData: FormData): FieldErrors {
  const messages = REQUIRED_FIELD_MESSAGES[step - 1];
  const errors: FieldErrors = {};
  for (const [field, message] of Object.entries(messages) as [
    FormField,
    string,
  ][]) {
    if (!formData[field].trim()) errors[field] = message;
  }
  if (step === 2) {
    if (!errors.contactEmail && !isEmailAddress(formData.contactEmail)) {
      errors.contactEmail = INCOMPLETE_EMAIL_MESSAGE;
    }
    if (formData.contactPhone.replace(/\D/g, "").length < MIN_PHONE_DIGITS) {
      errors.contactPhone = messages.contactPhone;
    }
  }
  return errors;
}

const TEXTAREA_CLASS_NAME = `${INPUT_CLASS_NAME} resize-y`;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    industry: "",
    employeeCount: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    currentITProviders: "",
    softwareUsed: "",
    painPoints: "",
    goals: "",
    website: "",
  });

  const clearFieldErrors = (fields: FormField[]) =>
    setFieldErrors((errors) => omitFieldErrors(errors, fields));

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    clearFieldErrors([name as FormField]);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (contactPhone: string): void => {
    clearFieldErrors(["contactPhone"]);
    setFormData((prev) => ({ ...prev, contactPhone }));
  };

  const handleAddressSelected = (suggestion: AddressSuggestion): void => {
    clearFieldErrors(["address", "city", "state", "zipCode"]);
    setFormData((prev) => ({
      ...prev,
      address: suggestion.addressLine,
      city: suggestion.city || prev.city,
      state: suggestion.state || prev.state,
      zipCode: suggestion.postalCode || prev.zipCode,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Send form data to API
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.error ||
            `Failed to submit form (Status: ${response.status})`,
        );
      }

      setIsComplete(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error instanceof Error
          ? `${error.message}. Please try again.`
          : "Failed to submit form. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    const errors = validateStep(step, formData);
    setFieldErrors(errors);
    const firstInvalidField = Object.keys(
      REQUIRED_FIELD_MESSAGES[step - 1],
    ).find((field) => errors[field as FormField]);
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }
    setStep(step + 1);
  };
  const goToPreviousStep = () => {
    setFieldErrors({});
    setStep(step - 1);
  };

  if (isComplete) {
    return (
      <StatusPage
        kicker="Onboarding · Complete"
        heading="Onboarding Complete"
        action={
          <ButtonLink variant="secondary" href="/">
            Return to Home
          </ButtonLink>
        }
      >
        <p className="m-0">
          Thank you! We&apos;ve received your information and will be in touch
          within one business day to get started.
        </p>
      </StatusPage>
    );
  }

  return (
    <section className="mx-auto grid max-w-[720px] gap-6 px-4 py-12 md:py-16">
      <div className="grid gap-4 border-t-2 border-ink pt-6">
        <p className="m-0 font-mono text-label text-muted">Onboarding</p>
        <StepProgress steps={STEP_TITLES} currentStep={step} />
        <h1 className="m-0 text-h2 leading-tight font-light tracking-[-0.02em] text-balance md:text-section">
          {STEP_HEADINGS[step - 1]}
        </h1>
      </div>

      {submitError && (
        <StatusNote tone="error" label="Error">
          {submitError}
        </StatusNote>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid gap-4.5">
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
          }}
        >
          <label htmlFor="onboarding-website">Website</label>
          <input
            type="text"
            id="onboarding-website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Step 1: Company Information */}
        {step === 1 && (
          <>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <TextField
                id="companyName"
                label="Company Name"
                type="text"
                name="companyName"
                autoComplete="organization"
                value={formData.companyName}
                onChange={handleChange}
                required
                error={fieldErrors.companyName}
              />
              <TextField
                id="industry"
                label="Industry"
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                error={fieldErrors.industry}
              />
            </div>
            <Field
              id="employeeCount"
              label="Number of Employees"
              error={fieldErrors.employeeCount}
            >
              <select
                id="employeeCount"
                name="employeeCount"
                value={formData.employeeCount}
                onChange={handleChange}
                className={INPUT_CLASS_NAME}
                required
                {...getErrorProps("employeeCount", fieldErrors.employeeCount)}
              >
                <option value="">Select</option>
                <option value="5-10">5-10</option>
                <option value="11-25">11-25</option>
                <option value="26-50">26-50</option>
                <option value="51+">51+</option>
              </select>
            </Field>
          </>
        )}

        {/* Step 2: Contact Details */}
        {step === 2 && (
          <>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <TextField
                id="contactName"
                label="Contact Name"
                type="text"
                name="contactName"
                autoComplete="name"
                value={formData.contactName}
                onChange={handleChange}
                required
                error={fieldErrors.contactName}
              />
              <TextField
                id="contactEmail"
                label="Email"
                type="email"
                name="contactEmail"
                autoComplete="email"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                error={fieldErrors.contactEmail}
              />
            </div>
            <PhoneField
              id="contactPhone"
              name="contactPhone"
              label="Phone Number"
              value={formData.contactPhone}
              onChange={handlePhoneChange}
              error={fieldErrors.contactPhone}
            />
            <Field id="address" label="Address" error={fieldErrors.address}>
              <AddressAutocomplete
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onSelectAddress={handleAddressSelected}
                required
                {...getErrorProps("address", fieldErrors.address)}
              />
            </Field>
            <div className="grid gap-3.5 md:grid-cols-3">
              <TextField
                id="city"
                label="City"
                type="text"
                name="city"
                autoComplete="address-level2"
                value={formData.city}
                onChange={handleChange}
                required
                error={fieldErrors.city}
              />
              <TextField
                id="state"
                label="Province/State"
                type="text"
                name="state"
                autoComplete="address-level1"
                value={formData.state}
                onChange={handleChange}
                required
                error={fieldErrors.state}
              />
              <TextField
                id="zipCode"
                label="Postal Code"
                type="text"
                name="zipCode"
                autoComplete="postal-code"
                value={formData.zipCode}
                onChange={handleChange}
                required
                error={fieldErrors.zipCode}
              />
            </div>
          </>
        )}

        {/* Step 3: IT Environment */}
        {step === 3 && (
          <>
            <Field
              id="currentITProviders"
              label="Current IT Providers/Services"
              isOptional
            >
              <textarea
                id="currentITProviders"
                name="currentITProviders"
                value={formData.currentITProviders}
                onChange={handleChange}
                rows={3}
                className={TEXTAREA_CLASS_NAME}
              />
            </Field>
            <Field
              id="softwareUsed"
              label="Key Software/Applications Used"
              isOptional
            >
              <textarea
                id="softwareUsed"
                name="softwareUsed"
                value={formData.softwareUsed}
                onChange={handleChange}
                rows={3}
                className={TEXTAREA_CLASS_NAME}
              />
            </Field>
            <Field id="painPoints" label="Current IT Pain Points" isOptional>
              <textarea
                id="painPoints"
                name="painPoints"
                value={formData.painPoints}
                onChange={handleChange}
                rows={3}
                className={TEXTAREA_CLASS_NAME}
              />
            </Field>
            <Field id="goals" label="IT Goals for Next 12 Months" isOptional>
              <textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleChange}
                rows={3}
                className={TEXTAREA_CLASS_NAME}
              />
            </Field>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="mt-4 flex justify-between gap-3">
          {step > 1 && (
            <Button variant="secondary" onClick={goToPreviousStep}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              variant="primary"
              onClick={goToNextStep}
              className="ml-auto"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="ml-auto"
            >
              {isSubmitting ? "Submitting..." : "Complete Onboarding"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
