const mockSendEmail = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSendEmail },
  })),
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { sendConfirmationEmail } from "@/lib/confirmation-email";

const originalEnv = process.env;

// sha256("jane@example.com"), computed independently with sha256sum
const JANE_EMAIL_HASH =
  "8c87b489ce35cf2e2f39f80e282cb2e804932a56a213983eeeb428407d43b52d";

describe("sendConfirmationEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date("2026-10-17T15:00:00Z") });
    mockSendEmail.mockResolvedValue({ data: { id: "email_1" }, error: null });
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "noreply@example.test",
      RESEND_TEMPLATE_CONTACT_CONFIRMATION: "tmpl_contact",
      RESEND_TEMPLATE_ONBOARDING_CONFIRMATION: "tmpl_onboarding",
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it("sends the contact template with the first name, sender, reply-to and idempotency key", async () => {
    const result = await sendConfirmationEmail({
      formType: "contact",
      email: "jane@example.com",
      firstName: "Jane",
    });

    expect(result).toEqual({ isSent: true });
    expect(mockSendEmail).toHaveBeenCalledWith(
      {
        from: "Boximity <noreply@example.test>",
        to: "jane@example.com",
        replyTo: "hi@boximity.ca",
        template: {
          id: "tmpl_contact",
          variables: { USER_FIRST_NAME: "Jane" },
        },
      },
      {
        idempotencyKey: `followup-contact/${JANE_EMAIL_HASH}/2026-10-17`,
      },
    );
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("hashes the trimmed, lower-cased address so case and spacing share one key", async () => {
    await sendConfirmationEmail({
      formType: "onboarding",
      email: "  Jane@Example.COM ",
      firstName: "Jane",
    });

    const [payload, options] = mockSendEmail.mock.calls[0];
    expect(options.idempotencyKey).toBe(
      `followup-onboarding/${JANE_EMAIL_HASH}/2026-10-17`,
    );
    expect(options.idempotencyKey).not.toMatch(/jane|example|@/i);
    expect(payload.template.id).toBe("tmpl_onboarding");
  });

  it("dates the key by the Toronto calendar day, not UTC", async () => {
    // 02:30 UTC on the 18th is still 22:30 on the 17th in Toronto (EDT)
    jest.setSystemTime(new Date("2026-10-18T02:30:00Z"));

    await sendConfirmationEmail({
      formType: "contact",
      email: "jane@example.com",
      firstName: "Jane",
    });

    expect(mockSendEmail.mock.calls[0][1].idempotencyKey).toBe(
      `followup-contact/${JANE_EMAIL_HASH}/2026-10-17`,
    );
  });

  it.each([undefined, "", "   "])(
    "omits USER_FIRST_NAME so the template fallback applies when the first name is %p",
    async (firstName) => {
      await sendConfirmationEmail({
        formType: "contact",
        email: "jane@example.com",
        firstName,
      });

      expect(mockSendEmail.mock.calls[0][0].template).toEqual({
        id: "tmpl_contact",
        variables: {},
      });
    },
  );

  it.each([
    ["contact", "RESEND_API_KEY"],
    ["contact", "RESEND_FROM_EMAIL"],
    ["contact", "RESEND_TEMPLATE_CONTACT_CONFIRMATION"],
    ["onboarding", "RESEND_TEMPLATE_ONBOARDING_CONFIRMATION"],
  ] as const)(
    "skips the %s send with a PII-free Sentry warning when %s is unset",
    async (formType, envName) => {
      delete process.env[envName];

      const result = await sendConfirmationEmail({
        formType,
        email: "jane@example.com",
        firstName: "Jane",
      });

      expect(result).toEqual({ isSent: false });
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        `Confirmation email not sent (${formType}): ${envName} not set`,
        "warning",
      );
    },
  );

  it("reports a Resend API error by name only, without the address", async () => {
    mockSendEmail.mockResolvedValue({
      data: null,
      error: {
        name: "validation_error",
        message: "Invalid `to` field: jane@example.com",
        statusCode: 422,
      },
    });

    const result = await sendConfirmationEmail({
      formType: "contact",
      email: "jane@example.com",
      firstName: "Jane",
    });

    expect(result).toEqual({ isSent: false });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Confirmation email not sent (contact): validation_error",
      "warning",
    );
  });

  it("never throws when the SDK throws, and reports no PII", async () => {
    mockSendEmail.mockRejectedValue(
      new Error("fetch failed for jane@example.com"),
    );

    const result = await sendConfirmationEmail({
      formType: "onboarding",
      email: "jane@example.com",
      firstName: "Jane",
    });

    expect(result).toEqual({ isSent: false });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Confirmation email not sent (onboarding): exception",
      "warning",
    );
  });
});
