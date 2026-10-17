import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getLeadMagnetBySlug } from "@/lib/lead-magnets";
import { signLeadMagnetToken } from "@/lib/lead-magnet-token";
import {
  sendLeadMagnetDeliveryEmail,
  sendWebmasterNotification,
} from "@/lib/notify";
import { isEmailAddress } from "@/lib/formValidation";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { createSyncroLead } from "@/lib/syncro-leads";
import { addResendMarketingContact } from "@/lib/resend-marketing";
import { SITE_URL } from "@/lib/schema";

/**
 * Email gate for a lead magnet: records the lead, then hands back a signed
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

    // The lead must exist somewhere before the asset is released. Until
    // #596-601 lands this is a stub that always throws, so every real
    // submission takes the 503 path below — the same one a Syncro outage
    // would take.
    try {
      await createSyncroLead({ email, source: `lead-magnet:${magnet.slug}` });
    } catch (error) {
      const detail = `Lead magnet capture failure (${magnet.slug}): ${
        (error as Error).message
      }`;
      console.error(detail);
      Sentry.captureMessage(detail, "error");
      return NextResponse.json(
        {
          error:
            "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
        },
        { status: 503 },
      );
    }

    // Also a stub until #596-601, and deliberately not wrapped: it should
    // fail loudly during development. bxmty/dotca#606 makes it best-effort
    // (Sentry.captureMessage on failure, never fail the response).
    if (wantsBrief === true) {
      await addResendMarketingContact({
        email,
        topic: "monthly-security-brief",
      });
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
        {
          error:
            "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
        },
        { status: 503 },
      );
    }
    const downloadUrl = `/api/lead-magnet/download?${new URLSearchParams({
      slug: magnet.slug,
      token,
    })}`;
    const { title } = magnet.frontmatter;

    // The lead already exists; both emails are notifications about it, so
    // neither can fail the response.
    await Promise.allSettled([
      sendWebmasterNotification({
        formType: "Lead magnet",
        submitterName: email,
        fields: {
          Email: email,
          Resource: title,
          "Monthly brief": wantsBrief === true ? "Yes" : "No",
        },
      }),
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
