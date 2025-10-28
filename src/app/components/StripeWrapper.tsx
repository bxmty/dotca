'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../../lib/stripe';

interface StripeWrapperProps {
  children: ReactNode;
  amount: number;
  metadata?: Record<string, string>;
}

export default function StripeWrapper({
  children,
  amount,
  metadata,
}: StripeWrapperProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a payment intent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            metadata: metadata || {},
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initialize payment');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize payment. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, metadata]);

  const options = {
    clientSecret,
    appearance: {
      theme: 'flat' as const,
      variables: {
        colorPrimary: '#198754', // Bootstrap success color
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        borderRadius: '0.375rem', // Match Bootstrap's border-radius
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
        {process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' && (
          <p className="mt-2 small text-muted">
            Environment: {process.env.NEXT_PUBLIC_ENVIRONMENT}, API URL:{' '}
            {process.env.NEXT_PUBLIC_API_URL}, Stripe Key Set:{' '}
            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Yes' : 'No'}
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
