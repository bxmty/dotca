// tests/api-contact.test.ts
import { POST } from "@/app/api/contact/route";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { addBrevoContact } from "@/lib/brevo";
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
jest.mock("@/lib/brevo", () => ({
  ...jest.requireActual("@/lib/brevo"),
  addBrevoContact: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
}));
// Keep the real cookie parser; only the network-calling sender is mocked
jest.mock("@/lib/ga4", () => ({
  ...jest.requireActual("@/lib/ga4"),
  sendConversionEvent: jest.fn(),
}));

const mockBrevo = addBrevoContact as jest.Mock;
const mockNotify = sendWebmasterNotification as jest.Mock;
const mockSendConversionEvent = sendConversionEvent as jest.Mock;

function buildRequest(body: unknown, headers?: Record<string, string>): Request {
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
    mockBrevo.mockResolvedValue({ ok: true });
    mockNotify.mockResolvedValue(true);
    mockSendConversionEvent.mockResolvedValue(undefined);
  });

  it("returns 400 if email is missing", async () => {
    await POST(buildRequest({ name: "Test User", phone: "123-456-7890" }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Email is required" },
      { status: 400 },
    );
    expect(mockBrevo).not.toHaveBeenCalled();
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
    expect(mockBrevo).not.toHaveBeenCalled();
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

  it("writes the lead to Brevo list 9 and emails the webmaster", async () => {
    await POST(buildRequest(validBody));

    expect(mockBrevo).toHaveBeenCalledWith({
      listId: 9,
      email: "test@example.com",
      smsPhone: "+11234567890",
      attributes: expect.objectContaining({
        FULLNAME: "Test User",
        FIRSTNAME: "Test",
        LASTNAME: "User",
        PHONE: "123-456-7890",
      }),
    });
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
    mockSendConversionEvent.mockRejectedValueOnce(new Error("MP request failed"));

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("sends no conversion event when validation fails", async () => {
    await POST(buildRequest({ name: "Test User", phone: "123-456-7890" }));

    expect(mockSendConversionEvent).not.toHaveBeenCalled();
  });

  it("does not send an IS_WAITLIST attribute", async () => {
    await POST(buildRequest(validBody));

    const { attributes } = mockBrevo.mock.calls[0][0];
    expect(attributes.IS_WAITLIST).toBeUndefined();
  });

  it("succeeds when Brevo fails but the webmaster email lands", async () => {
    mockBrevo.mockResolvedValueOnce({ ok: false, status: 500 });

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("Brevo failed"),
      "error",
    );
  });

  it("succeeds when the webmaster email fails but Brevo lands", async () => {
    mockNotify.mockResolvedValueOnce(false);

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("webmaster email failed"),
      "error",
    );
  });

  it("returns 503 with direct contact info when both channels fail", async () => {
    mockBrevo.mockResolvedValueOnce({ ok: false, code: "unauthorized" });
    mockNotify.mockResolvedValueOnce(false);

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        error:
          "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      },
      { status: 503 },
    );
  });

  it("handles duplicate contact submissions gracefully", async () => {
    mockBrevo.mockResolvedValueOnce({
      ok: false,
      status: 400,
      code: "duplicate_parameter",
      message: "Contact already exists",
    });

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message:
        "Your information has already been submitted. We will contact you soon.",
    });
  });

  it("returns 400 when Brevo rejects the phone number", async () => {
    mockBrevo.mockResolvedValueOnce({
      ok: false,
      status: 400,
      code: "invalid_parameter",
      message: "Invalid phone number",
    });

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        error:
          "The provided phone number format is not valid. Please use a standard format like +1XXXXXXXXXX.",
      },
      { status: 400 },
    );
  });

  it("silently accepts honeypot submissions without sending anything", async () => {
    await POST(buildRequest({ ...validBody, website: "https://spam.example" }));

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    expect(mockBrevo).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockSendConversionEvent).not.toHaveBeenCalled();
  });

  it("rate limits the sixth submission from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(buildRequest(validBody));
    }
    expect(mockBrevo).toHaveBeenCalledTimes(5);

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenLastCalledWith(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
    expect(mockBrevo).toHaveBeenCalledTimes(5);
  });
});
