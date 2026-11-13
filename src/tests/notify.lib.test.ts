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

  it("sends a service request under its own form type", async () => {
    await sendWebmasterNotification({
      formType: "Service request",
      submitterName: "Dana Office",
      fields: { Request: "Leaver" },
    });

    expect(mockSend.mock.calls[0][0].subject).toBe(
      "New Service request submission — Dana Office",
    );
  });

  it("flags an unverified authorization at the front of the subject line", async () => {
    await sendWebmasterNotification({
      formType: "Service request",
      submitterName: "Dana Office",
      fields: { Request: "Leaver" },
      isAuthorizationUnverified: true,
    });

    expect(mockSend.mock.calls[0][0].subject).toBe(
      "[AUTHORIZATION UNVERIFIED] New Service request submission — Dana Office",
    );
  });

  it("does not flag a submission whose authorization was verified", async () => {
    await sendWebmasterNotification({
      formType: "Service request",
      submitterName: "Dana Office",
      fields: { Request: "Leaver" },
      isAuthorizationUnverified: false,
    });

    expect(mockSend.mock.calls[0][0].subject).toBe(
      "New Service request submission — Dana Office",
    );
  });

  it("lays the fields out as text lines and an HTML table", async () => {
    await sendWebmasterNotification({
      formType: "Contact",
      submitterName: "Test User",
      fields: { Name: "Test User", Email: "test@example.com", Company: "" },
    });

    const { html, text } = mockSend.mock.calls[0][0];
    expect(text).toBe("Name: Test User\nEmail: test@example.com");
    expect(html).toBe(
      [
        "<h2>New Contact submission</h2>",
        '<table cellpadding="6" style="border-collapse:collapse">',
        '<tr><td style="border:1px solid #ddd"><strong>Name</strong></td><td style="border:1px solid #ddd">Test User</td></tr>',
        '<tr><td style="border:1px solid #ddd"><strong>Email</strong></td><td style="border:1px solid #ddd">test@example.com</td></tr>',
        "</table>",
      ].join("\n"),
    );
  });

  it("escapes quotes and ampersands in labels and values", async () => {
    await sendWebmasterNotification({
      formType: "Contact",
      submitterName: "Test User",
      fields: { 'Q&A "notes"': 'said "hi" & left' },
    });

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain(
      "<strong>Q&amp;A &quot;notes&quot;</strong></td>" +
        '<td style="border:1px solid #ddd">said &quot;hi&quot; &amp; left</td>',
    );
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

  it("writes the download link into the text and HTML bodies", async () => {
    await sendLeadMagnetDeliveryEmail(delivery);

    const { html, text } = mockSend.mock.calls[0][0];
    expect(text).toBe(
      [
        "Here's your copy of The Test Guide:",
        "",
        "https://boximity.ca/api/lead-magnet/download?slug=test-guide&token=abc",
        "",
        "The link works for 24 hours. If it has expired, enter your email on the guide's page again and we'll send a fresh one.",
        "",
        "— Boximity",
      ].join("\n"),
    );
    expect(html).toBe(
      [
        "<p>Here's your copy of <strong>The Test Guide</strong>:</p>",
        '<p><a href="https://boximity.ca/api/lead-magnet/download?slug=test-guide&amp;token=abc">Download The Test Guide</a></p>',
        "<p>The link works for 24 hours. If it has expired, enter your email on the guide's page again and we'll send a fresh one.</p>",
        "<p>— Boximity</p>",
      ].join("\n"),
    );
  });

  it("keeps a quote in the title or URL from breaking out of the href", async () => {
    await sendLeadMagnetDeliveryEmail({
      ...delivery,
      title: 'The "Test" Guide',
      downloadUrl: 'https://boximity.ca/x?a="onclick="alert(1)',
    });

    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain(
      '<a href="https://boximity.ca/x?a=&quot;onclick=&quot;alert(1)">Download The &quot;Test&quot; Guide</a>',
    );
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
