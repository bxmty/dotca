const mockGetContact = jest.fn();
const mockUpdateContact = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: { get: mockGetContact, update: mockUpdateContact },
  })),
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { markContactAsPaid } from "@/lib/paid-customer-flag";

const originalEnv = process.env;

function resendError(name: string, statusCode = 422) {
  return { data: null, error: { name, message: "boom", statusCode } };
}

const existingContact = {
  data: { id: "contact_123", object: "contact", email: "jane@example.com" },
  error: null,
};

describe("markContactAsPaid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, RESEND_API_KEY: "re_test_key" };
    mockUpdateContact.mockResolvedValue({
      data: { id: "contact_123", object: "contact" },
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("treats a 404 lookup as no contact, even without the not_found name", async () => {
    mockGetContact.mockResolvedValue(resendError("application_error", 404));

    await markContactAsPaid({ email: "jane@example.com" });

    expect(mockUpdateContact).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("treats a not_found lookup as no contact, even without a 404 status", async () => {
    mockGetContact.mockResolvedValue(resendError("not_found", 400));

    await markContactAsPaid({ email: "jane@example.com" });

    expect(mockUpdateContact).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("reports any other lookup error by its name", async () => {
    mockGetContact.mockResolvedValue(resendError("rate_limit_exceeded", 429));

    await markContactAsPaid({ email: "jane@example.com" });

    expect(mockUpdateContact).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Paid-customer flag not set in Resend: lookup rate_limit_exceeded",
      "warning",
    );
  });

  it("reports a lookup that throws as an exception, without the error text", async () => {
    mockGetContact.mockRejectedValue(new Error("jane@example.com timed out"));

    await markContactAsPaid({ email: "jane@example.com" });

    expect(mockUpdateContact).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Paid-customer flag not set in Resend: lookup exception",
      "warning",
    );
  });

  it("looks up and flags the trimmed, lower-cased address", async () => {
    mockGetContact.mockResolvedValue(existingContact);

    await markContactAsPaid({ email: " Jane@Example.COM" });

    expect(mockGetContact).toHaveBeenCalledWith({ email: "jane@example.com" });
    expect(mockUpdateContact).toHaveBeenCalledWith({
      email: "jane@example.com",
      properties: { customer: "paid" },
    });
  });

  it("reports a missing API key as a Sentry warning, with no Resend call", async () => {
    delete process.env.RESEND_API_KEY;

    await markContactAsPaid({ email: "jane@example.com" });

    expect(mockGetContact).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Paid-customer flag not set in Resend: RESEND_API_KEY not set",
      "warning",
    );
  });
});
