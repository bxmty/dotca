/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import * as Sentry from "@sentry/nextjs";
import { POST } from "@/app/api/lead-magnet/route";
import { GET } from "@/app/api/lead-magnet/download/route";
import { createLead } from "@/lib/syncro";
import {
  sendLeadMagnetDeliveryEmail,
  sendWebmasterNotification,
} from "@/lib/notify";
import { verifyLeadMagnetToken } from "@/lib/lead-magnet-token";
import { resetRateLimits } from "@/lib/rate-limit";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
  sendLeadMagnetDeliveryEmail: jest.fn(),
}));
// The Syncro write is mocked; its outcome summaries stay real
jest.mock("@/lib/syncro", () => ({
  ...jest.requireActual("@/lib/syncro"),
  createLead: jest.fn(),
}));
// The Resend SDK is the boundary for the brief opt-in (notify is mocked
// above, so this only stands in for the opt-in's contact write and event)
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
const mockWebmasterNotification = sendWebmasterNotification as jest.Mock;
const mockDeliveryEmail = sendLeadMagnetDeliveryEmail as jest.Mock;
const mockCaptureMessage = Sentry.captureMessage as jest.Mock;

const FIXTURE_DIR = path.join(__dirname, "fixtures", "lead-magnets");
const SLUG = "test-fixture-guide";
const TITLE = "Test fixture guide (not real content)";
const EMAIL = "jane.doe@example.com";
const UNAVAILABLE_COPY =
  "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.";
const originalEnv = process.env;

function post(body: unknown, { isRawBody = false } = {}) {
  return POST(
    new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.7",
      },
      body: isRawBody ? String(body) : JSON.stringify(body),
    }),
  );
}

async function expectResponse(
  response: Response,
  status: number,
  body: unknown,
) {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual(body);
}

function readLeadLogLines(log: jest.SpyInstance): unknown[] {
  return log.mock.calls
    .map(([line]) => String(line))
    .filter((line) => line.includes('"event":"lead_submission"'))
    .map((line) => JSON.parse(line));
}

function expectNoEmailInSentry() {
  for (const [detail] of mockCaptureMessage.mock.calls) {
    expect(String(detail)).not.toContain(EMAIL);
    expect(String(detail)).not.toContain("jane");
  }
}

describe("POST /api/lead-magnet", () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimits();
    process.env = {
      ...originalEnv,
      LEAD_MAGNET_CONTENT_DIR: FIXTURE_DIR,
      LEAD_MAGNET_SIGNING_SECRET: "s".repeat(64),
      RESEND_API_KEY: "re_test_key",
      RESEND_MONTHLY_BRIEF_SEGMENT_ID: "seg_brief",
      RESEND_MONTHLY_BRIEF_TOPIC_ID: "topic_brief",
      RESEND_OPTIN_EVENT: "lead.opted_in.test",
    };
    jest.spyOn(console, "error").mockImplementation(() => {});
    log = jest.spyOn(console, "log").mockImplementation(() => {});
    mockCreateLead.mockResolvedValue({ ok: true, leadId: 42 });
    mockWebmasterNotification.mockResolvedValue(true);
    mockDeliveryEmail.mockResolvedValue(true);
    mockCreateResendContact.mockResolvedValue({
      data: { id: "contact_123", object: "contact" },
      error: null,
    });
    mockSendResendEvent.mockResolvedValue({ data: {}, error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("returns 400 for a malformed JSON body", async () => {
    await expectResponse(await post("{not json", { isRawBody: true }), 400, {
      error: "Request body must be valid JSON",
    });
  });

  it("fakes success and records nothing when the honeypot is filled", async () => {
    await expectResponse(
      await post({ slug: SLUG, email: EMAIL, website: "https://spam.example" }),
      200,
      { success: true },
    );
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockDeliveryEmail).not.toHaveBeenCalled();
  });

  it("rate limits the sixth submission from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      await post({ slug: SLUG, email: EMAIL });
    }

    await expectResponse(await post({ slug: SLUG, email: EMAIL }), 429, {
      error: "Too many submissions. Please try again later.",
    });
    expect(mockCreateLead).toHaveBeenCalledTimes(5);
  });

  it.each([
    ["an unknown slug", "no-such-guide"],
    ["an unpublished magnet", "unpublished-fixture-guide"],
    ["a traversal attempt", "../../.env"],
    ["a missing slug", undefined],
  ])("returns 404 for %s", async (_name, slug) => {
    await expectResponse(await post({ slug, email: EMAIL }), 404, {
      error: "Resource not found",
    });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("returns 400 when the email is missing", async () => {
    await expectResponse(await post({ slug: SLUG }), 400, {
      error: "Email is required",
    });
  });

  it.each(["not-an-email", "jane@example", 42])(
    "returns 400 for the invalid email %p",
    async (email) => {
      await expectResponse(await post({ slug: SLUG, email }), 400, {
        error: "Please enter a valid email address",
      });
      expect(mockCreateLead).not.toHaveBeenCalled();
    },
  );

  it("records a Syncro Lead tagged with the magnet slug", async () => {
    await post({ slug: SLUG, email: EMAIL });

    expect(mockCreateLead).toHaveBeenCalledTimes(1);
    expect(mockCreateLead).toHaveBeenCalledWith({
      formType: "Lead magnet",
      name: EMAIL,
      email: EMAIL,
      fields: {
        Email: EMAIL,
        Resource: TITLE,
        Source: `lead-magnet:${SLUG}`,
        "Monthly brief": "No",
      },
      hasOptedInToBrief: false,
    });
  });

  it("records the brief consent on the Lead when the box is ticked", async () => {
    await post({ slug: SLUG, email: EMAIL, wantsBrief: true });

    expect(mockCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        hasOptedInToBrief: true,
        fields: expect.objectContaining({ "Monthly brief": "Yes" }),
      }),
    );
  });

  it("trims the email before recording the lead", async () => {
    const response = await post({ slug: SLUG, email: `  ${EMAIL}  ` });

    expect(response.status).toBe(200);
    expect(mockCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({ email: EMAIL }),
    );
    expect(mockDeliveryEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: EMAIL }),
    );
  });

  it("returns a signed download link that serves the PDF, and sends both notifications", async () => {
    const response = await post({ slug: SLUG, email: EMAIL });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    const downloadUrl = new URL(body.downloadUrl, "https://boximity.ca");
    expect(downloadUrl.pathname).toBe("/api/lead-magnet/download");
    expect(downloadUrl.searchParams.get("slug")).toBe(SLUG);
    expect(
      verifyLeadMagnetToken({
        slug: SLUG,
        token: downloadUrl.searchParams.get("token") ?? "",
      }).isValid,
    ).toBe(true);

    // The link the visitor is handed actually downloads the asset
    const download = await GET(
      new Request(`http://localhost${body.downloadUrl}`),
    );
    expect(download.status).toBe(200);
    expect(download.headers.get("Content-Type")).toBe("application/pdf");
    expect(Buffer.from(await download.arrayBuffer())).toEqual(
      fs.readFileSync(path.join(FIXTURE_DIR, "assets", `${SLUG}.pdf`)),
    );

    expect(mockDeliveryEmail).toHaveBeenCalledWith({
      to: EMAIL,
      downloadUrl: `https://boximity.ca${body.downloadUrl}`,
      title: TITLE,
    });
    expect(mockWebmasterNotification).toHaveBeenCalledWith({
      formType: "Lead magnet",
      submitterName: EMAIL,
      fields: {
        Email: EMAIL,
        Resource: TITLE,
        Source: `lead-magnet:${SLUG}`,
        "Monthly brief": "No",
      },
    });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("logs one structured line for a recorded lead", async () => {
    await post({ slug: SLUG, email: EMAIL });

    expect(readLeadLogLines(log)).toEqual([
      {
        event: "lead_submission",
        formType: "Lead magnet",
        name: "",
        company: "",
        email: EMAIL,
        phone: "",
        syncro: "ok",
        webmasterEmail: "ok",
      },
    ]);
  });

  it.each([
    [
      "rejects",
      { ok: false, reason: "rejected", status: 422, message: EMAIL },
      "rejected (HTTP 422)",
    ],
    [
      "is unreachable",
      { ok: false, reason: "unreachable", code: "network_error" },
      "unreachable (network_error)",
    ],
  ])(
    "returns 503 and releases nothing when Syncro %s",
    async (_name, syncroResult, outcome) => {
      mockCreateLead.mockResolvedValue(syncroResult);

      await expectResponse(
        await post({ slug: SLUG, email: EMAIL, wantsBrief: true }),
        503,
        { error: UNAVAILABLE_COPY },
      );

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        `Lead magnet capture failure (${SLUG}): Syncro ${outcome}`,
        "error",
      );
      expectNoEmailInSentry();
      // The structured log is the only record of this lead
      expect(readLeadLogLines(log)).toEqual([
        expect.objectContaining({
          formType: "Lead magnet",
          email: EMAIL,
          syncro: outcome,
          webmasterEmail: "failed",
        }),
      ]);
      expect(mockCreateResendContact).not.toHaveBeenCalled();
      expect(mockDeliveryEmail).not.toHaveBeenCalled();
      expect(mockWebmasterNotification).not.toHaveBeenCalled();
    },
  );

  it("reads a thrown Syncro write as unreachable", async () => {
    mockCreateLead.mockRejectedValue(new Error(`boom for ${EMAIL}`));

    const response = await post({ slug: SLUG, email: EMAIL });

    expect(response.status).toBe(503);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      `Lead magnet capture failure (${SLUG}): Syncro unreachable (exception)`,
      "error",
    );
    expectNoEmailInSentry();
  });

  it.each([
    ["unset", undefined],
    ["shorter than 32 characters", "too-short"],
  ])(
    "returns 503 with the failure copy when the signing secret is %s",
    async (_name, secret) => {
      process.env.LEAD_MAGNET_SIGNING_SECRET = secret;

      await expectResponse(await post({ slug: SLUG, email: EMAIL }), 503, {
        error: UNAVAILABLE_COPY,
      });
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        expect.stringContaining("LEAD_MAGNET_SIGNING_SECRET"),
        "error",
      );
      expectNoEmailInSentry();
      expect(mockDeliveryEmail).not.toHaveBeenCalled();
    },
  );

  it("succeeds even when both notifications fail, warning Sentry without PII", async () => {
    mockDeliveryEmail.mockRejectedValueOnce(new Error("resend down"));
    mockWebmasterNotification.mockResolvedValueOnce(false);

    const response = await post({ slug: SLUG, email: EMAIL });

    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      `Lead magnet delivery failure (${SLUG}): Syncro ok, webmaster email failed`,
      "error",
    );
    expectNoEmailInSentry();
    expect(readLeadLogLines(log)).toEqual([
      expect.objectContaining({ syncro: "ok", webmasterEmail: "failed" }),
    ]);
  });

  describe("monthly brief opt-in", () => {
    it("makes no Resend contact when the box is unticked", async () => {
      await post({ slug: SLUG, email: EMAIL, wantsBrief: false });

      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });

    it("only an explicit true opts in", async () => {
      await post({ slug: SLUG, email: EMAIL, wantsBrief: "yes" });

      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });

    it("adds the lead to the brief segment and topic when ticked, without starting a nurture", async () => {
      const response = await post({
        slug: SLUG,
        email: EMAIL,
        wantsBrief: true,
      });

      expect(response.status).toBe(200);
      expect(mockCreateResendContact).toHaveBeenCalledTimes(1);
      expect(mockCreateResendContact).toHaveBeenCalledWith(
        expect.objectContaining({
          email: EMAIL,
          segments: [{ id: "seg_brief" }],
          topics: [{ id: "topic_brief", subscription: "opt_in" }],
        }),
      );
      // #642's automation has no lead-magnet branch: no lead.opted_in event
      expect(mockSendResendEvent).not.toHaveBeenCalled();
    });

    it("still returns the download link when the opt-in fails, warning Sentry without PII", async () => {
      mockCreateResendContact.mockRejectedValue(new Error(`down ${EMAIL}`));

      const response = await post({
        slug: SLUG,
        email: EMAIL,
        wantsBrief: true,
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.downloadUrl).toContain("/api/lead-magnet/download?");
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        expect.stringContaining("Monthly brief opt-in failed (lead-magnet)"),
        "warning",
      );
      expectNoEmailInSentry();
      expect(mockDeliveryEmail).toHaveBeenCalled();
    });
  });
});
