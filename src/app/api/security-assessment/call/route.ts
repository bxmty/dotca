import { NextResponse, type NextRequest } from "next/server";
import { deliverLead } from "@/lib/lead-delivery";
import { isEmailAddress } from "@/lib/formValidation";
import { isRecord } from "@/lib/isRecord";
import { SDR_SESSION_COOKIE } from "@/lib/sdr-console-route";
import { checkSdrSession } from "@/lib/sdr-session";
import {
  DISCOVERY_GROUPS,
  getDiscoveryQuestions,
  getQuestionsWithFieldLabels,
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

function readRequiredText(value: unknown, label: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") fail(`${label} is required`);
  return text;
}

/** Trimmed free text, "" when blank or absent. */
function readCappedText(
  value: unknown,
  {
    maxLength,
    notTextMessage,
    tooLongMessage,
  }: { maxLength: number; notTextMessage: string; tooLongMessage: string },
): string {
  if (value === undefined) return "";
  if (typeof value !== "string") fail(notTextMessage);
  const text = value.trim();
  if (text.length > maxLength) fail(tooLongMessage);
  return text;
}

const readNote = (value: unknown) =>
  readCappedText(value, {
    maxLength: SDR_NOTE_MAX_LENGTH,
    notTextMessage: "Notes must be text",
    tooLongMessage: NOTE_TOO_LONG,
  });

const readCallSummary = (value: unknown) =>
  readCappedText(value, {
    maxLength: SDR_CALL_SUMMARY_MAX_LENGTH,
    notTextMessage: "The call summary must be text",
    tooLongMessage: SUMMARY_TOO_LONG,
  });

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
  notes,
  labelledQuestions,
}: {
  answers: Record<string, number>;
  notes: Record<string, unknown>;
  labelledQuestions: ReturnType<typeof getQuestionsWithFieldLabels>;
}): Record<string, string> {
  const questionIds = new Set(
    labelledQuestions.map(({ question }) => question.id),
  );
  for (const id of Object.keys(notes)) {
    if (!questionIds.has(id)) fail("Unknown question in notes");
  }

  const fields: Record<string, string> = {};
  for (const { question, fieldLabel } of labelledQuestions) {
    fields[fieldLabel] = question.answers[answers[question.id]].text;
    const note = readNote(notes[question.id]);
    if (note !== "") fields[`${fieldLabel} note`] = note;
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

  const inCallOrder = DISCOVERY_GROUPS.flatMap((group) =>
    getDiscoveryQuestions({ discovery: questions }, group),
  );
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
      notes: readOptionalRecord(submission.notes, "Notes"),
      labelledQuestions: getQuestionsWithFieldLabels(config, segment),
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
