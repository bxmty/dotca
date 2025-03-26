'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe publishable key from environment variable
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface StripeWrapperProps {
  children: ReactNode;
  amount: number;
  metadata?: Record<string, string>;
}

export default function StripeWrapper({ children, amount, metadata }: StripeWrapperProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a payment intent as soon as the page loads
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: amount,
        metadata: metadata || {},
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
        setLoading(false);
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch((_err) => {
        setError('Failed to initialize payment. Please try again.');
        setLoading(false);
      });
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
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}