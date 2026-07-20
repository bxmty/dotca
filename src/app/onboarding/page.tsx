"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import AddressAutocomplete from "../components/AddressAutocomplete";
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

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState("");
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (phone: string): void => {
    setFormData((prev) => ({
      ...prev,
      contactPhone: `+${phone}`, // Add + prefix for E.164 format
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

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="bg-body-tertiary">
      {/* Custom Header for Onboarding */}
      <header className="bg-body shadow-sm py-3">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Image
              src="/vercel.svg"
              alt="Company Logo"
              width={100}
              height={24}
              className="dark-invert"
            />
          </div>
          <div className="small text-body-secondary">
            {isComplete
              ? "Onboarding • Complete"
              : `Onboarding • Step ${step} of 3`}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-5">
        <div
          className="card mx-auto shadow rounded"
          style={{ maxWidth: "800px" }}
        >
          <div className="card-body p-4 p-md-5">
            {isComplete ? (
              <div className="text-center py-4">
                <div className="text-success mb-3">
                  <svg
                    aria-hidden="true"
                    width="64"
                    height="64"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <h1 className="fs-3 fw-bold mb-3">Onboarding Complete</h1>
                <p className="text-body-secondary mb-4">
                  Thank you! We&apos;ve received your information and will be in
                  touch within one business day to get started.
                </p>
                <Link href="/" className="btn btn-dark px-4">
                  Return to Home
                </Link>
              </div>
            ) : (
              <>
                <h1 className="fs-3 fw-bold mb-4">
                  {step === 1 && "Company Information"}
                  {step === 2 && "Contact Details"}
                  {step === 3 && "IT Environment"}
                </h1>

                {submitError && (
                  <div className="alert alert-danger mb-4" role="alert">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
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
                    <div className="mb-4">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label htmlFor="companyName" className="form-label">
                            Company Name
                          </label>
                          <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="industry" className="form-label">
                            Industry
                          </label>
                          <input
                            type="text"
                            id="industry"
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="employeeCount" className="form-label">
                          Number of Employees
                        </label>
                        <select
                          id="employeeCount"
                          name="employeeCount"
                          value={formData.employeeCount}
                          onChange={handleChange}
                          className="form-select"
                          required
                        >
                          <option value="">Select</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="501+">501+</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Contact Details */}
                  {step === 2 && (
                    <div className="mb-4">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label htmlFor="contactName" className="form-label">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            id="contactName"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="contactEmail" className="form-label">
                            Email
                          </label>
                          <input
                            type="email"
                            id="contactEmail"
                            name="contactEmail"
                            value={formData.contactEmail}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="contactPhone" className="form-label">
                          Phone Number
                        </label>
                        <PhoneInput
                          country={"ca"} // Default country
                          value={formData.contactPhone.replace(/^\+/, "")} // Remove + prefix for the component
                          onChange={handlePhoneChange}
                          inputClass="form-control"
                          containerClass="phone-input-container"
                          buttonClass="phone-input-dropdown"
                          inputProps={{
                            id: "contactPhone",
                            name: "contactPhone",
                            required: true,
                            autoFocus: false,
                          }}
                        />
                      </div>
                      <div className="mt-4">
                        <label htmlFor="address" className="form-label">
                          Address
                        </label>
                        <AddressAutocomplete
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          onSelectAddress={(suggestion: AddressSuggestion) => {
                            setFormData((prev) => ({
                              ...prev,
                              address: suggestion.addressLine,
                              city: suggestion.city || prev.city,
                              state: suggestion.state || prev.state,
                              zipCode: suggestion.postalCode || prev.zipCode,
                            }));
                          }}
                          required
                        />
                      </div>
                      <div className="row g-4 mt-2">
                        <div className="col-md-4">
                          <label htmlFor="city" className="form-label">
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="state" className="form-label">
                            Province/State
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="zipCode" className="form-label">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: IT Environment */}
                  {step === 3 && (
                    <div className="mb-4">
                      <div className="mb-4">
                        <label
                          htmlFor="currentITProviders"
                          className="form-label"
                        >
                          Current IT Providers/Services
                        </label>
                        <textarea
                          id="currentITProviders"
                          name="currentITProviders"
                          value={formData.currentITProviders}
                          onChange={handleChange}
                          rows={3}
                          className="form-control"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="softwareUsed" className="form-label">
                          Key Software/Applications Used
                        </label>
                        <textarea
                          id="softwareUsed"
                          name="softwareUsed"
                          value={formData.softwareUsed}
                          onChange={handleChange}
                          rows={3}
                          className="form-control"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="painPoints" className="form-label">
                          Current IT Pain Points
                        </label>
                        <textarea
                          id="painPoints"
                          name="painPoints"
                          value={formData.painPoints}
                          onChange={handleChange}
                          rows={3}
                          className="form-control"
                        />
                      </div>
                      <div>
                        <label htmlFor="goals" className="form-label">
                          IT Goals for Next 12 Months
                        </label>
                        <textarea
                          id="goals"
                          name="goals"
                          value={formData.goals}
                          onChange={handleChange}
                          rows={3}
                          className="form-control"
                        />
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="mt-5 d-flex justify-content-between">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="btn btn-secondary px-4"
                      >
                        Back
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="btn btn-dark ms-auto px-4"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-dark ms-auto px-4"
                      >
                        {isSubmitting ? "Submitting..." : "Complete Onboarding"}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
