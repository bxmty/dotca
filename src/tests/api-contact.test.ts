// tests/api-contact.test.ts
import { POST } from "@/app/api/contact/route";
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

// Mock the delivery modules; outcome summaries stay real
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

function buildRequest(
  body: unknown,
  headers?: Record<string, string>,
): Request {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers({ "x-forwarded-for": "203.0.113.7", ...headers }),
  } as unknown as Request;
}

const validBody = {
  name: "Test User",
  email: "test@example.com",
  phone: "123-456-7890",
};

describe("Contact API Route", () => {
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
      RESEND_MONTHLY_BRIEF_SEGMENT_ID: "seg_brief",
      RESEND_MONTHLY_BRIEF_TOPIC_ID: "topic_brief",
      RESEND_OPTIN_EVENT: "lead.opted_in.test",
      RESEND_FROM_EMAIL: "noreply@example.test",
      RESEND_TEMPLATE_CONTACT_CONFIRMATION: "tmpl_contact",
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

  it("returns 400 if email is missing", async () => {
    await POST(buildRequest({ name: "Test User", phone: "123-456-7890" }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Email is required" },
      { status: 400 },
    );
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("returns 400 if phone is not a string", async () => {
    await POST(
      buildRequest({
        name: "Test User",
        email: "test@example.com",
        phone: 1234567890,
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Field "phone" must be a string' },
      { status: 400 },
    );
  });

  it("returns 400 for an impossible phone number without contacting anyone", async () => {
    await POST(
      buildRequest({
        name: "Test User",
        email: "test@example.com",
        phone: "123",
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Please enter a valid phone number" },
      { status: 400 },
    );
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    const request = {
      json: jest.fn().mockRejectedValueOnce(new Error("JSON parsing error")),
      headers: new Headers(),
    } as unknown as Request;

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  });

  it("writes a Syncro lead carrying every field and emails the webmaster", async () => {
    await POST(buildRequest({ ...validBody, company: "Acme", plan: "Core" }));

    const [lead] = mockCreateLead.mock.calls[0];
    expect(lead).toEqual({
      formType: "Contact",
      name: "Test User",
      email: "test@example.com",
      phone: "+11234567890",
      company: "Acme",
      fields: expect.objectContaining({
        Name: "Test User",
        Email: "test@example.com",
        Phone: "+11234567890",
        Company: "Acme",
        Plan: "Core",
      }),
    });
    // The ticket description and the email carry the same submitted fields
    expect(lead.fields).toEqual(mockNotify.mock.calls[0][0].fields);
    expect(mockNotify).toHaveBeenCalledWith({
      formType: "Contact",
      submitterName: "Test User",
      fields: expect.objectContaining({
        Name: "Test User",
        Email: "test@example.com",
        Phone: "+11234567890",
      }),
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("sends a generate_lead conversion attributed from the request cookies", async () => {
    const originalGaId = process.env.NEXT_PUBLIC_DEV_GA_ID;
    process.env.NEXT_PUBLIC_DEV_GA_ID = "G-TESTID";

    await POST(
      buildRequest(validBody, {
        cookie:
          "_ga=GA1.1.111111111.222222222; _ga_TESTID=GS1.1.333333333.4.1.444444444.0.0.0",
      }),
    );

    expect(mockSendConversionEvent).toHaveBeenCalledWith({
      name: "generate_lead",
      clientId: "111111111.222222222",
      sessionId: "333333333",
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });

    process.env.NEXT_PUBLIC_DEV_GA_ID = originalGaId;
  });

  it("still succeeds and sends no event when there are no GA cookies", async () => {
    await POST(buildRequest(validBody));

    expect(mockSendConversionEvent).toHaveBeenCalledWith({
      name: "generate_lead",
      clientId: undefined,
      sessionId: undefined,
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("does not fail the submission when the conversion event rejects", async () => {
    mockSendConversionEvent.mockRejectedValueOnce(
      new Error("MP request failed"),
    );

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("sends no conversion event when validation fails", async () => {
    await POST(buildRequest({ name: "Test User", phone: "123-456-7890" }));

    expect(mockSendConversionEvent).not.toHaveBeenCalled();
  });

  describe("delivery matrix", () => {
    const syncroUnreachable = {
      ok: false,
      reason: "unreachable",
      code: "network_error",
    };

    it("succeeds quietly when both Syncro and the email land", async () => {
      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it("succeeds and reports Syncro when only the email lands", async () => {
      mockCreateLead.mockResolvedValueOnce(syncroUnreachable);

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Contact form delivery failure: Syncro unreachable (network_error), webmaster email ok",
        "error",
      );
    });

    it("succeeds and reports the email when only Syncro lands", async () => {
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Contact form delivery failure: Syncro ok, webmaster email failed",
        "error",
      );
    });

    it("returns 503 with direct contact info when neither lands", async () => {
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "rejected",
        status: 422,
      });
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error:
            "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
        },
        { status: 503 },
      );
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Contact form delivery failure: Syncro rejected (HTTP 422), webmaster email failed",
        "error",
      );
    });

    it("treats a createLead exception as Syncro not landing", async () => {
      mockCreateLead.mockRejectedValueOnce(new Error("boom"));

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("Syncro unreachable"),
        "error",
      );
    });
  });

  it("keeps submitted values out of the Sentry message", async () => {
    // Syncro's rejection message echoes the submission; it must not leak
    mockCreateLead.mockResolvedValueOnce({
      ok: false,
      reason: "rejected",
      status: 422,
      message: "Email test@example.com is invalid for Acme",
    });
    mockNotify.mockResolvedValueOnce(false);

    await POST(buildRequest({ ...validBody, company: "Acme" }));

    const [captured] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    for (const value of ["Test User", "test@example.com", "4567890", "Acme"]) {
      expect(captured).not.toContain(value);
    }
  });

  it("logs one structured line per submission", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    await POST(buildRequest({ ...validBody, company: "Acme" }));

    const leadLines = log.mock.calls
      .map(([line]) => String(line))
      .filter((line) => line.includes('"event":"lead_submission"'));
    expect(leadLines).toHaveLength(1);
    expect(JSON.parse(leadLines[0])).toEqual({
      event: "lead_submission",
      formType: "Contact",
      name: "Test User",
      company: "Acme",
      email: "test@example.com",
      phone: "+11234567890",
      syncro: "ok",
      webmasterEmail: "ok",
    });
    log.mockRestore();
  });

  it("silently accepts honeypot submissions without sending anything", async () => {
    await POST(buildRequest({ ...validBody, website: "https://spam.example" }));

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockSendConversionEvent).not.toHaveBeenCalled();
  });

  it("rate limits the sixth submission from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(buildRequest(validBody));
    }
    expect(mockCreateLead).toHaveBeenCalledTimes(5);

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenLastCalledWith(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
    expect(mockCreateLead).toHaveBeenCalledTimes(5);
  });

  describe("day-0 confirmation email", () => {
    it("sends the contact confirmation template with the first word of the name", async () => {
      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(mockSendResendEmail).toHaveBeenCalledTimes(1);
      const [payload, options] = mockSendResendEmail.mock.calls[0];
      expect(payload).toEqual({
        from: "Boximity <noreply@example.test>",
        to: "test@example.com",
        replyTo: "hi@boximity.ca",
        template: {
          id: "tmpl_contact",
          variables: { USER_FIRST_NAME: "Test" },
        },
      });
      expect(options.idempotencyKey).toMatch(
        /^followup-contact\/[0-9a-f]{64}\/\d{4}-\d{2}-\d{2}$/,
      );
    });

    it("prefers an explicit firstName field", async () => {
      await POST(
        buildRequest({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          phone: "123-456-7890",
        }),
      );

      expect(mockSendResendEmail.mock.calls[0][0].template.variables).toEqual({
        USER_FIRST_NAME: "Jane",
      });
    });

    it("is sent whether or not the brief box was ticked", async () => {
      await POST(buildRequest({ ...validBody, wantsBrief: true }));

      expect(mockSendResendEmail).toHaveBeenCalledTimes(1);
    });

    it("is sent when only the webmaster email landed (Syncro rejected the lead)", async () => {
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "rejected",
        status: 422,
      });

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(mockSendResendEmail).toHaveBeenCalledTimes(1);
    });

    it("still succeeds, with only a Sentry warning, when the send fails", async () => {
      mockSendResendEmail.mockResolvedValue({
        data: null,
        error: { name: "application_error", message: "boom", statusCode: 500 },
      });

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(mockCreateLead).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Confirmation email not sent (contact): application_error",
        "warning",
      );
    });

    it("leaves the delivery matrix unchanged when the send fails", async () => {
      mockSendResendEmail.mockRejectedValue(new Error("network down"));
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "unreachable",
        code: "network_error",
      });

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Contact form delivery failure: Syncro unreachable (network_error), webmaster email ok",
        "error",
      );
    });

    it("still succeeds when the template ID is not configured", async () => {
      delete process.env.RESEND_TEMPLATE_CONTACT_CONFIRMATION;

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(mockSendResendEmail).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Confirmation email not sent (contact): RESEND_TEMPLATE_CONTACT_CONFIRMATION not set",
        "warning",
      );
    });

    it("is not sent for a honeypot submission", async () => {
      await POST(
        buildRequest({ ...validBody, website: "https://spam.example" }),
      );

      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });

    it("is not sent for a rate-limited submission", async () => {
      for (let i = 0; i < 5; i++) {
        await POST(buildRequest(validBody));
      }
      mockSendResendEmail.mockClear();

      await POST(buildRequest(validBody));

      expect(NextResponse.json).toHaveBeenLastCalledWith(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });

    it("is not sent when validation fails", async () => {
      await POST(buildRequest({ ...validBody, email: "not-an-email" }));

      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });

    it("is not sent when the submission fails with a 503", async () => {
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "unreachable",
        code: "missing_config",
      });
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest(validBody));

      expect(mockSendResendEmail).not.toHaveBeenCalled();
    });
  });

  describe("monthly brief opt-in", () => {
    it("subscribes a submitter who ticked the box to the brief", async () => {
      await POST(buildRequest({ ...validBody, wantsBrief: true }));

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
      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    });

    it.each([
      ["absent", undefined],
      ["false", false],
      ["a truthy non-boolean", "true"],
    ])(
      "makes no Resend call when the box is %s",
      async (_label, wantsBrief) => {
        await POST(buildRequest({ ...validBody, wantsBrief }));

        expect(mockCreateResendContact).not.toHaveBeenCalled();
        expect(mockSendResendEvent).not.toHaveBeenCalled();
        expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      },
    );

    it("still succeeds, with a Sentry warning, when the Resend write fails", async () => {
      mockCreateResendContact.mockResolvedValue({
        data: null,
        error: { name: "restricted_api_key", message: "nope", statusCode: 401 },
      });

      await POST(buildRequest({ ...validBody, wantsBrief: true }));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("Monthly brief opt-in failed (contact)"),
        "warning",
      );
    });

    it("makes no Resend call for a honeypot submission", async () => {
      await POST(
        buildRequest({
          ...validBody,
          wantsBrief: true,
          website: "https://spam.example",
        }),
      );

      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });

    it("makes no Resend call when validation fails", async () => {
      await POST(
        buildRequest({ ...validBody, email: "not-an-email", wantsBrief: true }),
      );

      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });

    it("sends one lead.opted_in event with source contact for a ticked box", async () => {
      await POST(buildRequest({ ...validBody, wantsBrief: true }));

      expect(mockSendResendEvent).toHaveBeenCalledTimes(1);
      expect(mockSendResendEvent).toHaveBeenCalledWith({
        event: "lead.opted_in.test",
        email: "test@example.com",
        payload: { source: "contact" },
      });
    });

    it("sends no event when the contact write fails", async () => {
      mockCreateResendContact.mockRejectedValue(new Error("socket hang up"));

      await POST(buildRequest({ ...validBody, wantsBrief: true }));

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

      await POST(buildRequest({ ...validBody, wantsBrief: true }));

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("opt-in event not sent (contact)"),
        "warning",
      );
    });
  });
});
