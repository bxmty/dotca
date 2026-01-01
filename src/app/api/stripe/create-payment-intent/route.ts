import { NextResponse } from "next/server";
import { getServerStripe } from "../../../../lib/stripe";

// Server-side Stripe API implementation
export async function POST(request: Request) {
  try {
    // Parse request body
    const { amount, currency = "usd", metadata = {} } = await request.json();

    if (!amount || isNaN(amount)) {
      throw new Error("A valid amount is required");
    }

    // Get Stripe instance (asynchronously)
    const stripe = await getServerStripe();

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
