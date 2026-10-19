// tests/api-onboarding.test.ts
import { POST } from "@/app/api/onboarding/route";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createLead } from "@/lib/syncro";
import { sendWebmasterNotification } from "@/lib/notify";
import { resetRateLimits } from "@/lib/rate-limit";
import { sendConversionEvent } from "@/lib/ga4";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

// Mock the delivery modules; phone formatting stays real
jest.mock("@/lib/syncro", () => ({
  ...jest.requireActual("@/lib/syncro"),
  createLead: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
}));
// Keep the real cookie parser; only the network-calling sender is mocked
jest.mock("@/lib/ga4", () => ({
  ...jest.requireActual("@/lib/ga4"),
  sendConversionEvent: jest.fn(),
}));

const mockCreateLead = createLead as jest.Mock;
// The Resend SDK is the boundary for the brief opt-in and the day-0
// confirmation (notify is mocked above, so this only stands in for the
// opt-in's contact write, the lead.opted_in event that follows it, and the
// confirmation's templated emails.send)
const mockCreateResendContact = jest.fn();
const mockSendResendEvent = jest.fn();
const mockSendResendEmail = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSendResendEmail },
    contacts: {
      create: mockCreateResendContact,
      segments: {
        add: jest.fn().mockResolvedValue({ error: { name: "not_found" } }),
      },
      topics: { update: jest.fn() },
    },
    events: { send: mockSendResendEvent },
  })),
}));

const originalEnv = process.env;

const mockNotify = sendWebmasterNotification as jest.Mock;
const mockSendConversionEvent = sendConversionEvent as jest.Mock;

const validOnboardingData = {
  companyName: "Test Company",
  industry: "Technology",
  employeeCount: "11-25",
  contactName: "Test User",
  contactEmail: "test@example.com",
  contactPhone: "123-456-7890",
  address: "123 Test St",
  city: "Test City",
  state: "Test State",
  zipCode: "12345",
  currentITProviders: "Current provider",
  softwareUsed: "Software 1, Software 2",
  painPoints: "Some pain points",
  goals: "Some goals",
};

function buildRequest(
  body: unknown,
  headers?: Record<string, string>,
): Request {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers({ "x-forwarded-for": "203.0.113.9", ...headers }),
  } as unknown as Request;
}

describe("Onboarding API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimits();
    mockCreateLead.mockResolvedValue({ ok: true, leadId: 1 });
    mockNotify.mockResolvedValue(true);
    mockSendConversionEvent.mockResolvedValue(undefined);
    mockCreateResendContact.mockResolvedValue({
      data: { id: "contact_1" },
      error: null,
    });
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      RESEND_OPTIN_SEGMENT_ID: "seg_brief",
      RESEND_OPTIN_TOPIC_ID: "topic_brief",
      RESEND_OPTIN_EVENT: "lead.opted_in.test",
      RESEND_FROM_EMAIL: "noreply@example.test",
      RESEND_TEMPLATE_ONBOARDING_CONFIRMATION: "tmpl_onboarding",
    };
    mockSendResendEmail.mockResolvedValue({
      data: { id: "email_1" },
      error: null,
    });
    mockSendResendEvent.mockResolvedValue({
      data: { object: "event", event: "lead.opted_in.test" },
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("writes a Syncro lead carrying every field and emails the webmaster", async () => {
    await POST(buildRequest(validOnboardingData));

    const [lead] = mockCreateLead.mock.calls[0];
    expect(lead).toEqual({
      formType: "Onboarding",
      name: "Test User",
      email: "test@example.com",
      phone: "+11234567890",
      company: "Test Company",
      fields: expect.objectContaining({
        Company: "Test Company",
        Industry: "Technology",
        "Employee count": "11-25",
        "Postal code": "12345",
        Goals: "Some goals",
      }),
    });
    expect(lead.fields).toEqual(mockNotify.mock.calls[0][0].fields);
    expect(mockNotify).toHaveBeenCalledWith({
      formType: "Onboarding",
      submitterName: "Test User",
      fields: expect.objectContaining({
        Company: "Test Company",
        Email: "test@example.com",
      }),
    });
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Onboarding data received successfully",
    });
  });

  it("sends a sign_up conversion with no value, attributed from the request cookies", async () => {
    const originalGaId = process.env.NEXT_PUBLIC_DEV_GA_ID;
    process.env.NEXT_PUBLIC_DEV_GA_ID = "G-TESTID";

    await POST(
      buildRequest(validOnboardingData, {
        cookie:
          "_ga=GA1.1.111111111.222222222; _ga_TESTID=GS1.1.333333333.4.1.444444444.0.0.0",
      }),
    );

    expect(mockSendConversionEvent).toHaveBeenCalledWith({
      name: "sign_up",
      clientId: "111111111.222222222",
      sessionId: "333333333",
    });
    expect(mockSendConversionEvent.mock.calls[0][0]).not.toHaveProperty(
      "params",
    );
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Onboarding data received successfully",
    });

    process.env.NEXT_PUBLIC_DEV_GA_ID = originalGaId;
  });

  it("still succeeds and sends no event when there are no GA cookies", async () => {
    await POST(buildRequest(validOnboardingData));

    expect(mockSendConversionEvent).toHaveBeenCalledWith({
      name: "sign_up",
      clientId: undefined,
      sessionId: undefined,
    });
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Onboarding data received successfully",
    });
  });

  it("does not fail the submission when the conversion event rejects", async () => {
    mockSendConversionEvent.mockRejectedValueOnce(
      new Error("MP request failed"),
    );

    await POST(buildRequest(validOnboardingData));

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Onboarding data received successfully",
    });
  });

  it("sends no conversion event when validation fails", async () => {
    await POST(
      buildRequest({ companyName: "Test Company", industry: "Technology" }),
    );

    expect(mockSendConversionEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    await POST(
      buildRequest({ companyName: "Test Company", industry: "Technology" }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining("Missing required fields"),
      }),
      { status: 400 },
    );
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    await POST(
      buildRequest({ ...validOnboardingData, contactEmail: "not-an-email" }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Please enter a valid email address" },
      { status: 400 },
    );
  });

  it("returns 400 for a short phone number", async () => {
    await POST(buildRequest({ ...validOnboardingData, contactPhone: "12345" }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: "Please enter a valid phone number with at least 10 digits",
      },
      { status: 400 },
    );
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const request = {
      json: jest.fn().mockRejectedValueOnce(new Error("JSON parsing error")),
      headers: new Headers(),
    } as unknown as Request;

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  });

  describe("delivery matrix", () => {
    const success = {
      success: true,
      message: "Onboarding data received successfully",
    };

    it("succeeds quietly when both Syncro and the email land", async () => {
      await POST(buildRequest(validOnboardingData));

      expect(NextResponse.json).toHaveBeenCalledWith(success);
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it("succeeds and reports Syncro when only the email lands", async () => {
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "unreachable",
        code: "server_error",
        status: 502,
      });

      await POST(buildRequest(validOnboardingData));

      expect(NextResponse.json).toHaveBeenCalledWith(success);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Onboarding delivery failure: Syncro unreachable (server_error, HTTP 502), webmaster email ok",
        "error",
      );
    });

    it("succeeds and reports the email when only Syncro lands", async () => {
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest(validOnboardingData));

      expect(NextResponse.json).toHaveBeenCalledWith(success);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Onboarding delivery failure: Syncro ok, webmaster email failed",
        "error",
      );
    });

    it("returns 503 with direct contact info when neither lands", async () => {
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "unreachable",
        code: "missing_config",
      });
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest(validOnboardingData));

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error:
            "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
        },
        { status: 503 },
      );
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Onboarding delivery failure: Syncro unreachable (missing_config), webmaster email failed",
        "error",
      );
    });
  });

  it("keeps submitted values out of the Sentry message", async () => {
    mockCreateLead.mockResolvedValueOnce({
      ok: false,
      reason: "rejected",
      status: 422,
      message: "Email test@example.com is invalid for Test Company",
    });
    mockNotify.mockResolvedValueOnce(false);

    await POST(buildRequest(validOnboardingData));

    const [captured] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    for (const value of [
      "Test User",
      "test@example.com",
      "4567890",
      "Test Company",
    ]) {
      expect(captured).not.toContain(value);
    }
  });

  it("logs one structured line per submission", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    await POST(buildRequest(validOnboardingData));

    const leadLines = log.mock.calls
      .map(([line]) => String(line))
      .filter((line) => line.includes('"event":"lead_submission"'));
    expect(leadLines).toHaveLength(1);
    expect(JSON.parse(leadLines[0])).toEqual({
      event: "lead_submission",
      formType: "Onboarding",
      name: "Test User",
      company: "Test Company",
      email: "test@example.com",
      phone: "+11234567890",
      syncro: "ok",
      webmasterEmail: "ok",
    });
    log.mockRestore();
  });

  it("silently accepts honeypot submissions without sending anything", async () => {
    await POST(
      buildRequest({ ...validOnboardingData, website: "https://spam.example" }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockSendConversionEvent).not.toHaveBeenCalled();
  });

  it("rate limits the sixth submission from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(buildRequest(validOnboardingData));
    }

    await POST(buildRequest(validOnboardingData));

    expect(NextResponse.json).toHaveBeenLastCalledWith(
      {
        success: false,
        error: "Too many submissions. Please try again later.",
      },
      { status: 429 },
    );
    expect(mockCreateLead).toHaveBeenCalledTimes(5);
  });

  describe("day-0 confirmation email", () => {
    it("sends the onboarding confirmation template with the first word of the contact name", async () => {
      await POST(
        buildRequest({ ...validOnboardingData, contactName: "Jane Q Doe" }),
      );

      expect(mockSendResendEmail).toHaveBeenCalledTimes(1);
      const [payload, options] = mockSendResendEmail.mock.calls[0];
      expect(payload).toEqual({
        from: "Boximity <noreply@example.test>",
        to: "test@example.com",
        replyTo: "hi@boximity.ca",
        template: {
          id: "tmpl_onboarding",
          variables: { USER_FIRST_NAME: "Jane" },
        },
      });
      expect(options.idempotencyKey).toMatch(
        /^followup-onboarding\/[0-9a-f]{64}\/\d{4}-\d{2}-\d{2}$/,
      );
      expect(options.idempotencyKey).not.toContain("test@example.com");
    });

    it("is sent whether or not the brief box was ticked", async () => {
      await POST(buildRequest({ ...validOnboardingData, wantsBrief: true }));

      expect(mockSendResendEmail).toHaveBeenCalledTimes(1);
    });

    it("still succeeds, with only a Sentry warning, when the send fails", async () => {
      mockSendResendEmail.mockRejectedValue(new Error("network down"));

      await POST(buildRequest(validOnboardingData));

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Onboarding data received successfully",
      });
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Confirmation email not sent (onboarding): exception",
        "warning",
      );
    });

    it("leaves the delivery matrix unchanged when the send fails", async () => {
      mockSendResendEmail.mockResolvedValue({
        data: null,
        error: { name: "application_error", message: "boom", statusCode: 500 },
      });
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest(validOnboardingData));

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Onboarding data received successfully",
      });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Onboarding delivery failure: Syncro ok, webmaster email failed",
        "error",
      );
    });

    it("is not sent for a honeypot submission", async () => {
      await POST(
        buildRequest({
          ...validOnboardingData,
          website: "https://spam.example",
        }),
      );

      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });

    it("is not sent for a rate-limited submission", async () => {
      for (let i = 0; i < 5; i++) {
        await POST(buildRequest(validOnboardingData));
      }
      mockSendResendEmail.mockClear();

      await POST(buildRequest(validOnboardingData));

      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });

    it("is not sent when validation fails", async () => {
      await POST(
        buildRequest({ ...validOnboardingData, contactEmail: "not-an-email" }),
      );

      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });

    it("is not sent when the submission fails with a 503", async () => {
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "unreachable",
        code: "missing_config",
      });
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest(validOnboardingData));

      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });
  });

  describe("monthly brief opt-in", () => {
    it("subscribes a submitter who ticked the box to the brief", async () => {
      await POST(buildRequest({ ...validOnboardingData, wantsBrief: true }));

      expect(mockCreateResendContact).toHaveBeenCalledWith({
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        segments: [{ id: "seg_brief" }],
        topics: [{ id: "topic_brief", subscription: "opt_in" }],
      });
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: expect.objectContaining({ "Monthly brief": "Yes" }),
        }),
      );
      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Onboarding data received successfully",
      });
    });

    it.each([
      ["absent", undefined],
      ["false", false],
      ["a truthy non-boolean", "on"],
    ])(
      "makes no Resend call when the box is %s",
      async (_label, wantsBrief) => {
        await POST(buildRequest({ ...validOnboardingData, wantsBrief }));

        expect(mockCreateResendContact).not.toHaveBeenCalled();
        expect(mockSendResendEvent).not.toHaveBeenCalled();
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({
            fields: expect.objectContaining({ "Monthly brief": "No" }),
          }),
        );
      },
    );

    it("still succeeds, with a Sentry warning, when the Resend write fails", async () => {
      mockCreateResendContact.mockRejectedValue(new Error("socket hang up"));

      await POST(buildRequest({ ...validOnboardingData, wantsBrief: true }));

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Onboarding data received successfully",
      });
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("Monthly brief opt-in failed (onboarding)"),
        "warning",
      );
    });

    it("makes no Resend call when required fields are missing", async () => {
      await POST(
        buildRequest({
          ...validOnboardingData,
          companyName: "",
          wantsBrief: true,
        }),
      );

      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });

    it("sends one lead.opted_in event with source onboarding for a ticked box", async () => {
      await POST(buildRequest({ ...validOnboardingData, wantsBrief: true }));

      expect(mockSendResendEvent).toHaveBeenCalledTimes(1);
      expect(mockSendResendEvent).toHaveBeenCalledWith({
        event: "lead.opted_in.test",
        email: "test@example.com",
        payload: { source: "onboarding" },
      });
    });

    it("sends no event when the contact write fails", async () => {
      mockCreateResendContact.mockRejectedValue(new Error("socket hang up"));

      await POST(buildRequest({ ...validOnboardingData, wantsBrief: true }));

      expect(mockSendResendEvent).not.toHaveBeenCalled();
    });

    it("still succeeds, with a Sentry warning, when the event send fails", async () => {
      mockSendResendEvent.mockResolvedValue({
        data: null,
        error: {
          name: "rate_limit_exceeded",
          message: "slow",
          statusCode: 429,
        },
      });

      await POST(buildRequest({ ...validOnboardingData, wantsBrief: true }));

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Onboarding data received successfully",
      });
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("opt-in event not sent (onboarding)"),
        "warning",
      );
    });
  });
});
