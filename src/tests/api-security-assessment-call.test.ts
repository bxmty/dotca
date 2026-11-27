/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/security-assessment/call/route";
import { POST as postPublicAssessment } from "@/app/api/security-assessment/route";
import { createLead } from "@/lib/syncro";
import { sendWebmasterNotification } from "@/lib/notify";
import { sendConversionEvent } from "@/lib/ga4";
import { isRateLimited, resetRateLimits } from "@/lib/rate-limit";
import { SDR_SESSION_COOKIE } from "@/lib/sdr-console-route";
import { signSdrToken } from "@/lib/sdr-link";
import { signSubjectLinkToken } from "@/lib/signed-link-token";
import {
  getQuestionsWithFieldLabels,
  getQuestionsForSegment,
  loadQuizConfig,
  loadSdrContent,
  type DiscoveryChoiceQuestion,
  type DiscoveryTextQuestion,
} from "@/lib/security-assessment";
import { SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/service-unavailable";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));
jest.mock("@/lib/syncro", () => ({
  ...jest.requireActual("@/lib/syncro"),
  createLead: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({ sendWebmasterNotification: jest.fn() }));
jest.mock("@/lib/ga4", () => ({
  ...jest.requireActual("@/lib/ga4"),
  sendConversionEvent: jest.fn(),
}));
jest.mock("@/lib/rate-limit", () => {
  const actual = jest.requireActual("@/lib/rate-limit");
  return { ...actual, isRateLimited: jest.fn(actual.isRateLimited) };
});
const mockCreateResendContact = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: { create: mockCreateResendContact },
  })),
}));

const mockCreateLead = createLead as jest.Mock;
const mockNotify = sendWebmasterNotification as jest.Mock;

const config = loadQuizConfig();
const sdr = loadSdrContent();
const originalEnv = process.env;
const soloQuestions = getQuestionsForSegment(config, "solo");
const soloLabelledQuestions = getQuestionsWithFieldLabels(config, "solo");
const firstQuestion = soloQuestions[0];
const firstLabel = soloLabelledQuestions[0].fieldLabel;
const choiceQuestion = sdr.discovery.find(
  (question): question is DiscoveryChoiceQuestion => question.kind === "choice",
) as DiscoveryChoiceQuestion;
const textQuestion = sdr.discovery.find(
  (question): question is DiscoveryTextQuestion => question.kind === "text",
) as DiscoveryTextQuestion;

function buildSubmission(overrides: Record<string, unknown> = {}) {
  return {
    name: "Dana Tester",
    email: "dana@example.com",
    company: "Tester Accounting",
    segment: "solo",
    answers: Object.fromEntries(
      soloQuestions.map((question) => [question.id, 0]),
    ),
    ...overrides,
  };
}

function buildRequest({
  body = buildSubmission(),
  token,
  headers = {},
  url = "https://boximity.ca/api/security-assessment/call",
}: {
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
  url?: string;
}): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "x-forwarded-for": "203.0.113.9",
      ...(token ? { cookie: `${SDR_SESSION_COOKIE}=${token}` } : {}),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function postWithValidToken(overrides: Record<string, unknown> = {}) {
  return POST(
    buildRequest({
      token: signSdrToken({ name: "Alex Doe" }),
      body: buildSubmission(overrides),
    }),
  );
}

function deliveredFields(): Record<string, string> {
  return mockCreateLead.mock.calls[0][0].fields;
}

async function expectBadRequest(
  overrides: Record<string, unknown>,
  message: string,
) {
  const response = await postWithValidToken(overrides);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: message });
  expect(mockCreateLead).not.toHaveBeenCalled();
  expect(mockNotify).not.toHaveBeenCalled();
}

describe("POST /api/security-assessment/call", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimits();
    process.env = {
      ...originalEnv,
      SDR_LINK_SIGNING_SECRET: "s".repeat(64),
      RESEND_API_KEY: "re_test_key",
      RESEND_MONTHLY_BRIEF_SEGMENT_ID: "seg_brief",
      RESEND_MONTHLY_BRIEF_TOPIC_ID: "topic_brief",
      RESEND_OPTIN_EVENT: "lead.opted_in.test",
    };
    mockCreateLead.mockResolvedValue({ ok: true, leadId: 1 });
    mockNotify.mockResolvedValue(true);
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    process.env = originalEnv;
  });

  describe("authentication", () => {
    async function expectUnauthorized(request: NextRequest) {
      const response = await POST(request);
      expect(response.status).toBe(401);
      expect(mockCreateLead).not.toHaveBeenCalled();
      expect(mockNotify).not.toHaveBeenCalled();
    }

    it("rejects a request with no session cookie", async () => {
      await expectUnauthorized(buildRequest({}));
    });

    it("says only Unauthorized", async () => {
      const response = await POST(buildRequest({}));

      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    it("rejects a tampered token", async () => {
      await expectUnauthorized(
        buildRequest({ token: `${signSdrToken({ name: "Alex Doe" })}x` }),
      );
    });

    it("rejects a garbage token", async () => {
      await expectUnauthorized(buildRequest({ token: "not-a-token" }));
    });

    it("rejects an expired token", async () => {
      jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
      const token = signSdrToken({ name: "Alex Doe" });
      jest.useRealTimers();

      await expectUnauthorized(buildRequest({ token }));
    });

    it("rejects a token signed for another scope", async () => {
      const token = signSubjectLinkToken({
        scope: "install:link",
        subject: "Alex Doe",
        lifetimeMs: 60_000,
      });

      await expectUnauthorized(buildRequest({ token }));
    });

    it("ignores a valid token sent in the body", async () => {
      const token = signSdrToken({ name: "Alex Doe" });

      await expectUnauthorized(
        buildRequest({ body: buildSubmission({ token, t: token }) }),
      );
    });

    it("ignores a valid token sent in a header", async () => {
      const token = signSdrToken({ name: "Alex Doe" });

      await expectUnauthorized(
        buildRequest({
          headers: {
            authorization: `Bearer ${token}`,
            "x-sdr-token": token,
          },
        }),
      );
    });

    it("ignores a valid token in the query string", async () => {
      const token = signSdrToken({ name: "Alex Doe" });

      await expectUnauthorized(
        buildRequest({
          url: `https://boximity.ca/api/security-assessment/call?t=${token}`,
        }),
      );
    });

    it("checks the cookie before reading the body", async () => {
      await expectUnauthorized(buildRequest({ body: "{not json" }));
    });

    it("answers 503, not 401, when the signing secret is unset", async () => {
      const token = signSdrToken({ name: "Alex Doe" });
      delete process.env.SDR_LINK_SIGNING_SECRET;

      const response = await POST(buildRequest({ token }));

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: SERVICE_UNAVAILABLE_MESSAGE,
      });
      expect(mockCreateLead).not.toHaveBeenCalled();
    });

    it("answers 503 when the signing secret is too short", async () => {
      const token = signSdrToken({ name: "Alex Doe" });
      process.env.SDR_LINK_SIGNING_SECRET = "short";

      const response = await POST(buildRequest({ token }));

      expect(response.status).toBe(503);
    });
  });

  describe("rate limiting", () => {
    it("never rate limits a valid token", async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await postWithValidToken();
        expect(response.status).toBe(200);
      }
      expect(isRateLimited).not.toHaveBeenCalled();
    });

    it("doesn't count rejected requests", async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await POST(buildRequest({}));
        expect(response.status).toBe(401);
      }
      expect(isRateLimited).not.toHaveBeenCalled();
    });

    it("leaves the public route's limit in force for the same IP", async () => {
      await postWithValidToken();

      const statuses: number[] = [];
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await postPublicAssessment(
          buildRequest({
            url: "https://boximity.ca/api/security-assessment",
          }),
        );
        statuses.push(response.status);
      }

      expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    });
  });

  describe("the delivered lead", () => {
    it("uses the discovery-call form type and answers success", async () => {
      const response = await postWithValidToken();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(mockCreateLead.mock.calls[0][0]).toMatchObject({
        formType: "Discovery call assessment",
        name: "Dana Tester",
        email: "dana@example.com",
        company: "Tester Accounting",
      });
      expect(mockNotify.mock.calls[0][0].formType).toBe(
        "Discovery call assessment",
      );
    });

    it("records the SDR from the token, ignoring the body", async () => {
      await postWithValidToken({
        sdr: "Mallory",
        sdrName: "Mallory",
        SDR: "Mallory",
      });

      expect(deliveredFields()).toMatchObject({
        SDR: "Alex Doe",
        Channel: "Discovery call",
      });
      expect(JSON.stringify(deliveredFields())).not.toContain("Mallory");
    });

    it("carries the contact, business size, tier, score and weak areas", async () => {
      await postWithValidToken();

      expect(deliveredFields()).toMatchObject({
        Name: "Dana Tester",
        Email: "dana@example.com",
        Company: "Tester Accounting",
        "Business size": config.segments.solo.label,
      });
      expect(deliveredFields()["Risk tier"]).toEqual(expect.any(String));
      expect(deliveredFields()["Weak areas"]).toEqual(expect.any(String));
    });

    it("lists the weak areas by category label, in question order", async () => {
      await postWithValidToken({
        answers: { ...buildSubmission().answers, password_mfa: 3, backups: 2 },
      });

      expect(deliveredFields()["Weak areas"]).toBe("Passwords & MFA, Backups");
    });

    it("scores the answers itself, ignoring a submitted score", async () => {
      const bestAnswers = Object.fromEntries(
        soloQuestions.map((question) => {
          const points = question.answers.map((answer) => answer.points);
          return [question.id, points.indexOf(Math.max(...points))];
        }),
      );

      await postWithValidToken({
        answers: bestAnswers,
        score: 1,
        tier: "exposed",
      });

      const [score, maxScore] = deliveredFields().Score.split("/");
      expect(score).toBe(maxScore);
      expect(deliveredFields()["Risk tier"]).toBe(config.tiers.resilient.label);
    });

    it("puts each note right after its posture answer", async () => {
      await postWithValidToken({
        notes: { [firstQuestion.id]: "  Uses a shared laptop  " },
      });

      const labels = Object.keys(deliveredFields());
      expect(labels[labels.indexOf(firstLabel) + 1]).toBe(`${firstLabel} note`);
      expect(deliveredFields()[firstLabel]).toBe(firstQuestion.answers[0].text);
      expect(deliveredFields()[`${firstLabel} note`]).toBe(
        "Uses a shared laptop",
      );
    });

    it("leaves out the note line for a question with no note", async () => {
      await postWithValidToken({ notes: { [firstQuestion.id]: "   " } });

      expect(deliveredFields()).not.toHaveProperty(`${firstLabel} note`);
    });

    it("shows every discovery question not answered as Not asked", async () => {
      await postWithValidToken({
        discovery: {
          [choiceQuestion.id]: { isNotAsked: true },
          [textQuestion.id]: { note: "   " },
        },
      });

      for (const question of sdr.discovery) {
        expect(deliveredFields()[question.text]).toBe("Not asked");
      }
    });

    it("records a discovery choice and its note", async () => {
      await postWithValidToken({
        discovery: {
          [choiceQuestion.id]: {
            choice: choiceQuestion.choices[0],
            note: "Renewal in March",
          },
        },
      });

      expect(deliveredFields()[choiceQuestion.text]).toBe(
        choiceQuestion.choices[0],
      );
      expect(deliveredFields()[`${choiceQuestion.text} note`]).toBe(
        "Renewal in March",
      );
    });

    it("adds no note line for a discovery choice without a note", async () => {
      await postWithValidToken({
        discovery: {
          [choiceQuestion.id]: { choice: choiceQuestion.choices[0] },
        },
      });

      expect(deliveredFields()[choiceQuestion.text]).toBe(
        choiceQuestion.choices[0],
      );
      expect(deliveredFields()).not.toHaveProperty(
        `${choiceQuestion.text} note`,
      );
    });

    it("records a note-only answer without Not asked", async () => {
      await postWithValidToken({
        discovery: { [textQuestion.id]: { note: "Audit next quarter" } },
      });

      expect(deliveredFields()[textQuestion.text]).toBe("Audit next quarter");
      expect(deliveredFields()).not.toHaveProperty(`${textQuestion.text} note`);
    });

    it("orders posture, opening, closing, then the summary", async () => {
      await postWithValidToken({ callSummary: "Good fit." });

      const labels = Object.keys(deliveredFields());
      const lastPosture = labels.indexOf(
        soloLabelledQuestions[soloLabelledQuestions.length - 1].fieldLabel,
      );
      const discoveryPositions = sdr.discovery.map((question) =>
        labels.indexOf(question.text),
      );
      const lastOpening = sdr.discovery.filter(
        (question) => question.group === "opening",
      ).length;

      expect(discoveryPositions[0]).toBeGreaterThan(lastPosture);
      expect(discoveryPositions).toEqual(
        [...discoveryPositions].sort((a, b) => a - b),
      );
      expect(sdr.discovery[lastOpening - 1].group).toBe("opening");
      expect(sdr.discovery[lastOpening].group).toBe("closing");
      expect(labels[labels.length - 1]).toBe("Call summary");
      expect(deliveredFields()["Call summary"]).toBe("Good fit.");
    });

    it("leaves out a blank call summary", async () => {
      await postWithValidToken({ callSummary: "  " });

      expect(deliveredFields()).not.toHaveProperty("Call summary");
    });
  });

  describe("no marketing side effects", () => {
    it("sends no conversion event, brief line or subscription", async () => {
      await postWithValidToken({ wantsBrief: true });

      expect(sendConversionEvent).not.toHaveBeenCalled();
      expect(deliveredFields()).not.toHaveProperty("Monthly brief");
      expect(mockNotify.mock.calls[0][0].fields).not.toHaveProperty(
        "Monthly brief",
      );
      expect(mockCreateLead.mock.calls[0][0].hasOptedInToBrief).toBeUndefined();
      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("rejects a body that isn't JSON", async () => {
      const response = await POST(
        buildRequest({
          token: signSdrToken({ name: "Alex Doe" }),
          body: "{not json",
        }),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Request body must be valid JSON",
      });
      expect(mockCreateLead).not.toHaveBeenCalled();
    });

    it.each([
      [
        "an unknown segment",
        { segment: "enterprise" },
        "Unknown business size segment",
      ],
      ["a blank name", { name: "  " }, "Name is required"],
      ["a non-string name", { name: 42 }, "Name is required"],
      ["a missing email", { email: undefined }, "Email is required"],
      ["a non-string email", { email: 42 }, "Email is required"],
      [
        "an invalid email",
        { email: "nope" },
        "Please enter a valid email address",
      ],
      ["a blank company", { company: "" }, "Company is required"],
      ["a non-string company", { company: 42 }, "Company is required"],
      ["incomplete answers", { answers: {} }, "Please answer every question"],
      [
        "an out-of-range answer",
        { answers: { [firstQuestion.id]: 99 } },
        "Please answer every question",
      ],
    ])("rejects %s", async (_label, overrides, message) => {
      await expectBadRequest(overrides, message);
    });

    it("rejects one out-of-range answer among complete answers", async () => {
      await expectBadRequest(
        {
          answers: {
            ...buildSubmission().answers,
            [firstQuestion.id]: 99,
          },
        },
        "Please answer every question",
      );
    });

    it("accepts a note of exactly 2,000 characters", async () => {
      const response = await postWithValidToken({
        notes: { [firstQuestion.id]: "n".repeat(2000) },
      });

      expect(response.status).toBe(200);
    });

    it("accepts a summary of exactly 5,000 characters", async () => {
      const response = await postWithValidToken({
        callSummary: "s".repeat(5000),
      });

      expect(response.status).toBe(200);
    });

    it.each([
      [
        "a posture note over 2,000 characters",
        () => ({ notes: { [firstQuestion.id]: "n".repeat(2001) } }),
        "Notes must be 2,000 characters or fewer",
      ],
      [
        "a discovery note over 2,000 characters",
        () => ({
          discovery: { [textQuestion.id]: { note: "n".repeat(2001) } },
        }),
        "Notes must be 2,000 characters or fewer",
      ],
      [
        "a summary over 5,000 characters",
        () => ({ callSummary: "s".repeat(5001) }),
        "The call summary must be 5,000 characters or fewer",
      ],
      [
        "a non-string summary",
        () => ({ callSummary: 5 }),
        "The call summary must be text",
      ],
      [
        "a non-object notes value",
        () => ({ notes: "note" }),
        "Notes must be an object",
      ],
      [
        "a non-string note",
        () => ({ notes: { [firstQuestion.id]: 5 } }),
        "Notes must be text",
      ],
      [
        "a note on an unknown question",
        () => ({ notes: { nope: "note" } }),
        "Unknown question in notes",
      ],
      [
        "a note on a question outside the segment",
        () => {
          const outside = config.questions.find(
            (question) => !question.segments.includes("solo"),
          );
          return { notes: { [outside?.id ?? "missing"]: "note" } };
        },
        "Unknown question in notes",
      ],
      [
        "a non-object discovery value",
        () => ({ discovery: [] }),
        "Discovery answers must be an object",
      ],
      [
        "an unknown discovery id",
        () => ({ discovery: { nope: {} } }),
        "Unknown discovery question",
      ],
      [
        "an unknown discovery choice",
        () => ({ discovery: { [choiceQuestion.id]: { choice: "Nope" } } }),
        "Unknown discovery choice",
      ],
      [
        "a choice on a text question",
        () => ({ discovery: { [textQuestion.id]: { choice: "Nope" } } }),
        "Unknown discovery choice",
      ],
      [
        "a non-object discovery answer",
        () => ({ discovery: { [textQuestion.id]: "answer" } }),
        "Discovery answers must be objects",
      ],
      [
        "a non-string discovery note",
        () => ({ discovery: { [textQuestion.id]: { note: 5 } } }),
        "Notes must be text",
      ],
      [
        "an answer both marked not asked and given a note",
        () => ({
          discovery: {
            [textQuestion.id]: { isNotAsked: true, note: "Answered" },
          },
        }),
        "A question marked not asked can't have an answer",
      ],
      [
        "an answer both marked not asked and given a choice",
        () => ({
          discovery: {
            [choiceQuestion.id]: {
              isNotAsked: true,
              choice: choiceQuestion.choices[0],
            },
          },
        }),
        "A question marked not asked can't have an answer",
      ],
    ])("rejects %s", async (_label, buildOverrides, message) => {
      await expectBadRequest(buildOverrides(), message);
    });
  });

  describe("unexpected failures", () => {
    it("answers 500 when delivery throws", async () => {
      mockCreateLead.mockImplementation(() => {
        throw new Error("boom");
      });

      const response = await postWithValidToken();

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Failed to process your request",
      });
    });
  });

  describe("sink failures", () => {
    it("succeeds when only Syncro fails", async () => {
      mockCreateLead.mockResolvedValue({ ok: false, reason: "api_error" });

      const response = await postWithValidToken();

      expect(response.status).toBe(200);
    });

    it("succeeds when only the webmaster email fails", async () => {
      mockNotify.mockResolvedValue(false);

      const response = await postWithValidToken();

      expect(response.status).toBe(200);
    });

    it("answers 503 with the service message when both fail", async () => {
      mockCreateLead.mockResolvedValue({ ok: false, reason: "api_error" });
      mockNotify.mockResolvedValue(false);

      const response = await postWithValidToken();

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: SERVICE_UNAVAILABLE_MESSAGE,
      });
    });
  });
});
