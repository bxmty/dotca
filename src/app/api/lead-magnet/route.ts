import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getLeadMagnetBySlug } from "@/lib/lead-magnets";
import { signLeadMagnetToken } from "@/lib/lead-magnet-token";
import { sendLeadMagnetDeliveryEmail } from "@/lib/notify";
import { isEmailAddress } from "@/lib/formValidation";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { deliverLead } from "@/lib/lead-delivery";
import { subscribeToMonthlyBrief } from "@/lib/resend-optin";
import { SITE_URL } from "@/lib/schema";
import { SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/service-unavailable";

/**
 * Email gate for a lead magnet: delivers the lead, then hands back a signed
 * download link. Deliberately the same shape as /api/contact (JSON parse,
 * honeypot, rate limit, email regex, 503 copy) with a lighter payload.
 */
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

    const { slug, email: rawEmail, website, wantsBrief } = body ?? {};

    // Honeypot: the "website" field is hidden from humans. A filled value
    // means a bot — return success and record nothing.
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    // No download for an asset that doesn't exist or isn't live yet.
    const magnet = getLeadMagnetBySlug(typeof slug === "string" ? slug : "");
    if (!magnet) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // Normalised once here; everything below uses the trimmed address.
    const email = typeof rawEmail === "string" ? rawEmail.trim() : rawEmail;
    if (email === undefined || email === null || email === "") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (typeof email !== "string" || !isEmailAddress(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const { title } = magnet.frontmatter;
    const hasOptedInToBrief = wantsBrief === true;
    // Validation is done; from here on the lead exists. Syncro and the
    // webmaster email fire in parallel and the download is released if either
    // lands, like the other lead routes (#596 decision 4); only a total
    // failure answers 503 and releases nothing. The Source line is what tells
    // a lead-magnet Lead apart in Syncro. There is no name field on the gate,
    // so the address stands in for it.
    const { isDelivered } = await deliverLead({
      lead: {
        formType: "Lead magnet",
        email,
        fields: {
          Email: email,
          Resource: title,
          Source: `lead-magnet:${magnet.slug}`,
        },
        hasOptedInToBrief,
      },
      failureSummary: `Lead magnet delivery failure (${magnet.slug})`,
    });
    if (!isDelivered) {
      return NextResponse.json(
        { error: SERVICE_UNAVAILABLE_MESSAGE },
        { status: 503 },
      );
    }

    // The brief opt-in sits outside the delivery matrix: only an explicit
    // true subscribes (never inferred), and a failed write is a PII-free
    // Sentry warning inside subscribeToMonthlyBrief, never a failed response.
    if (hasOptedInToBrief) {
      await subscribeToMonthlyBrief({ email, source: "lead-magnet" });
    }

    // Relative for the on-page link, so it works on every environment;
    // absolute for the email, from the fixed site origin rather than the
    // request's Host header, so a forged Host can't put another domain's
    // link into an email sent from ours.
    // Throws only when LEAD_MAGNET_SIGNING_SECRET is unset or too short: a
    // deploy misconfiguration, so answer like any other outage. The lead is
    // already recorded, and the message carries no PII.
    let token: string;
    try {
      token = signLeadMagnetToken({ slug: magnet.slug, email });
    } catch (error) {
      const detail = `Lead magnet download link unavailable (${magnet.slug}): ${
        (error as Error).message
      }`;
      console.error(detail);
      Sentry.captureMessage(detail, "error");
      return NextResponse.json(
        { error: SERVICE_UNAVAILABLE_MESSAGE },
        { status: 503 },
      );
    }
    const downloadUrl = `/api/lead-magnet/download?${new URLSearchParams({
      slug: magnet.slug,
      token,
    })}`;

    // The durable copy of the link. The lead already exists, so this can't
    // fail the response: settled, in case the never-throws contract breaks.
    await Promise.allSettled([
      sendLeadMagnetDeliveryEmail({
        to: email,
        downloadUrl: `${SITE_URL}${downloadUrl}`,
        title,
      }),
    ]);

    return NextResponse.json({ success: true, downloadUrl });
  } catch (error) {
    console.error("Lead magnet submission error:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 },
    );
  }
}
