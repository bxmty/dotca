/**
 * @jest-environment node
 */
import { POST } from "@/app/api/security-assessment/route";
import * as Sentry from "@sentry/nextjs";
import { createLead } from "@/lib/syncro";
import { sendWebmasterNotification } from "@/lib/notify";
import { resetRateLimits } from "@/lib/rate-limit";
import { sendConversionEvent } from "@/lib/ga4";
import {
  getQuestionsForSegment,
  loadQuizConfig,
  type QuizSegment,
} from "@/lib/security-assessment";
import { SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/service-unavailable";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

jest.mock("@/lib/syncro", () => ({
  ...jest.requireActual("@/lib/syncro"),
  createLead: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
}));
jest.mock("@/lib/ga4", () => ({
  ...jest.requireActual("@/lib/ga4"),
  sendConversionEvent: jest.fn(),
}));

const mockCreateResendContact = jest.fn();
const mockSendResendEvent = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: {
      create: mockCreateResendContact,
      get: jest.fn().mockResolvedValue({
        data: null,
        error: { name: "not_found", message: "", statusCode: 404 },
      }),
      segments: { add: jest.fn() },
      topics: { update: jest.fn() },
    },
    events: { send: mockSendResendEvent },
  })),
}));

const mockCreateLead = createLead as jest.Mock;
const mockNotify = sendWebmasterNotification as jest.Mock;
const mockSendConversionEvent = sendConversionEvent as jest.Mock;
const mockCaptureMessage = Sentry.captureMessage as jest.Mock;

const config = loadQuizConfig();
const originalEnv = process.env;

function buildAnswers(
  segment: QuizSegment,
  pickIndex: (answerCount: number) => number,
): Record<string, number> {
  return Object.fromEntries(
    getQuestionsForSegment(config, segment).map((question) => [
      question.id,
      pickIndex(question.answers.length),
    ]),
  );
}

function buildSubmission(overrides: Record<string, unknown> = {}) {
  return {
    name: "Dana Tester",
    email: "test@example.com",
    company: "Tester Accounting",
    website: "",
    segment: "solo",
    answers: buildAnswers("solo", () => 0),
    wantsBrief: false,
    ...overrides,
  };
}

function buildRequest(
  body: unknown,
  headers?: Record<string, string>,
): Request {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers({ "x-forwarded-for": "203.0.113.9", ...headers }),
  } as unknown as Request;
}

async function expectJson(response: Response, status: number, body: unknown) {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual(body);
}

describe("POST /api/security-assessment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimits();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      RESEND_MONTHLY_BRIEF_SEGMENT_ID: "seg_brief",
      RESEND_MONTHLY_BRIEF_TOPIC_ID: "topic_brief",
      RESEND_OPTIN_EVENT: "lead.opted_in.test",
    };
    mockCreateLead.mockResolvedValue({ ok: true, leadId: 1 });
    mockNotify.mockResolvedValue(true);
    mockSendConversionEvent.mockResolvedValue(undefined);
    mockCreateResendContact.mockResolvedValue({
      data: { id: "contact_1" },
      error: null,
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("delivers the lead with quiz attributes and emails the webmaster", async () => {
    const response = await POST(buildRequest(buildSubmission()));

    await expectJson(response, 200, { success: true });
    expect(mockCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        formType: "Security assessment",
        name: "Dana Tester",
        email: "test@example.com",
        company: "Tester Accounting",
        fields: expect.objectContaining({
          "Business size": "Solopreneur",
          "Risk tier": "Resilient",
        }),
      }),
    );
    expect(mockNotify).toHaveBeenCalledWith({
      formType: "Security assessment",
      submitterName: "Dana Tester",
      fields: expect.objectContaining({
        Name: "Dana Tester",
        Email: "test@example.com",
        Company: "Tester Accounting",
        "Business size": "Solopreneur",
        "Risk tier": "Resilient",
        Score: expect.stringMatching(/^\d+\/\d+$/),
        "High intent": "",
        "Monthly brief": "No",
      }),
    });
    expect(mockSendConversionEvent).toHaveBeenCalledWith({
      name: "generate_lead",
      clientId: undefined,
      sessionId: undefined,
    });
  });

  it("flags growing businesses with weak posture as high intent", async () => {
    await POST(
      buildRequest(
        buildSubmission({
          segment: "growing",
          answers: buildAnswers("growing", (count) => count - 1),
        }),
      ),
    );

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          "High intent": "Yes",
          "Risk tier": "Exposed",
          "Business size": "Growing business",
        }),
      }),
    );
  });

  it("does not flag a resilient solopreneur as high intent", async () => {
    await POST(buildRequest(buildSubmission()));

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({ "High intent": "" }),
      }),
    );
  });

  it("returns 400 for an unknown segment", async () => {
    const response = await POST(
      buildRequest(buildSubmission({ segment: "enterprise" })),
    );

    await expectJson(response, 400, {
      error: "Unknown business size segment",
    });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it.each([
    ["name", "Name is required"],
    ["company", "Company is required"],
  ])("returns 400 when %s is blank", async (field, error) => {
    const response = await POST(
      buildRequest(buildSubmission({ [field]: "   " })),
    );

    await expectJson(response, 400, { error });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 400 when name is not a string", async () => {
    const response = await POST(
      buildRequest(buildSubmission({ name: { first: "Dana" } })),
    );

    await expectJson(response, 400, { error: "Name is required" });
  });

  it("returns 400 for an invalid email", async () => {
    const response = await POST(
      buildRequest(buildSubmission({ email: "not-an-email" })),
    );

    await expectJson(response, 400, {
      error: "Please enter a valid email address",
    });
  });

  it("returns 400 when answers are incomplete", async () => {
    const response = await POST(buildRequest(buildSubmission({ answers: {} })));

    await expectJson(response, 400, {
      error: "Please answer every question",
    });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 400 when an answer index is out of range", async () => {
    const answers = buildAnswers("solo", () => 0);
    const [firstQuestion] = getQuestionsForSegment(config, "solo");
    answers[firstQuestion.id] = 99;

    const response = await POST(buildRequest(buildSubmission({ answers })));

    await expectJson(response, 400, {
      error: "Please answer every question",
    });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const request = {
      json: jest.fn().mockRejectedValueOnce(new Error("JSON parsing error")),
      headers: new Headers(),
    } as unknown as Request;

    const response = await POST(request);

    await expectJson(response, 400, {
      error: "Request body must be valid JSON",
    });
  });

  it("returns success to honeypot submissions without sending anything", async () => {
    const response = await POST(
      buildRequest(buildSubmission({ website: "https://spam.example" })),
    );

    await expectJson(response, 200, { success: true });
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("succeeds when Syncro fails but the webmaster email lands", async () => {
    mockCreateLead.mockResolvedValueOnce({
      ok: false,
      reason: "unreachable",
      code: "network_error",
    });

    const response = await POST(buildRequest(buildSubmission()));

    await expectJson(response, 200, { success: true });
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("Security assessment delivery failure"),
      "error",
    );
  });

  it("returns 503 with direct contact info when both channels fail", async () => {
    mockCreateLead.mockResolvedValueOnce({
      ok: false,
      reason: "rejected",
      status: 422,
    });
    mockNotify.mockResolvedValueOnce(false);

    const response = await POST(buildRequest(buildSubmission()));

    await expectJson(response, 503, { error: SERVICE_UNAVAILABLE_MESSAGE });
  });

  it("rate limits the sixth submission from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(buildRequest(buildSubmission()));
    }

    const response = await POST(buildRequest(buildSubmission()));

    await expectJson(response, 429, {
      error: "Too many submissions. Please try again later.",
    });
    expect(mockCreateLead).toHaveBeenCalledTimes(5);
  });

  it("still succeeds when the brief opt-in fails", async () => {
    mockCreateResendContact.mockRejectedValueOnce(new Error("Resend down"));

    const response = await POST(
      buildRequest(buildSubmission({ wantsBrief: true })),
    );

    await expectJson(response, 200, { success: true });
    expect(mockCreateResendContact).toHaveBeenCalled();
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining(
        "Monthly brief opt-in failed (security-assessment)",
      ),
      "warning",
    );
  });
});
