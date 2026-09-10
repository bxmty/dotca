// tests/api-onboarding.test.ts
import { POST } from "@/app/api/onboarding/route";
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
    mockBrevo.mockResolvedValue({ ok: true });
    mockNotify.mockResolvedValue(true);
    mockSendConversionEvent.mockResolvedValue(undefined);
  });

  it("persists the lead to Brevo list 10 and emails the webmaster", async () => {
    await POST(buildRequest(validOnboardingData));

    expect(mockBrevo).toHaveBeenCalledWith({
      listId: 10,
      email: "test@example.com",
      smsPhone: "+11234567890",
      attributes: expect.objectContaining({
        FULLNAME: "Test User",
        COMPANY: "Test Company",
        INDUSTRY: "Technology",
        EMPLOYEE_COUNT: "11-25",
        ZIP: "12345",
      }),
    });
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
    expect(mockBrevo).not.toHaveBeenCalled();
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

  it("succeeds when Brevo fails but the webmaster email lands", async () => {
    mockBrevo.mockResolvedValueOnce({ ok: false, status: 500 });

    await POST(buildRequest(validOnboardingData));

    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Onboarding data received successfully",
    });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("Brevo failed"),
      "error",
    );
  });

  it("returns 503 with direct contact info when both channels fail", async () => {
    mockBrevo.mockResolvedValueOnce({ ok: false, code: "unauthorized" });
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
  });

  it("silently accepts honeypot submissions without sending anything", async () => {
    await POST(
      buildRequest({ ...validOnboardingData, website: "https://spam.example" }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    expect(mockBrevo).not.toHaveBeenCalled();
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
    expect(mockBrevo).toHaveBeenCalledTimes(5);
  });
});
