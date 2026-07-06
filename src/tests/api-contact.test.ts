// tests/api-contact.test.ts
import { POST } from "@/app/api/contact/route";
import { NextResponse } from "next/server";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// Mock environment variable
const originalEnv = process.env;

describe("Contact API Route", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock fetch globally
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    ) as jest.Mock;

    // Setup process.env with all required variables
    process.env = {
      ...originalEnv,
      BREVO_API_KEY: "test-api-key",
      NEXT_PUBLIC_BREVO_API_KEY: "public-test-api-key",
      NODE_ENV: "test",
    };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("returns 400 if email is missing", async () => {
    // Create a mock request with missing email
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        phone: "123-456-7890",
        // email is intentionally missing
      }),
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 400
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Email is required" },
      { status: 400 },
    );
  });

  it("returns 500 if all API keys are missing", async () => {
    // Remove all API keys from environment
    delete process.env.BREVO_API_KEY;
    delete process.env.NEXT_PUBLIC_BREVO_API_KEY;

    // Create a mock request
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
      }),
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 500
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Server configuration error - missing API key" },
      { status: 500 },
    );
  });

  it("never falls back to the public API key", async () => {
    // Remove the main API key but keep the public one — the public key is
    // never a valid substitute, even in development
    delete process.env.BREVO_API_KEY;
    process.env.NODE_ENV = "development";

    // Create a mock request
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
      }),
    };

    await POST(request as unknown as Request);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Server configuration error - missing API key" },
      { status: 500 },
    );
  });

  it("returns 400 if phone is not a string", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: 1234567890,
      }),
    };

    await POST(request as unknown as Request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Field "phone" must be a string' },
      { status: 400 },
    );
  });

  it("successfully submits contact and returns success response", async () => {
    // Create a mock request with all required fields
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
      }),
    };

    await POST(request as unknown as Request);

    // Check if fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/contacts",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": "test-api-key",
        },
        body: JSON.stringify({
          email: "test@example.com",
          attributes: {
            FULLNAME: "Test User",
            FIRSTNAME: "Test",
            LASTNAME: "User",
            PHONE: "123-456-7890",
            COMPANY: "",
            ADDRESS: "",
            CITY: "",
            STATE: "",
            ZIP: "",
            PLAN_NAME: "",
            BILLING_CYCLE: "",
            EMPLOYEE_COUNT: "",
            IS_WAITLIST: "No",
            SMS: "+11234567890",
          },
          listIds: [9],
          smtpBlacklistSender: undefined,
          sms: {
            SMS: "+11234567890",
          },
          updateEnabled: true,
        }),
      },
    );

    // Check if NextResponse.json was called with success message
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("handles API errors properly", async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: "API error message",
            code: "api_error",
          }),
      }),
    );

    // Create a mock request
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
      }),
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 500
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Failed to process contact form" },
      { status: 500 },
    );
  });

  it("handles duplicate contact submissions gracefully", async () => {
    // Mock fetch to return a duplicate parameter error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            code: "duplicate_parameter",
            message: "Contact already exists",
          }),
      }),
    );

    // Create a mock request
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
      }),
    };

    await POST(request as unknown as Request);

    // Should return success with a message indicating the contact already exists
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message:
        "Your information has already been submitted. We will contact you soon.",
    });
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    // Mock request.json to throw an error
    const request = {
      json: jest.fn().mockRejectedValueOnce(new Error("JSON parsing error")),
    };

    await POST(request as unknown as Request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  });

  it("returns 500 when the Brevo request fails unexpectedly", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("network error"),
    );

    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
      }),
    };

    await POST(request as unknown as Request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Failed to process contact form" },
      { status: 500 },
    );
  });

  it("returns 500 when Brevo returns an unrecognized error", async () => {
    // A response that is not JSON must still surface as a 500, and the
    // error path must not swallow the thrown error into a relabeled one
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error("not JSON")),
      }),
    );

    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
      }),
    };

    await POST(request as unknown as Request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Failed to process contact form" },
      { status: 500 },
    );
  });
});
