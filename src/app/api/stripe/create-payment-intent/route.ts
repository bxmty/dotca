import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-03-08',
});

export async function POST(request: Request) {
  try {
    const { amount, currency = 'usd', metadata } = await request.json();

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}