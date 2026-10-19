import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { formatE164Phone } from "@/lib/phone";
import { createLead, describeLeadOutcome, toLeadResult } from "@/lib/syncro";
import { logLeadSubmission } from "@/lib/lead-log";
import { sendWebmasterNotification } from "@/lib/notify";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { parseGa4CookieIds, sendConversionEvent } from "@/lib/ga4";

function isMissingOrString(value: unknown): value is string | undefined {
  return value === undefined || value === null || typeof value === "string";
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      city,
      state,
      zip,
      plan,
      billingCycle,
      employeeCount,
      website,
    } = body ?? {};

    // Honeypot: the "website" field is hidden from humans. A filled value
    // means a bot — return success and send nothing.
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    // Reject non-string values up front so they surface as 400s, not 500s
    const stringFields = {
      name,
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      city,
      state,
      zip,
      plan,
      billingCycle,
    };
    for (const [field, value] of Object.entries(stringFields)) {
      if (!isMissingOrString(value)) {
        return NextResponse.json(
          { error: `Field "${field}" must be a string` },
          { status: 400 },
        );
      }
    }

    // Determine full name based on input
    const fullName =
      name ||
      (firstName && lastName ? `${firstName} ${lastName}` : firstName || "");

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const formattedPhone = formatE164Phone(phone);
    if (!formattedPhone) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 },
      );
    }

    // Same-origin fetch from the contact form carries the GA cookies
    // automatically — no client-side change needed to attribute this lead.
    const { clientId: gaClientId, sessionId: gaSessionId } = parseGa4CookieIds(
      request.headers.get("cookie"),
    );

    // Every submitted field, shared by the Syncro ticket description and the
    // webmaster email so the two sinks always carry the same lead
    const fields = {
      Name: fullName,
      Email: email,
      Phone: formattedPhone,
      Company: company || "",
      Address: address || "",
      City: city || "",
      "Province/State": state || "",
      "Postal code": zip || "",
      Plan: plan || "",
      "Billing cycle": billingCycle || "",
      "Employee count": employeeCount ? employeeCount.toString() : "",
    };

    // Validation is done; from here on the lead exists. Syncro (PSA lead)
    // and the webmaster email (Resend) fire in parallel, and the submission
    // succeeds if either lands — see the redundancy matrix in the PRD.
    const [syncroSettled, notifySettled] = await Promise.allSettled([
      createLead({
        formType: "Contact",
        name: fullName,
        email,
        phone: formattedPhone,
        company: company || "",
        fields,
      }),
      sendWebmasterNotification({
        formType: "Contact",
        submitterName: fullName,
        fields,
      }),
      // sendConversionEvent never throws — it swallows and reports its own
      // failures — so a Measurement Protocol outage can't affect the
      // submission outcome below, exactly like the other two settled calls.
      sendConversionEvent({
        name: "generate_lead",
        clientId: gaClientId,
        sessionId: gaSessionId,
      }),
    ]);

    const syncroResult = toLeadResult(syncroSettled);
    const notifySent =
      notifySettled.status === "fulfilled" && notifySettled.value;

    logLeadSubmission({
      formType: "Contact",
      name: fullName,
      company: company || "",
      email,
      phone: formattedPhone,
      syncro: syncroResult,
      isEmailSent: notifySent,
    });

    // Syncro has no validation rejection we can map to a 400 (a 4xx there is
    // our payload, not the visitor's), so validation stays route-side above.
    if (!syncroResult.ok || !notifySent) {
      // No submitted values in this string: it goes to Sentry
      const detail = `Syncro ${describeLeadOutcome(syncroResult)}, webmaster email ${
        notifySent ? "ok" : "failed"
      }`;
      console.error(`Contact form delivery failure: ${detail}`);
      Sentry.captureMessage(
        `Contact form delivery failure: ${detail}`,
        "error",
      );
    }

    if (syncroResult.ok || notifySent) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      {
        error:
          "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      },
      { status: 503 },
    );
  } catch (error) {
    // Error occurred during form submission
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 },
    );
  }
}
