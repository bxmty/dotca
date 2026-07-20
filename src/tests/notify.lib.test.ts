const mockSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { sendWebmasterNotification } from "@/lib/notify";

const originalEnv = process.env;

describe("sendWebmasterNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ error: null });
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "noreply@boximity.ca",
      WEBMASTER_EMAIL: "hi@boximity.ca",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("sends a labeled notification and returns true", async () => {
    const result = await sendWebmasterNotification({
      formType: "Contact",
      submitterName: "Test User",
      fields: { Name: "Test User", Email: "test@example.com" },
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Boximity Website <noreply@boximity.ca>",
        to: "hi@boximity.ca",
        subject: "New Contact submission — Test User",
      }),
    );
    const { html, text } = mockSend.mock.calls[0][0];
    expect(html).toContain("Test User");
    expect(text).toContain("Email: test@example.com");
  });

  it("skips empty fields", async () => {
    await sendWebmasterNotification({
      formType: "Onboarding",
      submitterName: "Test User",
      fields: { Name: "Test User", Company: "" },
    });

    const { text } = mockSend.mock.calls[0][0];
    expect(text).not.toContain("Company");
  });

  it("escapes HTML in field values", async () => {
    await sendWebmasterNotification({
      formType: "Contact",
      submitterName: "Test User",
      fields: { Name: '<script>alert("x")</script>' },
    });

    const { html } = mockSend.mock.calls[0][0];
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("returns false without throwing when env is missing", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendWebmasterNotification({
      formType: "Contact",
      submitterName: "Test User",
      fields: {},
    });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns false when Resend reports an error", async () => {
    mockSend.mockResolvedValueOnce({ error: { message: "domain not found" } });

    const result = await sendWebmasterNotification({
      formType: "Paid signup",
      submitterName: "Test User",
      fields: {},
    });

    expect(result).toBe(false);
  });

  it("returns false when Resend throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("network down"));

    const result = await sendWebmasterNotification({
      formType: "Contact",
      submitterName: "Test User",
      fields: {},
    });

    expect(result).toBe(false);
  });
});
