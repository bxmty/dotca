import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getServerStripe,
  resolvePriceId,
  MissingStripePriceError,
} from "@/lib/stripe";
import { isEmailAddress } from "@/lib/formValidation";
import { validateOrder } from "@/lib/pricing";

// Stryker disable next-line StringLiteral: Next.js route-segment config, not read under jest
export const runtime = "nodejs";

// GA cookies are absent for ad-blocked or consent-declined visitors; treat
// them as optional and never let a non-string or empty value reach Stripe
// metadata, which only accepts strings.
function parseOptionalMetadataString(value: unknown): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

function parseCustomer(value: unknown): CustomerInput | { error: string } {
  if (typeof value !== "object" || value === null) {
    return { error: "Customer information is required" };
  }
  const raw = value as Record<string, unknown>;
  const fields: Partial<CustomerInput> = {};
  for (const key of [
    "name",
    "email",
    "phone",
    "company",
    "address",
    "city",
    "state",
    "zip",
  ] as const) {
    const field = raw[key];
    if (field !== undefined && typeof field !== "string") {
      return { error: `Field "${key}" must be a string` };
    }
    fields[key] = (field as string | undefined)?.trim() ?? "";
  }
  const customer = fields as CustomerInput;
  if (!customer.name) {
    return { error: "Name is required" };
  }
  if (!isEmailAddress(customer.email)) {
    return { error: "Please enter a valid email address" };
  }
  return customer;
}

// The price is resolved server-side from the plan + billing cycle; neither
// an amount nor a Price ID is ever accepted from the client.
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

  const result = validateOrder({
    plan: body?.plan,
    employeeCount: body?.employeeCount,
    billingCycle: body?.billingCycle,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { order } = result;

  // A null body has no valid order, so `body` is a real object from here on.
  const customer = parseCustomer(body.customer);
  if ("error" in customer) {
    return NextResponse.json({ error: customer.error }, { status: 400 });
  }

  // An empty key is dropped where it is used: the Stripe calls below only
  // send a truthy key.
  const idempotencyKey =
    typeof body.idempotencyKey === "string" && body.idempotencyKey.length <= 200
      ? body.idempotencyKey
      : undefined;

  const gaClientId = parseOptionalMetadataString(body.ga_client_id);
  const gaSessionId = parseOptionalMetadataString(body.ga_session_id);
  // Only an explicit true is consent (never inferred); the webhook reads
  // wants_brief back off the paid invoice to subscribe them to the brief.
  const wantsBrief = body.wantsBrief === true;

  try {
    const priceId = await resolvePriceId({
      plan: order.planName,
      cycle: order.billingCycle,
    });
    const stripe = await getServerStripe();

    const orderMetadata = {
      plan: order.planName,
      billing_cycle: order.billingCycle,
      employee_count: order.employeeCount.toString(),
      company: customer.company,
      ...(gaClientId ? { ga_client_id: gaClientId } : {}),
      ...(gaSessionId ? { ga_session_id: gaSessionId } : {}),
      ...(wantsBrief ? { wants_brief: "true" } : {}),
    };

    // Both creates share the client's idempotency key (with distinct
    // suffixes) so a double-submit replays the same customer and
    // subscription instead of minting duplicates.
    const stripeCustomer = await stripe.customers.create(
      {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || undefined,
        address: {
          line1: customer.address,
          city: customer.city,
          state: customer.state,
          postal_code: customer.zip,
        },
        metadata: orderMetadata,
      },
      idempotencyKey ? { idempotencyKey: `${idempotencyKey}-customer` } : {},
    );

    // The invoice's confirmation_secret carries the client secret the card
    // form confirms (invoice.payment_intent was removed in Stripe's Basil
    // API release).
    const subscription = await stripe.subscriptions.create(
      {
        customer: stripeCustomer.id,
        items: [{ price: priceId, quantity: order.employeeCount }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.confirmation_secret"],
        metadata: orderMetadata,
      },
      idempotencyKey
        ? { idempotencyKey: `${idempotencyKey}-subscription` }
        : {},
    );

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const clientSecret = latestInvoice?.confirmation_secret?.client_secret;
    if (!clientSecret) {
      console.error(
        "Subscription created without a confirmable invoice:",
        subscription.id,
      );
      return NextResponse.json(
        { error: "Unable to initialize payment. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ clientSecret });
  } catch (error) {
    if (error instanceof MissingStripePriceError) {
      console.error("Stripe catalog misconfiguration:", error.message);
      return NextResponse.json(
        {
          error:
            "Checkout is temporarily unavailable. Please contact us at hi@boximity.ca or (289) 539-0098.",
        },
        { status: 503 },
      );
    }
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Unable to process the payment request" },
      { status: 500 },
    );
  }
}
