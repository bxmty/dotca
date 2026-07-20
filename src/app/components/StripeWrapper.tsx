"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "../../lib/stripe";

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface StripeWrapperProps {
  children: ReactNode;
  plan: string;
  employeeCount: number;
  billingCycle: string;
  customer: CheckoutCustomer;
}

export default function StripeWrapper({
  children,
  plan,
  employeeCount,
  billingCycle,
  customer,
}: StripeWrapperProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // One key per distinct order, so a re-render or double-fire can only
  // replay the same subscription create, never mint a second one.
  const idempotencyKey = useMemo(
    () => globalThis.crypto.randomUUID(),
    [plan, employeeCount, billingCycle, customer],
  );

  useEffect(() => {
    // Create the subscription as soon as the order details are confirmed
    const createSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        // The server resolves the price from these order details;
        // no amount is sent from the client.
        const response = await fetch("/api/stripe/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            employeeCount,
            billingCycle,
            customer,
            idempotencyKey,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to initialize payment");
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Payment initialization error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize payment. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    createSubscription();
  }, [plan, employeeCount, billingCycle, customer, idempotencyKey]);

  const options = {
    clientSecret,
    appearance: {
      theme: "flat" as const,
      variables: {
        colorPrimary: "#198754", // Bootstrap success color
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        borderRadius: "0.375rem", // Match Bootstrap's border-radius
      },
    },
  };

  if (loading) {
    return <div className="text-center py-3">Loading payment form...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <p className="mb-2 fw-bold">Something went wrong!</p>
        <p className="mb-0">{error}</p>
        {process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" && (
          <p className="mt-2 small text-muted">
            Environment: {process.env.NEXT_PUBLIC_ENVIRONMENT}, API URL:{" "}
            {process.env.NEXT_PUBLIC_API_URL}, Stripe Key Set:{" "}
            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Yes" : "No"}
          </p>
        )}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="alert alert-danger">
        <p className="mb-0">
          Failed to initialize payment. Please refresh the page or try again
          later.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={getStripe()} options={options}>
      {children}
    </Elements>
  );
}
