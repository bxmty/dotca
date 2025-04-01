'use client';

import { useState } from 'react';
import { 
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  onSuccess: () => void;
}

export default function StripePaymentForm({ onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    if (!email || !companyName) {
      setErrorMessage('Email and Company Name are required');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
        payment_method_data: {
          billing_details: {
            email: email,
            name: companyName,
          },
        },
      },
      redirect: 'if_required',
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
    <form onSubmit={handleSubmit} className="stripe-form">
      <h3 className="fs-5 fw-medium mb-3 text-white">Customer Information</h3>
      
      <div className="mb-3">
        <label htmlFor="email" className="form-label text-white">Email Address *</label>
        <input 
          type="email" 
          id="email" 
          className="form-control bg-dark text-white border-white" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@company.com"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="companyName" className="form-label text-white">Company Name *</label>
        <input 
          type="text" 
          id="companyName" 
          className="form-control bg-dark text-white border-white" 
          value={companyName} 
          onChange={(e) => setCompanyName(e.target.value)}
          required
          placeholder="Your Company"
        />
      </div>
      
      <h3 className="fs-5 fw-medium mb-3 text-white">Billing Address</h3>
      <AddressElement 
        options={{
          mode: 'billing',
          autocomplete: {
            mode: 'automatic',
          },
          fields: {
            phone: 'always',
          },
          validation: {
            phone: {
              required: 'always',
            },
          },
        }}
      />
      
      <h3 className="fs-5 fw-medium mb-3 mt-4 text-white">Payment Details</h3>
      <PaymentElement />
      
      {errorMessage && (
        <div className="alert alert-danger mt-3">
          {errorMessage}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="btn btn-success w-100 py-3 mt-3 fs-5"
      >
        {isLoading ? 'Processing...' : 'Complete Payment'}
      </button>
    </form>
  );
}