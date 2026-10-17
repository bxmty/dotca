const mockCreateContact = jest.fn();
const mockAddContactSegment = jest.fn();
const mockUpdateContactTopics = jest.fn();
const mockSendEvent = jest.fn();
const mockGetContact = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: {
      create: mockCreateContact,
      get: mockGetContact,
      segments: { add: mockAddContactSegment },
      topics: { update: mockUpdateContactTopics },
    },
    events: { send: mockSendEvent },
  })),
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { subscribeToMonthlyBrief } from "@/lib/resend-optin";

const originalEnv = process.env;

const subscriber = {
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  source: "contact" as const,
};

function resendError(name: string, statusCode = 422) {
  return { data: null, error: { name, message: "boom", statusCode } };
}

const existingContact = {
  data: { id: "contact_123", object: "contact", email: "jane@example.com" },
  error: null,
};

describe("subscribeToMonthlyBrief", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateContact.mockResolvedValue({
      data: { id: "contact_123", object: "contact" },
      error: null,
    });
    mockAddContactSegment.mockResolvedValue({
      data: { id: "seg_brief" },
      error: null,
    });
    mockUpdateContactTopics.mockResolvedValue({
      data: { id: "contact_123" },
      error: null,
    });
    mockGetContact.mockResolvedValue(resendError("not_found", 404));
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      RESEND_OPTIN_SEGMENT_ID: "seg_brief",
      RESEND_OPTIN_TOPIC_ID: "topic_brief",
      RESEND_OPTIN_EVENT: "lead.opted_in.test",
    };
    mockSendEvent.mockResolvedValue({
      data: { object: "event", event: "lead.opted_in.test" },
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates the contact in the brief segment, opted in to the brief topic", async () => {
    const result = await subscribeToMonthlyBrief(subscriber);

    expect(result).toEqual({ isSubscribed: true });
    expect(mockCreateContact).toHaveBeenCalledWith({
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
      segments: [{ id: "seg_brief" }],
      topics: [{ id: "topic_brief", subscription: "opt_in" }],
    });
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("writes the trimmed, lower-cased address so case and spacing share one contact", async () => {
    await subscribeToMonthlyBrief({
      ...subscriber,
      email: "  Jane@Example.COM ",
    });

    expect(mockCreateContact.mock.calls[0][0].email).toBe("jane@example.com");
    expect(mockSendEvent.mock.calls[0][0].email).toBe("jane@example.com");
  });

  it("re-subscribes the existing contact under the lower-cased address", async () => {
    mockCreateContact.mockResolvedValue(resendError("validation_error", 409));
    mockGetContact.mockResolvedValue(existingContact);

    await subscribeToMonthlyBrief({ ...subscriber, email: "Jane@Example.com" });

    expect(mockGetContact).toHaveBeenCalledWith({ email: "jane@example.com" });
    expect(mockAddContactSegment.mock.calls[0][0].email).toBe(
      "jane@example.com",
    );
    expect(mockUpdateContactTopics.mock.calls[0][0].email).toBe(
      "jane@example.com",
    );
  });

  it("reports a refused create as itself when the address is not a contact", async () => {
    mockCreateContact.mockResolvedValue(
      resendError("rate_limit_exceeded", 429),
    );

    const result = await subscribeToMonthlyBrief(subscriber);

    expect(result).toEqual({ isSubscribed: false });
    expect(mockAddContactSegment).not.toHaveBeenCalled();
    expect(mockUpdateContactTopics).not.toHaveBeenCalled();
    expect(mockSendEvent).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Monthly brief opt-in failed (contact): create rate_limit_exceeded",
      "warning",
    );
  });

  it("reports the create error, not an update, when the lookup also fails", async () => {
    mockCreateContact.mockResolvedValue(
      resendError("internal_server_error", 500),
    );
    mockGetContact.mockRejectedValue(new Error("down for jane@example.com"));

    const result = await subscribeToMonthlyBrief(subscriber);

    expect(result).toEqual({ isSubscribed: false });
    expect(mockAddContactSegment).not.toHaveBeenCalled();
    const [detail] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(detail).toContain("create internal_server_error");
    expect(detail).not.toContain("existing-contact");
    expect(detail).not.toContain("jane");
  });

  it("reports a Resend failure as a PII-free Sentry warning, without throwing", async () => {
    mockCreateContact.mockResolvedValue(resendError("invalid_api_key", 403));
    mockAddContactSegment.mockResolvedValue(
      resendError("invalid_api_key", 403),
    );

    const result = await subscribeToMonthlyBrief(subscriber);

    expect(result).toEqual({ isSubscribed: false });
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    const [detail, level] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(level).toBe("warning");
    expect(detail).toContain("contact");
    expect(detail).toContain("invalid_api_key");
    expect(detail).not.toContain("jane@example.com");
    expect(detail).not.toContain("Jane");
  });

  it("reports a thrown SDK error as a Sentry warning, without throwing", async () => {
    mockCreateContact.mockRejectedValue(new Error("network down for jane@"));
    mockAddContactSegment.mockRejectedValue(new Error("network down"));

    const result = await subscribeToMonthlyBrief(subscriber);

    expect(result).toEqual({ isSubscribed: false });
    const [detail, level] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(level).toBe("warning");
    expect(detail).not.toContain("jane");
  });

  it("re-subscribes an existing contact when the create is refused", async () => {
    mockCreateContact.mockResolvedValue(resendError("validation_error", 409));
    mockGetContact.mockResolvedValue(existingContact);

    const result = await subscribeToMonthlyBrief(subscriber);

    expect(result).toEqual({ isSubscribed: true });
    expect(mockAddContactSegment).toHaveBeenCalledWith({
      email: "jane@example.com",
      segmentId: "seg_brief",
    });
    expect(mockUpdateContactTopics).toHaveBeenCalledWith({
      email: "jane@example.com",
      topics: [{ id: "topic_brief", subscription: "opt_in" }],
    });
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("fails when the existing contact's topic update fails", async () => {
    mockCreateContact.mockResolvedValue(resendError("validation_error", 409));
    mockGetContact.mockResolvedValue(existingContact);
    mockUpdateContactTopics.mockResolvedValue(
      resendError("rate_limit_exceeded", 429),
    );

    const result = await subscribeToMonthlyBrief(subscriber);

    expect(result).toEqual({ isSubscribed: false });
    const [detail, level] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(level).toBe("warning");
    expect(detail).toContain("rate_limit_exceeded");
  });

  it.each([
    "RESEND_API_KEY",
    "RESEND_OPTIN_SEGMENT_ID",
    "RESEND_OPTIN_TOPIC_ID",
  ])("skips Resend and warns Sentry when %s is not set", async (name) => {
    delete process.env[name];

    const result = await subscribeToMonthlyBrief({
      ...subscriber,
      source: "onboarding",
    });

    expect(result).toEqual({ isSubscribed: false });
    expect(mockCreateContact).not.toHaveBeenCalled();
    const [detail, level] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    expect(level).toBe("warning");
    expect(detail).toContain(name);
    expect(detail).toContain("onboarding");
  });

  describe("lead.opted_in event (#647)", () => {
    it("sends one event, named from the environment, once the contact lands", async () => {
      await subscribeToMonthlyBrief({ ...subscriber, source: "onboarding" });

      expect(mockSendEvent).toHaveBeenCalledTimes(1);
      expect(mockSendEvent).toHaveBeenCalledWith({
        event: "lead.opted_in.test",
        email: "jane@example.com",
        payload: { source: "onboarding" },
      });
    });

    it("sends the event when an existing contact is re-subscribed", async () => {
      mockCreateContact.mockResolvedValue(resendError("validation_error", 409));
      mockGetContact.mockResolvedValue(existingContact);

      await subscribeToMonthlyBrief(subscriber);

      expect(mockSendEvent).toHaveBeenCalledTimes(1);
      expect(mockSendEvent).toHaveBeenCalledWith({
        event: "lead.opted_in.test",
        email: "jane@example.com",
        payload: { source: "contact" },
      });
    });

    it("sends no event when the contact write fails", async () => {
      mockCreateContact.mockResolvedValue(resendError("invalid_api_key", 403));
      mockAddContactSegment.mockResolvedValue(
        resendError("invalid_api_key", 403),
      );

      await subscribeToMonthlyBrief(subscriber);

      expect(mockSendEvent).not.toHaveBeenCalled();
    });

    it("sends no event when the opt-in env is incomplete", async () => {
      delete process.env.RESEND_OPTIN_SEGMENT_ID;

      await subscribeToMonthlyBrief(subscriber);

      expect(mockSendEvent).not.toHaveBeenCalled();
    });

    it.each([
      [
        "returns an error",
        () =>
          mockSendEvent.mockResolvedValue(
            resendError("rate_limit_exceeded", 429),
          ),
      ],
      [
        "throws",
        () =>
          mockSendEvent.mockRejectedValue(
            new Error("down for jane@example.com"),
          ),
      ],
    ])(
      "keeps the subscription and warns Sentry without PII when the event send %s",
      async (_label, arrangeFailure) => {
        arrangeFailure();

        const result = await subscribeToMonthlyBrief({
          ...subscriber,
          source: "checkout",
        });

        expect(result).toEqual({ isSubscribed: true });
        expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
        const [detail, level] = (Sentry.captureMessage as jest.Mock).mock
          .calls[0];
        expect(level).toBe("warning");
        expect(detail).toContain("lead.opted_in");
        expect(detail).toContain("checkout");
        expect(detail).not.toContain("jane");
        expect(detail).not.toContain("Jane");
      },
    );

    it("keeps the subscription, sends no event and warns Sentry when RESEND_OPTIN_EVENT is not set", async () => {
      delete process.env.RESEND_OPTIN_EVENT;

      const result = await subscribeToMonthlyBrief(subscriber);

      expect(result).toEqual({ isSubscribed: true });
      expect(mockCreateContact).toHaveBeenCalledTimes(1);
      expect(mockSendEvent).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      const [detail, level] = (Sentry.captureMessage as jest.Mock).mock
        .calls[0];
      expect(level).toBe("warning");
      expect(detail).toContain("RESEND_OPTIN_EVENT");
    });
  });
});
