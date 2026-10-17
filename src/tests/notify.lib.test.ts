const mockSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import {
  sendLeadMagnetDeliveryEmail,
  sendWebmasterNotification,
} from "@/lib/notify";

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

describe("sendLeadMagnetDeliveryEmail", () => {
  const delivery = {
    to: "jane.doe@example.com",
    downloadUrl:
      "https://boximity.ca/api/lead-magnet/download?slug=test-guide&token=abc",
    title: "The Test Guide",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ error: null });
    jest.spyOn(console, "error").mockImplementation(() => {});
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "noreply@boximity.ca",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("emails the submitter the download link and returns true", async () => {
    const result = await sendLeadMagnetDeliveryEmail(delivery);

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Boximity <noreply@boximity.ca>",
        to: "jane.doe@example.com",
        subject: "Your download: The Test Guide",
      }),
    );
    const { html, text } = mockSend.mock.calls[0][0];
    expect(text).toContain(delivery.downloadUrl);
    expect(html).toContain(
      'href="https://boximity.ca/api/lead-magnet/download?slug=test-guide&amp;token=abc"',
    );
    expect(text).toMatch(/24 hours/);
  });

  it("escapes HTML in the title", async () => {
    await sendLeadMagnetDeliveryEmail({
      ...delivery,
      title: "<script>alert(1)</script>",
    });

    const { html } = mockSend.mock.calls[0][0];
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("returns false without sending when env is missing", async () => {
    delete process.env.RESEND_FROM_EMAIL;

    await expect(sendLeadMagnetDeliveryEmail(delivery)).resolves.toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns false when Resend reports an error", async () => {
    mockSend.mockResolvedValueOnce({ error: { message: "domain not found" } });

    await expect(sendLeadMagnetDeliveryEmail(delivery)).resolves.toBe(false);
  });

  it("does not propagate a Resend failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("network down"));

    await expect(sendLeadMagnetDeliveryEmail(delivery)).resolves.toBe(false);
  });
});
