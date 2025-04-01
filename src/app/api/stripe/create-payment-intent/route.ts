import { NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

interface Address {
  country?: string;
  postal_code?: string;
  state?: string;
  city?: string;
  line1?: string;
  line2?: string;
}

// Server-side Stripe API implementation
export async function POST(request: Request) {
  try {
    // Parse request body
    const { amount, currency = 'usd', metadata = {}, address = null } = await request.json();
    
    if (!amount || isNaN(amount)) {
      throw new Error('A valid amount is required');
    }

    // Get Stripe instance (asynchronously)
    const stripe = await getServerStripe();

    // Create params for PaymentIntent
    const params: Stripe.PaymentIntentCreateParams = {
      amount,
      currency,
      metadata: metadata as Record<string, string>,
      automatic_payment_methods: {
        enabled: true,
      },
      shipping: {
        name: metadata.customer_name || 'Customer', // Default to 'Customer' if name is not provided
        phone: '',  // Will be collected by Address Element
        address: {
          line1: '',  // Will be collected by Address Element
          city: '',   // Will be collected by Address Element
          state: '',  // Will be collected by Address Element
          postal_code: '', // Will be collected by Address Element
          country: 'US', // Default to US, will be updated by Address Element
        },
      }
    };

    // Add tax calculation parameters if address is provided
    if (address) {
      // Add automatic_tax property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (params as any).automatic_tax = { enabled: true };
      
      // If address is provided, update the shipping address for tax calculation
      const typedAddress = address as Address;
      if (typedAddress.country && typedAddress.postal_code) {
        params.shipping.address = {
          country: typedAddress.country,
          postal_code: typedAddress.postal_code,
          state: typedAddress.state || '',
          city: typedAddress.city || '',
          line1: typedAddress.line1 || '',
          line2: typedAddress.line2 || '',
        };
      }
    }

    // Create a PaymentIntent with the order amount, currency and tax calculation
    const paymentIntent = await stripe.paymentIntents.create(params);

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      tax: paymentIntent.automatic_tax
    });
  } catch (error) {
    console.error('Stripe error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}