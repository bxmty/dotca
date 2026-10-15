"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentFormProps {
  onSuccess: () => void;
}

// Rendered inside the checkout page's <form>, so this component must not
// render a <form> of its own (nested forms are invalid HTML and dropped by
// browsers). The payment is confirmed from the button's click handler.
export default function StripePaymentForm({
  onSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleConfirmPayment = async () => {
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      // Payment succeeded
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <div className="stripe-form">
      <PaymentElement />

      {errorMessage && (
        <div className="alert alert-danger mt-3">{errorMessage}</div>
      )}

      <button
        type="button"
        onClick={handleConfirmPayment}
        disabled={!stripe || isLoading}
        className="btn btn-success w-100 py-3 mt-3 fs-5"
      >
        {isLoading ? "Processing..." : "Complete Payment"}
      </button>
    </div>
  );
}
