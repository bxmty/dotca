import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { getServerStripe } from "@/lib/stripe";
import { deliverLead, type LeadDelivery } from "@/lib/lead-delivery";
import { sendConversionEvent } from "@/lib/ga4";
import { subscribeToMonthlyBrief } from "@/lib/resend-optin";
import { markContactAsPaid } from "@/lib/paid-customer-flag";
import { splitFullName } from "@/lib/person-name";

// The Stripe SDK will not run on Edge
export const runtime = "nodejs";

const CENTS_PER_DOLLAR = 100;

/** Stripe amounts are integer cents; Syncro, GA4 and the email take dollars */
function convertCentsToDollars(amountInCents: number): number {
  return amountInCents / CENTS_PER_DOLLAR;
}

function formatAmount(amountInCents: number, currency: string): string {
  return `$${convertCentsToDollars(amountInCents).toFixed(2)} ${currency.toUpperCase()}`;
}

/**
 * Notify on the first paid invoice of a new subscription.
 *
 * The gate on billing_reason === "subscription_create" is what keeps this to
 * one email per customer instead of one per renewal — and it also means
 * `stripe trigger invoice.payment_succeeded` (billing_reason: "manual") is
 * correctly ignored; that's the gate working, not a broken webhook.
 */
async function handleNewPaidSubscription(
  invoice: Stripe.Invoice,
): Promise<LeadDelivery> {
  const metadata = invoice.parent?.subscription_details?.metadata ?? {};
  const email = invoice.customer_email ?? "";
  const name = invoice.customer_name ?? "";
  const phone = invoice.customer_phone ?? "";

  const plan = metadata.plan ?? "";
  const billingCycle = metadata.billing_cycle ?? "";
  const employeeCount = metadata.employee_count ?? "";
  const company = metadata.company ?? "";
  const gaClientId = metadata.ga_client_id;
  const gaSessionId = metadata.ga_session_id;
  // Set by create-subscription only when the checkout box was ticked
  const wantsBrief = metadata.wants_brief === "true";

  const amountPaidInDollars = convertCentsToDollars(invoice.amount_paid);
  // Every field, shared by the Syncro ticket description and the email
  const leadFields = {
    Name: name,
    Email: email,
    Phone: phone,
    Company: company,
    Plan: plan,
    "Billing cycle": billingCycle,
    "Employee count": employeeCount,
    "Amount paid": formatAmount(invoice.amount_paid, invoice.currency ?? "cad"),
    Invoice: invoice.id ?? "",
  };

  const delivery = await deliverLead({
    lead: {
      formType: "Paid signup",
      name,
      email,
      phone,
      company,
      fields: leadFields,
      opportunityAmountDollars: amountPaidInDollars,
      hasOptedInToBrief: wantsBrief,
    },
    // No customer details in the Sentry message: the invoice id finds them
    failureSummary: "Paid signup notification failure",
    failureContext: `invoice ${invoice.id}`,
    // sendConversionEvent never throws (it swallows and reports its own
    // failures), and is settled alongside the sinks, so a conversion-tracking
    // outage must never fail the webhook or trigger a Stripe retry. Invoice
    // id is the transaction_id: stable across a webhook redelivery for the
    // same invoice, so GA4 dedupes the event rather than double-counting
    // revenue.
    alongside: [
      sendConversionEvent({
        name: "purchase",
        clientId: gaClientId,
        sessionId: gaSessionId,
        params: {
          transaction_id: invoice.id ?? "",
          value: amountPaidInDollars,
          currency: (invoice.currency ?? "cad").toUpperCase(),
        },
      }),
    ],
  });

  // Outside the delivery matrix: a failed brief subscription is a Sentry
  // warning inside subscribeToMonthlyBrief and never changes the webhook's
  // status. A Stripe retry after a total failure re-runs it, harmlessly
  // (an existing contact is re-subscribed, not duplicated).
  if (wantsBrief && email) {
    await subscribeToMonthlyBrief({
      email,
      ...splitFullName(name),
      source: "checkout",
    });
  }

  return delivery;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  // Signature verification needs the raw body; a re-serialized body fails
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = await getServerStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Log billing_reason on every event: a gate correctly rejecting a manual
  // invoice is otherwise indistinguishable from a broken webhook
  const eventObject = event.data.object as { billing_reason?: string | null };
  const billingReason = eventObject.billing_reason ?? "n/a";
  console.log(
    `Stripe webhook received: ${event.type} (billing_reason: ${billingReason})`,
  );

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // Renewals and one-off invoices are not new signups
      const delivery =
        invoice.billing_reason === "subscription_create"
          ? await handleNewPaidSubscription(invoice)
          : null;

      // Every paid invoice flags the payer's Resend contact, if they have
      // one, so the nurture skips its upsell (#648). Runs after the new
      // signup's brief opt-in so a contact created at checkout is flagged
      // too. Best-effort and outside the delivery matrix: it never throws
      // and never changes the status returned below.
      if (invoice.customer_email) {
        await markContactAsPaid({ email: invoice.customer_email });
      }

      if (!delivery) {
        break;
      }
      // Total failure → non-2xx so Stripe retries. Neither sink landed, so a
      // retry can't duplicate the Syncro lead or the email. Any partial
      // success returns 2xx: Syncro leads aren't idempotent, and a retry
      // after one landed would create a second lead.
      if (!delivery.isDelivered) {
        return NextResponse.json(
          { error: "Notification delivery failed" },
          { status: 500 },
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // No customer details in this string: it goes to Sentry. The invoice
      // id is enough to find the payer in the Stripe dashboard.
      const detail = `Invoice payment failed: ${invoice.id} (billing_reason: ${billingReason})`;
      console.error(detail);
      Sentry.captureMessage(detail, "warning");
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const detail = `Subscription cancelled: ${subscription.id}`;
      console.warn(detail);
      Sentry.captureMessage(detail, "warning");
      break;
    }

    default:
      // Unhandled event types must still 200, or Stripe marks the
      // endpoint as failing and eventually disables it
      break;
  }

  return NextResponse.json({ received: true });
}
