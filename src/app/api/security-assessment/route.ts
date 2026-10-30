import { NextResponse } from "next/server";
import { deliverLead } from "@/lib/lead-delivery";
import { isEmailAddress } from "@/lib/formValidation";
import { parseGa4CookieIds, sendConversionEvent } from "@/lib/ga4";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { subscribeToMonthlyBrief } from "@/lib/resend-optin";
import {
  getQuestionFieldLabels,
  getQuestionsForSegment,
  isQuizSegment,
  loadQuizConfig,
  scoreQuizAnswers,
  type QuizSegment,
} from "@/lib/security-assessment";
import { SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/service-unavailable";

/**
 * Lead delivery for the security assessment: the name, email and company
 * captured before the questions, plus the answers, re-scored server-side and
 * delivered through the shared path. The client posts once, when results
 * first render; the results are already on screen by then.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    // Honeypot: the "website" field is hidden from humans. A filled value
    // means a bot — return success and record nothing.
    if (typeof data?.website === "string" && data.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    if (!isQuizSegment(data?.segment)) {
      return NextResponse.json(
        { error: "Unknown business size segment" },
        { status: 400 },
      );
    }
    const segment: QuizSegment = data.segment;

    const name = typeof data?.name === "string" ? data.name.trim() : "";
    if (name === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const rawEmail = data?.email;
    const email =
      typeof rawEmail === "string" ? rawEmail.trim() : String(rawEmail ?? "");
    if (email === "") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!isEmailAddress(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const company =
      typeof data?.company === "string" ? data.company.trim() : "";
    if (company === "") {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 },
      );
    }

    const config = loadQuizConfig();
    const answers =
      typeof data?.answers === "object" && data.answers !== null
        ? (data.answers as Record<string, number>)
        : {};

    let result;
    try {
      result = scoreQuizAnswers({ config, segment, answers });
    } catch {
      return NextResponse.json(
        { error: "Please answer every question" },
        { status: 400 },
      );
    }

    const fieldLabels = getQuestionFieldLabels(config, segment);
    const questionFields: Record<string, string> = {};
    for (const question of getQuestionsForSegment(config, segment)) {
      const answerIndex = answers[question.id];
      const answer =
        typeof answerIndex === "number"
          ? question.answers[answerIndex]
          : undefined;
      questionFields[fieldLabels.get(question.id) ?? ""] = answer?.text ?? "";
    }

    const weakAreaLabels = result.riskCategories.map(
      (categoryKey) => config.categories[categoryKey].label,
    );

    const isHighIntent =
      segment === "growing" &&
      (result.tier === "exposed" || result.tier === "reactive");

    const hasOptedInToBrief = data?.wantsBrief === true;

    const { clientId: gaClientId, sessionId: gaSessionId } = parseGa4CookieIds(
      request.headers.get("cookie"),
    );

    const { isDelivered } = await deliverLead({
      lead: {
        formType: "Security assessment",
        name,
        email,
        company,
        fields: {
          Name: name,
          Email: email,
          Company: company,
          "Business size": config.segments[segment].label,
          "Risk tier": config.tiers[result.tier].label,
          Score: `${result.score}/${result.maxScore}`,
          "High intent": isHighIntent ? "Yes" : "",
          "Weak areas": weakAreaLabels.join(", "),
          ...questionFields,
        },
        hasOptedInToBrief,
      },
      failureSummary: "Security assessment delivery failure",
      alongside: [
        sendConversionEvent({
          name: "generate_lead",
          clientId: gaClientId,
          sessionId: gaSessionId,
        }),
      ],
    });

    if (!isDelivered) {
      return NextResponse.json(
        { error: SERVICE_UNAVAILABLE_MESSAGE },
        { status: 503 },
      );
    }

    if (hasOptedInToBrief) {
      await subscribeToMonthlyBrief({ email, source: "security-assessment" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Security assessment submission error:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 },
    );
  }
}
