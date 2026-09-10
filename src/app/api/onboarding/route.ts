import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { addBrevoContact, formatE164Phone } from "@/lib/brevo";
import { sendWebmasterNotification } from "@/lib/notify";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { parseGa4CookieIds, sendConversionEvent } from "@/lib/ga4";

// Onboarding leads land in Brevo list 10 (vacated by the old waitlist)
const ONBOARDING_LIST_ID = 10;

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

    // Validation is done; from here on the lead exists. Brevo (CRM) and the
    // webmaster email (Resend) fire in parallel, and the submission succeeds
    // if either lands — see the redundancy matrix in the PRD.
    const smsPhone = formatE164Phone(data.contactPhone) ?? undefined;
    const [brevoSettled, notifySettled] = await Promise.allSettled([
      addBrevoContact({
        listId: ONBOARDING_LIST_ID,
        email: data.contactEmail,
        smsPhone,
        attributes: {
          FULLNAME: data.contactName,
          COMPANY: data.companyName,
          INDUSTRY: data.industry,
          EMPLOYEE_COUNT: String(data.employeeCount),
          PHONE: data.contactPhone,
          ADDRESS: data.address,
          CITY: data.city,
          STATE: data.state,
          ZIP: data.zipCode,
          CURRENT_IT_PROVIDERS: data.currentITProviders || "",
          SOFTWARE_USED: data.softwareUsed || "",
          PAIN_POINTS: data.painPoints || "",
          GOALS: data.goals || "",
        },
      }),
      sendWebmasterNotification({
        formType: "Onboarding",
        submitterName: data.contactName,
        fields: {
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
        },
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

    const brevoResult =
      brevoSettled.status === "fulfilled"
        ? brevoSettled.value
        : { ok: false as const, code: "exception" };
    const notifySent =
      notifySettled.status === "fulfilled" && notifySettled.value;

    // An existing contact still counts as a landed submission
    const brevoLanded =
      brevoResult.ok || brevoResult.code === "duplicate_parameter";

    if (!brevoLanded || !notifySent) {
      const detail = `Brevo ${
        brevoLanded
          ? "ok"
          : `failed (${brevoResult.code ?? brevoResult.status})`
      }, webmaster email ${notifySent ? "ok" : "failed"}`;
      console.error(`Onboarding delivery failure: ${detail}`);
      Sentry.captureMessage(`Onboarding delivery failure: ${detail}`, "error");
    }

    if (brevoLanded || notifySent) {
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
