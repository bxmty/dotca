import { NextResponse, type NextRequest } from "next/server";
import { deliverLead } from "@/lib/lead-delivery";
import { isEmailAddress } from "@/lib/formValidation";
import { SDR_SESSION_COOKIE } from "@/lib/sdr-console-route";
import { checkSdrSession } from "@/lib/sdr-session";
import {
  getQuestionFieldLabels,
  getQuestionsForSegment,
  isQuizSegment,
  loadQuizConfig,
  loadSdrContent,
  scoreQuizAnswers,
  SDR_CALL_SUMMARY_MAX_LENGTH,
  SDR_NOTE_MAX_LENGTH,
  type DiscoveryQuestion,
  type SdrCallLeadResponse,
} from "@/lib/security-assessment";
import { SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/service-unavailable";

const NOT_ASKED = "Not asked";
const NOTE_TOO_LONG = `Notes must be ${SDR_NOTE_MAX_LENGTH.toLocaleString("en-CA")} characters or fewer`;
const SUMMARY_TOO_LONG = `The call summary must be ${SDR_CALL_SUMMARY_MAX_LENGTH.toLocaleString("en-CA")} characters or fewer`;

class InvalidSubmissionError extends Error {}

function fail(message: string): never {
  throw new InvalidSubmissionError(message);
}

function respond(body: SdrCallLeadResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredText(value: unknown, label: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") fail(`${label} is required`);
  return text;
}

/** The trimmed note, "" when blank or absent. */
function readNote(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value !== "string") fail("Notes must be text");
  const note = value.trim();
  if (note.length > SDR_NOTE_MAX_LENGTH) fail(NOTE_TOO_LONG);
  return note;
}

function readCallSummary(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value !== "string") fail("The call summary must be text");
  const summary = value.trim();
  if (summary.length > SDR_CALL_SUMMARY_MAX_LENGTH) fail(SUMMARY_TOO_LONG);
  return summary;
}

function readOptionalRecord(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === undefined) return {};
  if (!isRecord(value)) fail(`${label} must be an object`);
  return value;
}

function buildPostureFields({
  answers,
  labels,
  notes,
  questions,
}: {
  answers: Record<string, number>;
  labels: Map<string, string>;
  notes: Record<string, unknown>;
  questions: ReturnType<typeof getQuestionsForSegment>;
}): Record<string, string> {
  const questionIds = new Set(questions.map((question) => question.id));
  for (const id of Object.keys(notes)) {
    if (!questionIds.has(id)) fail("Unknown question in notes");
  }

  const fields: Record<string, string> = {};
  for (const question of questions) {
    const label = labels.get(question.id) as string;
    fields[label] = question.answers[answers[question.id]].text;
    const note = readNote(notes[question.id]);
    if (note !== "") fields[`${label} note`] = note;
  }
  return fields;
}

/** One discovery question's ticket lines; a note alone stands as the answer. */
function buildDiscoveryAnswerFields(
  question: DiscoveryQuestion,
  answer: unknown,
): Record<string, string> {
  if (answer === undefined) return { [question.text]: NOT_ASKED };
  if (!isRecord(answer)) fail("Discovery answers must be objects");

  const { choice, isNotAsked } = answer;
  const note = readNote(answer.note);
  if (isNotAsked === true) {
    if (choice !== undefined || note !== "") {
      fail("A question marked not asked can't have an answer");
    }
    return { [question.text]: NOT_ASKED };
  }

  if (choice === undefined) {
    return { [question.text]: note === "" ? NOT_ASKED : note };
  }
  if (
    question.kind !== "choice" ||
    typeof choice !== "string" ||
    !question.choices.includes(choice)
  ) {
    fail("Unknown discovery choice");
  }
  return {
    [question.text]: choice,
    ...(note === "" ? {} : { [`${question.text} note`]: note }),
  };
}

function buildDiscoveryFields(
  questions: DiscoveryQuestion[],
  answers: Record<string, unknown>,
): Record<string, string> {
  const knownIds = new Set(questions.map((question) => question.id));
  for (const id of Object.keys(answers)) {
    if (!knownIds.has(id)) fail("Unknown discovery question");
  }

  const inCallOrder = [
    ...questions.filter((question) => question.group === "opening"),
    ...questions.filter((question) => question.group === "closing"),
  ];
  return Object.assign(
    {},
    ...inCallOrder.map((question) =>
      buildDiscoveryAnswerFields(question, answers[question.id]),
    ),
  );
}

/**
 * Discovery-call lead delivery (#710): an SDR's saved call, authenticated
 * only by the httpOnly session cookie, so nothing in the body, a header or
 * the URL can authenticate. The cookie is checked first and this route never
 * touches the per-IP rate limit: a team behind one office IP is not blocked
 * mid-call, and rejected requests don't use up the public route's allowance.
 * No GA4 event, brief opt-in or prospect email (#710 decisions 8, 11, 23).
 */
export async function POST(request: NextRequest) {
  const session = checkSdrSession(
    request.cookies.get(SDR_SESSION_COOKIE)?.value,
  );
  if (!session.isValid) {
    if (session.reason !== "secret-unset") {
      return respond({ error: "Unauthorized" }, 401);
    }
    console.error(
      "/api/security-assessment/call requested but SDR_LINK_SIGNING_SECRET is unset or too short, so SDR tokens cannot be checked",
    );
    return respond({ error: SERVICE_UNAVAILABLE_MESSAGE }, 503);
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return respond({ error: "Request body must be valid JSON" }, 400);
    }
    const submission = isRecord(body) ? body : {};

    if (!isQuizSegment(submission.segment)) {
      fail("Unknown business size segment");
    }
    const segment = submission.segment;
    const name = readRequiredText(submission.name, "Name");
    const email = readRequiredText(submission.email, "Email");
    if (!isEmailAddress(email)) fail("Please enter a valid email address");
    const company = readRequiredText(submission.company, "Company");

    const config = loadQuizConfig();
    const answers = (
      isRecord(submission.answers) ? submission.answers : {}
    ) as Record<string, number>;
    let result;
    try {
      result = scoreQuizAnswers({ config, segment, answers });
    } catch {
      fail("Please answer every question");
    }

    const postureFields = buildPostureFields({
      answers,
      labels: getQuestionFieldLabels(config, segment),
      notes: readOptionalRecord(submission.notes, "Notes"),
      questions: getQuestionsForSegment(config, segment),
    });
    const discoveryFields = buildDiscoveryFields(
      loadSdrContent().discovery,
      readOptionalRecord(submission.discovery, "Discovery answers"),
    );
    const callSummary = readCallSummary(submission.callSummary);

    const { isDelivered } = await deliverLead({
      lead: {
        formType: "Discovery call assessment",
        name,
        email,
        company,
        isBriefOffered: false,
        fields: {
          SDR: session.sdrName,
          Channel: "Discovery call",
          Name: name,
          Email: email,
          Company: company,
          "Business size": config.segments[segment].label,
          "Risk tier": config.tiers[result.tier].label,
          Score: `${result.score}/${result.maxScore}`,
          "Weak areas": result.riskCategories
            .map((categoryKey) => config.categories[categoryKey].label)
            .join(", "),
          ...postureFields,
          ...discoveryFields,
          ...(callSummary === "" ? {} : { "Call summary": callSummary }),
        },
      },
      failureSummary: "Discovery call delivery failure",
    });

    if (!isDelivered) {
      return respond({ error: SERVICE_UNAVAILABLE_MESSAGE }, 503);
    }
    return respond({ success: true });
  } catch (error) {
    if (error instanceof InvalidSubmissionError) {
      return respond({ error: error.message }, 400);
    }
    console.error("Discovery call submission error:", error);
    return respond({ error: "Failed to process your request" }, 500);
  }
}
