import { NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe";
import { priceOrder } from "@/lib/pricing";

// The amount is always computed server-side from the order details;
// a client-supplied amount is never accepted.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const result = priceOrder({
    plan: body?.plan,
    employeeCount: body?.employeeCount,
    billingCycle: body?.billingCycle,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { order } = result;

  try {
    const stripe = await getServerStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.amountCents,
      currency: order.currency,
      metadata: {
        plan: order.planName,
        employees: order.employeeCount.toString(),
        billing_cycle: order.billingCycle,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Unable to process the payment request" },
      { status: 500 },
    );
  }
}
