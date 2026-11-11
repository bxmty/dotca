"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import PlanSelector from "./PlanSelector";
import StripeWrapper, {
  type CheckoutCustomer,
} from "../components/StripeWrapper";
import StripePaymentForm from "../components/StripePaymentForm";
import AddressAutocomplete from "../components/AddressAutocomplete";
import BriefOptInCheckbox from "../components/BriefOptInCheckbox";
import { Button, ButtonLink } from "../components/Button";
import {
  Field,
  getErrorProps,
  PhoneField,
  TextField,
} from "../components/Field";
import SegmentedChoice, {
  type SegmentedOption,
} from "../components/SegmentedChoice";
import StatusNote from "../components/StatusNote";
import StatusPage from "../components/StatusPage";
import TextLink from "../components/TextLink";
import TickList from "../components/TickList";
import {
  INCOMPLETE_EMAIL_MESSAGE,
  isEmailAddress,
  omitFieldErrors,
} from "@/lib/formValidation";
import type { AddressSuggestion } from "@/lib/nominatim";
import {
  ANNUAL_DISCOUNT_PERCENT,
  estimatePrice,
  formatPrice,
  isFreePlan,
  type Plan,
} from "@/lib/plan-catalog";
import {
  MAX_EMPLOYEE_COUNT,
  MIN_EMPLOYEE_COUNT,
  type BillingCycle,
} from "@/lib/pricing";

type CustomerFields = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};
type CustomerField = keyof CustomerFields;
type FieldErrors = Partial<Record<CustomerField, string>>;

// Every customer field is required. Messages are worded as the fix
// (Component Spec, forms), in field order, so focus can move to the first.
const REQUIRED_FIELD_MESSAGES: Record<CustomerField, string> = {
  firstName: "enter your first name",
  lastName: "enter your last name",
  email: "enter your email address",
  company: "enter your company name",
  phone: "enter a phone number we can reach you on",
  address: "enter your street address",
  city: "enter your city",
  state: "enter your province or state",
  zip: "enter your postal code",
};
const CUSTOMER_FIELDS = Object.keys(REQUIRED_FIELD_MESSAGES) as CustomerField[];

// A country code is at most three digits, so anything shorter is no number
// at all; react-phone-input-2 reports the bare country code when empty.
const MAX_COUNTRY_CODE_DIGITS = 3;

function validateCustomerFields(fields: CustomerFields): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of CUSTOMER_FIELDS) {
    if (!fields[field].trim()) {
      errors[field] = REQUIRED_FIELD_MESSAGES[field];
    }
  }
  if (!errors.email && !isEmailAddress(fields.email)) {
    errors.email = INCOMPLETE_EMAIL_MESSAGE;
  }
  if (fields.phone.replace(/\D/g, "").length <= MAX_COUNTRY_CODE_DIGITS) {
    errors.phone = REQUIRED_FIELD_MESSAGES.phone;
  }
  return errors;
}

const BILLING_CYCLE_OPTIONS: readonly SegmentedOption<BillingCycle>[] = [
  { value: "monthly", label: "Monthly" },
  {
    value: "annual",
    label: "Annual",
    detail: `save ${ANNUAL_DISCOUNT_PERCENT}%`,
  },
];

const SUMMARY_ROW_CLASS_NAME = "flex justify-between gap-4";
const PRICE_CLASS_NAME = "font-mono font-medium tabular-nums";

export default function Checkout() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CustomerFields>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  // Snapshot of customer info taken when the user continues to payment;
  // editing any field clears it so the subscription is created from what's
  // on screen, never a stale copy.
  const [confirmedCustomer, setConfirmedCustomer] =
    useState<CheckoutCustomer | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Never pre-checked: brief consent must be express (CASL), and paid
  // signups get the box rather than relying on implied consent
  const [wantsBrief, setWantsBrief] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(MIN_EMPLOYEE_COUNT);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const handlePlanSelected = (plan: Plan | null) => {
    // The Free plan has no payment to take; onboarding is its signup path
    if (plan && isFreePlan(plan)) {
      router.replace("/onboarding");
      return;
    }
    setSelectedPlan(plan);
    setLoading(false);
  };

  const clearFieldErrors = (fields: CustomerField[]) =>
    setFieldErrors((errors) => omitFieldErrors(errors, fields));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setConfirmedCustomer(null);
    clearFieldErrors([name as CustomerField]);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (phone: string): void => {
    setConfirmedCustomer(null);
    clearFieldErrors(["phone"]);
    setFormData((prev) => ({ ...prev, phone }));
  };

  const handleAddressSelected = (suggestion: AddressSuggestion): void => {
    setConfirmedCustomer(null);
    clearFieldErrors(["address", "city", "state", "zip"]);
    setFormData((prev) => ({
      ...prev,
      address: suggestion.addressLine,
      city: suggestion.city || prev.city,
      state: suggestion.state || prev.state,
      zip: suggestion.postalCode || prev.zip,
    }));
  };

  // Like a field edit, a changed opt-in invalidates the confirmed snapshot so
  // the subscription's metadata carries what's on screen
  const handleWantsBriefChange = (isChecked: boolean): void => {
    setConfirmedCustomer(null);
    setWantsBrief(isChecked);
  };

  const handleEmployeeCountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value);
    if (value >= MIN_EMPLOYEE_COUNT && value <= MAX_EMPLOYEE_COUNT) {
      setEmployeeCount(value);
    }
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    const errors = validateCustomerFields(formData);
    setFieldErrors(errors);
    const firstInvalidField = CUSTOMER_FIELDS.find((field) => errors[field]);
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setConfirmedCustomer({
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
    });
  };

  const handlePaymentSuccess = () => {
    router.push("/checkout/confirmation?redirect_status=succeeded");
  };

  const planSelector = (
    // Invisible component to handle URL params with suspense
    <Suspense fallback={null}>
      <PlanSelector onPlanSelected={handlePlanSelected} />
    </Suspense>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-16 md:px-7">
        <Suspense fallback={<p>Loading plans...</p>}>
          <PlanSelector onPlanSelected={handlePlanSelected} />
        </Suspense>
        <p role="status" className="m-0 font-mono text-label text-muted">
          Loading...
        </p>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <>
        {planSelector}
        <StatusPage
          kicker="Checkout"
          heading="No Plan Selected"
          action={
            <ButtonLink variant="secondary" href="/pricing">
              View Pricing Options
            </ButtonLink>
          }
        >
          <p className="m-0">
            Please select a plan from our pricing page to proceed with checkout.
          </p>
        </StatusPage>
      </>
    );
  }

  // An on-screen estimate only: Stripe computes the amount actually charged
  const estimate = estimatePrice({
    plan: selectedPlan,
    employeeCount,
    billingCycle,
  });
  const unitPrice = formatPrice(selectedPlan.monthlyUnitPrice);
  const estimatedTotal = formatPrice(estimate.total);

  return (
    <>
      {planSelector}

      <section className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 md:px-7 md:py-16">
        <h1 className="m-0 border-t-2 border-ink pt-3.5 text-h2 leading-tight font-light tracking-[-0.02em] text-balance md:text-section">
          Complete Your Purchase
        </h1>

        {/* Plan summary */}
        <div className="grid gap-6 border border-rule bg-cell p-5 md:p-7">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="grid gap-1">
              <h2 className="m-0 font-mono text-label font-normal text-muted">
                Your Selected Plan
              </h2>
              <p className="m-0 text-h3 leading-tight font-semibold">
                {selectedPlan.name} Plan
              </p>
              <p className={`m-0 text-body ${PRICE_CLASS_NAME}`}>
                {unitPrice} per user per month
              </p>
              <p className="m-0 max-w-[62ch] text-small text-muted">
                {selectedPlan.description}
              </p>
            </div>
            <TextLink href="/pricing" className="text-small">
              Change Plan
            </TextLink>
          </div>

          <div className="grid items-start gap-6 border-t border-rule pt-6 md:grid-cols-2">
            <TextField
              id="employeeCount"
              label={`Number of Employees (minimum ${MIN_EMPLOYEE_COUNT})`}
              type="number"
              min={MIN_EMPLOYEE_COUNT}
              max={MAX_EMPLOYEE_COUNT}
              value={employeeCount}
              onChange={handleEmployeeCountChange}
              required
            />
            <div className="grid gap-3">
              <SegmentedChoice
                legend="Billing Cycle"
                name="billingCycle"
                options={BILLING_CYCLE_OPTIONS}
                value={billingCycle}
                onChange={setBillingCycle}
              />
              <div
                className={`${SUMMARY_ROW_CLASS_NAME} items-baseline font-semibold`}
              >
                <span>
                  {billingCycle === "annual" ? "Annual" : "Monthly"} Total:
                </span>
                <span className={`text-h2 text-fig ${PRICE_CLASS_NAME}`}>
                  {estimatedTotal}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-rule pt-6">
            <h3 className="m-0 text-small font-semibold">Includes:</h3>
            <TickList
              items={selectedPlan.features.map((feature) => ({
                label: feature,
              }))}
            />
          </div>
        </div>

        {/* Checkout form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid items-start gap-10 md:grid-cols-2"
        >
          <div className="grid gap-4.5">
            <h2 className="m-0 text-h3 leading-tight font-semibold">
              Customer Information
            </h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <TextField
                id="firstName"
                label="First Name*"
                type="text"
                name="firstName"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                error={fieldErrors.firstName}
              />
              <TextField
                id="lastName"
                label="Last Name*"
                type="text"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                error={fieldErrors.lastName}
              />
            </div>
            <TextField
              id="email"
              label="Email Address*"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              error={fieldErrors.email}
            />
            <TextField
              id="company"
              label="Company Name"
              type="text"
              name="company"
              autoComplete="organization"
              value={formData.company}
              onChange={handleInputChange}
              required
              error={fieldErrors.company}
            />
            <PhoneField
              id="phone"
              name="phone"
              label="Phone Number*"
              value={formData.phone}
              onChange={handlePhoneChange}
              error={fieldErrors.phone}
            />
            <Field id="address" label="Address" error={fieldErrors.address}>
              <AddressAutocomplete
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                required
                error={fieldErrors.state}
              />
              <TextField
                id="zip"
                label="Postal Code"
                type="text"
                name="zip"
                autoComplete="postal-code"
                value={formData.zip}
                onChange={handleInputChange}
                required
                error={fieldErrors.zip}
              />
            </div>
            <BriefOptInCheckbox
              id="checkout-wants-brief"
              isChecked={wantsBrief}
              onChange={handleWantsBriefChange}
            />
          </div>

          <div className="grid gap-4.5">
            <h2 className="m-0 text-h3 leading-tight font-semibold">Payment</h2>
            {confirmedCustomer ? (
              <StripeWrapper
                plan={selectedPlan.name}
                employeeCount={employeeCount}
                billingCycle={billingCycle}
                customer={confirmedCustomer}
                wantsBrief={wantsBrief}
              >
                <StripePaymentForm onSuccess={handlePaymentSuccess} />
              </StripeWrapper>
            ) : (
              <div className="grid gap-3">
                <p className="m-0 text-small text-muted">
                  Fill in your information, then continue to our secure payment
                  form.
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  isBlock
                  data-testid="continue-to-payment"
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            <p className="m-0 text-small text-muted">
              Need invoicing or a custom plan?{" "}
              <TextLink href="/#contact">Contact us →</TextLink>
            </p>

            {/* Order summary */}
            <div className="grid gap-2 border-t border-rule pt-4 text-small">
              <div className={SUMMARY_ROW_CLASS_NAME}>
                <span>
                  {selectedPlan.name} Plan ({unitPrice} × {employeeCount}{" "}
                  employees
                  {billingCycle === "annual" ? " × 12 months" : ""})
                </span>
                <span className={PRICE_CLASS_NAME}>
                  {formatPrice(estimate.subtotal)}
                </span>
              </div>

              {billingCycle === "annual" && (
                <div className={SUMMARY_ROW_CLASS_NAME}>
                  <span>Annual Discount ({ANNUAL_DISCOUNT_PERCENT}%)</span>
                  <span className={PRICE_CLASS_NAME}>
                    -{formatPrice(estimate.discount)}
                  </span>
                </div>
              )}

              <div className={`${SUMMARY_ROW_CLASS_NAME} text-muted`}>
                <span>Tax</span>
                <span>Calculated at next step</span>
              </div>
              <div
                className={`${SUMMARY_ROW_CLASS_NAME} mt-2 items-baseline border-t-2 border-ink pt-3 text-body font-semibold`}
              >
                <span>Estimated Total</span>
                <span className={`text-h3 ${PRICE_CLASS_NAME}`}>
                  {estimatedTotal}
                </span>
              </div>
            </div>
          </div>

          <StatusNote tone="note" label="Note" className="md:col-span-2">
            <p className="m-0">
              By completing your purchase, you agree to our{" "}
              <TextLink href="/terms-of-service">Terms of Service</TextLink> and{" "}
              <TextLink href="/privacy-policy">Privacy Policy</TextLink>.
            </p>
          </StatusNote>
        </form>
      </section>
    </>
  );
}
