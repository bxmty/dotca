import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { formatE164Phone } from "@/lib/phone";
import { createLead, describeLeadOutcome, toLeadResult } from "@/lib/syncro";
import { logLeadSubmission } from "@/lib/lead-log";
import { sendWebmasterNotification } from "@/lib/notify";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { parseGa4CookieIds, sendConversionEvent } from "@/lib/ga4";
import { subscribeToMonthlyBrief } from "@/lib/resend-optin";
import { sendConfirmationEmail } from "@/lib/confirmation-email";
import { splitFullName } from "@/lib/person-name";

export async function POST(request: Request) {
  try {
    // Parse the JSON request body
    let data;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    // Honeypot: the "website" field is hidden from humans. A filled value
    // means a bot — return success and send nothing.
    if (typeof data?.website === "string" && data.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many submissions. Please try again later.",
        },
        { status: 429 },
      );
    }

    // Validate required fields
    const requiredFields = [
      "companyName",
      "industry",
      "employeeCount",
      "contactName",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "state",
      "zipCode",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contactEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Basic phone validation
    const phoneDigits = data.contactPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid phone number with at least 10 digits",
        },
        { status: 400 },
      );
    }

    // Same-origin fetch from the onboarding form carries the GA cookies
    // automatically — no client-side change needed to attribute this signup.
    const { clientId: gaClientId, sessionId: gaSessionId } = parseGa4CookieIds(
      request.headers.get("cookie"),
    );

    // Every submitted field, shared by the Syncro ticket description and the
    // webmaster email so the two sinks always carry the same lead
    const fields = {
      "Contact name": data.contactName,
      Email: data.contactEmail,
      Phone: data.contactPhone,
      Company: data.companyName,
      Industry: data.industry,
      "Employee count": String(data.employeeCount),
      Address: data.address,
      City: data.city,
      "Province/State": data.state,
      "Postal code": data.zipCode,
      "Current IT providers": data.currentITProviders || "",
      "Software used": data.softwareUsed || "",
      "Pain points": data.painPoints || "",
      Goals: data.goals || "",
      "Monthly brief": data.wantsBrief === true ? "Yes" : "No",
    };
    const phone = formatE164Phone(data.contactPhone) ?? data.contactPhone;

    // Validation is done; from here on the lead exists. Syncro (PSA lead)
    // and the webmaster email (Resend) fire in parallel, and the submission
    // succeeds if either lands — see the redundancy matrix in the PRD.
    const [syncroSettled, notifySettled] = await Promise.allSettled([
      createLead({
        formType: "Onboarding",
        name: data.contactName,
        email: data.contactEmail,
        phone,
        company: data.companyName,
        fields,
      }),
      sendWebmasterNotification({
        formType: "Onboarding",
        submitterName: data.contactName,
        fields,
      }),
      // sendConversionEvent never throws — it swallows and reports its own
      // failures — so a Measurement Protocol outage can't affect the
      // submission outcome below, exactly like the other two settled calls.
      // No value param: sign_up carries no monetary value, and a placeholder
      // would inflate Google Ads-imported conversion value.
      sendConversionEvent({
        name: "sign_up",
        clientId: gaClientId,
        sessionId: gaSessionId,
      }),
    ]);

    const syncroResult = toLeadResult(syncroSettled);
    const notifySent =
      notifySettled.status === "fulfilled" && notifySettled.value;

    logLeadSubmission({
      formType: "Onboarding",
      name: data.contactName,
      company: data.companyName,
      email: data.contactEmail,
      phone,
      syncro: syncroResult,
      isEmailSent: notifySent,
    });

    const contactName = splitFullName(String(data.contactName));

    // The day-0 confirmation (with the /install link) goes to every signup
    // whose lead landed, opted in or not, and sits outside the delivery
    // matrix: a failed send is a Sentry warning inside sendConfirmationEmail,
    // never a failed submission. A 503 sends none, since the lead may not
    // exist.
    if (syncroResult.ok || notifySent) {
      await sendConfirmationEmail({
        formType: "onboarding",
        email: data.contactEmail,
        firstName: contactName.firstName,
      });
    }

    // The brief opt-in sits outside the delivery matrix: only an explicit
    // true subscribes (never inferred), and a failed write is a Sentry
    // warning inside subscribeToMonthlyBrief, never a failed submission.
    if (data.wantsBrief === true) {
      await subscribeToMonthlyBrief({
        email: data.contactEmail,
        ...contactName,
        source: "onboarding",
      });
    }

    if (!syncroResult.ok || !notifySent) {
      // No submitted values in this string: it goes to Sentry
      const detail = `Syncro ${describeLeadOutcome(syncroResult)}, webmaster email ${
        notifySent ? "ok" : "failed"
      }`;
      console.error(`Onboarding delivery failure: ${detail}`);
      Sentry.captureMessage(`Onboarding delivery failure: ${detail}`, "error");
    }

    if (syncroResult.ok || notifySent) {
      return NextResponse.json({
        success: true,
        message: "Onboarding data received successfully",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      },
      { status: 503 },
    );
  } catch (error) {
    // Error processing data
    console.error("Onboarding form submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process onboarding data" },
      { status: 500 },
    );
  }
}
