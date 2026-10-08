"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import PlanSelector from "./PlanSelector";
import StripeWrapper, {
  type CheckoutCustomer,
} from "../components/StripeWrapper";
import StripePaymentForm from "../components/StripePaymentForm";
import AddressAutocomplete from "../components/AddressAutocomplete";
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
import type { BillingCycle } from "@/lib/pricing";

interface PricingPlan {
  name: string;
  unit_price: string;
  description: string;
  features: string[];
}

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
  { value: "annual", label: "Annual", detail: "save 10%" },
];

const SUMMARY_ROW_CLASS_NAME = "flex justify-between gap-4";
const PRICE_CLASS_NAME = "font-mono font-medium tabular-nums";

export default function Checkout() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
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
  const [employeeCount, setEmployeeCount] = useState(5);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  // Pricing plans data
  const pricingPlans = useMemo(
    () => [
      {
        name: "Free",
        unit_price: "$0.00", // Changed from price to unit_price
        description:
          "Ideal for startups and small teams looking to explore our services",
        features: [
          "Automatic Windows Updates",
          "Basic Antivirus Protection",
          "24/7 Device Monitoring",
        ],
      },
      {
        name: "Basic",
        unit_price: "$99.00", // Changed from price to unit_price
        description:
          "Perfect for small teams needing essential IT security and communication tools",
        features: [
          "Password Manager",
          "Business Email Solution",
          "Email Support (Business Hours)",
          "Basic Security Monitoring",
          "Setup & Onboarding Assistance",
        ],
      },
      {
        name: "Standard",
        unit_price: "$249.00", // Changed from price to unit_price
        description:
          "Our most popular option for growing businesses needing comprehensive IT support",
        features: [
          "Everything in Basic",
          "Professional Web Hosting",
          "Microsoft Collaboration Tools",
          "Quarterly IT Assessment",
          "Extended Technical Support",
          "Cloud Backup Solutions",
          "30-day email & phone support",
        ],
      },
      {
        name: "Premium",
        unit_price: "$449.00", // Changed from price to unit_price
        description:
          "Complete IT management solution for businesses requiring enterprise-grade technology",
        features: [
          "Everything in Standard",
          "24/7 Priority Support",
          "Server Monitoring & Management",
          "Reduced Web Design Rates",
          "Advanced Security Suite",
          "Dedicated Account Manager",
          "On-site Consultations",
          "Unlimited Device Support",
        ],
      },
    ],
    [],
  );

  const handlePlanSelected = (plan: PricingPlan | null) => {
    // The Free plan has no payment to take; onboarding is its signup path
    if (plan && plan.name.toLowerCase() === "free") {
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

  const handleEmployeeCountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value);
    if (value >= 5 && value <= 20) {
      setEmployeeCount(value);
    }
  };

  const calculateTotal = (unitPrice: string, count: number) => {
    const price = parseFloat(unitPrice.replace(/[^\d.]/g, ""));
    const baseTotal = price * count;

    // Apply 10% discount for annual billing
    if (billingCycle === "annual") {
      const annualTotal = baseTotal * 12;
      const discountedTotal = annualTotal * 0.9;
      return formatCurrency(discountedTotal);
    }

    return formatCurrency(baseTotal);
  };

  // Helper function to format currency with commas and 2 decimal places
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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
      <PlanSelector
        pricingPlans={pricingPlans}
        onPlanSelected={handlePlanSelected}
      />
    </Suspense>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-16 md:px-7">
        <Suspense fallback={<p>Loading plans...</p>}>
          <PlanSelector
            pricingPlans={pricingPlans}
            onPlanSelected={handlePlanSelected}
          />
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

  const unitPrice = parseFloat(selectedPlan.unit_price.replace(/[^\d.]/g, ""));
  const subtotal =
    unitPrice * employeeCount * (billingCycle === "annual" ? 12 : 1);
  const estimatedTotal = calculateTotal(selectedPlan.unit_price, employeeCount);

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
                {selectedPlan.unit_price} per user per month
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
              label="Number of Employees (minimum 5)"
              type="number"
              min="5"
              max="20"
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
          </div>

          <div className="grid gap-4.5">
            <h2 className="m-0 text-h3 leading-tight font-semibold">Payment</h2>
            {confirmedCustomer ? (
              <StripeWrapper
                plan={selectedPlan.name}
                employeeCount={employeeCount}
                billingCycle={billingCycle}
                customer={confirmedCustomer}
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
                  {selectedPlan.name} Plan ({selectedPlan.unit_price} ×{" "}
                  {employeeCount} employees
                  {billingCycle === "annual" ? " × 12 months" : ""})
                </span>
                <span className={PRICE_CLASS_NAME}>
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {billingCycle === "annual" && (
                <div className={SUMMARY_ROW_CLASS_NAME}>
                  <span>Annual Discount (10%)</span>
                  <span className={PRICE_CLASS_NAME}>
                    -{formatCurrency(subtotal * 0.1)}
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
