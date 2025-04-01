'use client';

import { ReactNode, useEffect, useState, createContext } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';

interface StripeWrapperProps {
  children: ReactNode;
  amount: number;
  metadata?: Record<string, string>;
}

interface TaxInfo {
  enabled: boolean;
  status?: string;
  amount_decimal?: string;
  amount?: number;
}

interface StripeContextValue {
  taxInfo: TaxInfo | null;
  updateAddress: (address: Record<string, unknown>) => Promise<void>;
}

// Create a context to share tax information with child components
export const StripeContext = createContext<StripeContextValue>({
  taxInfo: null,
  updateAddress: async () => {}
});

export default function StripeWrapper({ children, amount, metadata }: StripeWrapperProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);
  const [customerAddress, setCustomerAddress] = useState<Record<string, unknown> | null>(null);

  const createOrUpdatePaymentIntent = async (address?: Record<string, unknown>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount,
          metadata: metadata || {},
          address: address || customerAddress
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
      setTaxInfo(data.tax);
      return data;
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Method to update address and recalculate tax
  const updateAddress = async (address: Record<string, unknown>) => {
    if (!address || !address.country || !address.postal_code) return;
    
    setCustomerAddress(address);
    await createOrUpdatePaymentIntent(address);
  };

  useEffect(() => {
    // Create a payment intent as soon as the page loads
    createOrUpdatePaymentIntent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, metadata]);

  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#198754', // Bootstrap success color
        colorBackground: '#212529', // Bootstrap dark color
        colorText: '#ffffff',
        colorDanger: '#dc3545', // Bootstrap danger color
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        borderRadius: '0.375rem', // Match Bootstrap's border-radius
        spacingUnit: '0.5rem',
        spacingGridRow: '1rem',
      },
      rules: {
        '.Input': {
          borderWidth: '1px',
          borderColor: '#ffffff'
        },
        '.Label': {
          color: '#ffffff'
        }
      }
    },
    loader: 'auto' as const, // Show the loading UI
  };

  if (loading) {
    return <div className="text-center py-3">Loading payment form...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <p className="mb-2 fw-bold">Something went wrong!</p>
        <p className="mb-0">{error}</p>
        {process.env.NEXT_PUBLIC_ENVIRONMENT === 'qa' && (
          <p className="mt-2 small text-muted">
            Environment: {process.env.NEXT_PUBLIC_ENVIRONMENT}, 
            API URL: {process.env.NEXT_PUBLIC_API_URL}, 
            Stripe Key Set: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Yes' : 'No'}
          </p>
        )}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="alert alert-danger">
        <p className="mb-0">Failed to initialize payment. Please refresh the page or try again later.</p>
      </div>
    );
  }

  // Context value with tax information and methods
  const contextValue: StripeContextValue = {
    taxInfo,
    updateAddress
  };

  return (
    <StripeContext.Provider value={contextValue}>
      <Elements stripe={getStripe()} options={options}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
}