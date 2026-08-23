import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { getServerStripe } from "@/lib/stripe";
import { addBrevoContact } from "@/lib/brevo";
import { sendWebmasterNotification } from "@/lib/notify";
import { sendConversionEvent } from "@/lib/ga4";

// The Stripe SDK will not run on Edge
export const runtime = "nodejs";

// Paid signups land in Brevo list 9 alongside the other leads
const PAID_SIGNUP_LIST_ID = 9;

function formatAmount(amountCents: number, currency: string): string {
  return `$${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
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
): Promise<{ brevoLanded: boolean; notifySent: boolean }> {
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

  // sendConversionEvent never throws (it swallows and reports its own
  // failures), so this settles like the other two even if the MP request
  // fails — a conversion-tracking outage must never fail the webhook or
  // trigger a Stripe retry. Invoice id is the transaction_id: stable across
  // a webhook redelivery for the same invoice, so GA4 dedupes the event
  // rather than double-counting revenue.
  const [brevoSettled, notifySettled] = await Promise.allSettled([
    email
      ? addBrevoContact({
          listId: PAID_SIGNUP_LIST_ID,
          email,
          attributes: {
            FULLNAME: name,
            PHONE: phone,
            COMPANY: company,
            PLAN_NAME: plan,
            BILLING_CYCLE: billingCycle,
            EMPLOYEE_COUNT: employeeCount,
          },
        })
      : Promise.resolve({ ok: false as const, code: "missing_email" }),
    sendWebmasterNotification({
      formType: "Paid signup",
      submitterName: name || email,
      fields: {
        Name: name,
        Email: email,
        Phone: phone,
        Company: company,
        Plan: plan,
        "Billing cycle": billingCycle,
        "Employee count": employeeCount,
        "Amount paid": formatAmount(
          invoice.amount_paid,
          invoice.currency ?? "cad",
        ),
        Invoice: invoice.id ?? "",
      },
    }),
    sendConversionEvent({
      name: "purchase",
      clientId: gaClientId,
      sessionId: gaSessionId,
      params: {
        transaction_id: invoice.id ?? "",
        value: invoice.amount_paid / 100,
        currency: (invoice.currency ?? "cad").toUpperCase(),
      },
    }),
  ]);

  const brevoLanded =
    brevoSettled.status === "fulfilled" &&
    (brevoSettled.value.ok ||
      brevoSettled.value.code === "duplicate_parameter");
  const notifySent =
    notifySettled.status === "fulfilled" && notifySettled.value;
  return { brevoLanded, notifySent };
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
      if (invoice.billing_reason !== "subscription_create") {
        break; // renewals and one-off invoices are not new signups
      }

      const { brevoLanded, notifySent } =
        await handleNewPaidSubscription(invoice);

      if (!brevoLanded || !notifySent) {
        const detail = `Brevo ${brevoLanded ? "ok" : "failed"}, webmaster email ${
          notifySent ? "ok" : "failed"
        } (invoice ${invoice.id})`;
        console.error(`Paid signup notification failure: ${detail}`);
        Sentry.captureMessage(
          `Paid signup notification failure: ${detail}`,
          "error",
        );
      }

      // Total failure → non-2xx so Stripe retries. Brevo is idempotent and
      // the email hasn't been sent, so a retry can only help.
      if (!brevoLanded && !notifySent) {
        return NextResponse.json(
          { error: "Notification delivery failed" },
          { status: 500 },
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const detail = `Invoice payment failed: ${invoice.id} (${invoice.customer_email ?? "unknown"}, billing_reason: ${billingReason})`;
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
