import { POST } from "@/app/api/stripe/webhook/route";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createLead } from "@/lib/syncro";
import { sendWebmasterNotification } from "@/lib/notify";
import { sendConversionEvent } from "@/lib/ga4";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

const mockConstructEvent = jest.fn();
jest.mock("@/lib/stripe", () => ({
  getServerStripe: jest.fn().mockResolvedValue({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  }),
}));

jest.mock("@/lib/syncro", () => ({
  ...jest.requireActual("@/lib/syncro"),
  createLead: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
}));
jest.mock("@/lib/ga4", () => ({
  sendConversionEvent: jest.fn(),
}));

const mockCreateLead = createLead as jest.Mock;
// The Resend SDK is the boundary for the brief opt-in and the paid-customer
// flag (notify is mocked above, so this only stands in for the opt-in's
// contact write, the lead.opted_in event that follows it, and the contact
// lookup and update that flag a paying customer)
const mockCreateResendContact = jest.fn();
const mockSendResendEvent = jest.fn();
const mockGetResendContact = jest.fn();
const mockUpdateResendContact = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: {
      create: mockCreateResendContact,
      get: mockGetResendContact,
      update: mockUpdateResendContact,
      segments: {
        add: jest.fn().mockResolvedValue({ error: { name: "not_found" } }),
      },
      topics: { update: jest.fn() },
    },
    events: { send: mockSendResendEvent },
  })),
}));

const mockNotify = sendWebmasterNotification as jest.Mock;
const mockSendConversionEvent = sendConversionEvent as jest.Mock;

const originalEnv = process.env;

function buildRequest({
  signature = "sig_valid",
}: { signature?: string | null } = {}): Request {
  const headers = new Headers();
  if (signature) {
    headers.set("stripe-signature", signature);
  }
  return {
    headers,
    text: jest.fn().mockResolvedValue('{"raw":"body"}'),
  } as unknown as Request;
}

const paidInvoice = {
  id: "in_123",
  billing_reason: "subscription_create",
  customer_email: "test@example.com",
  customer_name: "Test User",
  customer_phone: "+11234567890",
  amount_paid: 49500,
  currency: "cad",
  parent: {
    subscription_details: {
      metadata: {
        plan: "basic",
        billing_cycle: "monthly",
        employee_count: "5",
        company: "Test Co",
      },
    },
  },
};

const paidInvoiceWithGaIds = {
  ...paidInvoice,
  parent: {
    subscription_details: {
      metadata: {
        ...paidInvoice.parent.subscription_details.metadata,
        ga_client_id: "111111111.222222222",
        ga_session_id: "333333333",
      },
    },
  },
};

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateLead.mockResolvedValue({ ok: true, leadId: 1 });
    process.env = {
      ...originalEnv,
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      RESEND_API_KEY: "re_test_key",
      RESEND_OPTIN_SEGMENT_ID: "seg_brief",
      RESEND_OPTIN_TOPIC_ID: "topic_brief",
      RESEND_OPTIN_EVENT: "lead.opted_in.test",
    };
    mockSendResendEvent.mockResolvedValue({
      data: { object: "event", event: "lead.opted_in.test" },
      error: null,
    });
    mockCreateResendContact.mockResolvedValue({
      data: { id: "contact_1" },
      error: null,
    });
    // Most payers never opted in, so by default there is no Resend contact
    mockGetResendContact.mockResolvedValue({
      data: null,
      error: {
        name: "not_found",
        message: "Contact not found",
        statusCode: 404,
      },
    });
    mockUpdateResendContact.mockResolvedValue({
      data: { id: "contact_1", object: "contact" },
      error: null,
    });
    mockNotify.mockResolvedValue(true);
    mockSendConversionEvent.mockResolvedValue(undefined);
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_succeeded",
      data: { object: paidInvoice },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 500 when the webhook secret is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    await POST(buildRequest());

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Webhook is not configured" },
      { status: 500 },
    );
  });

  it("returns 400 when the signature header is missing", async () => {
    await POST(buildRequest({ signature: null }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  });

  it("verifies the signature against the raw body", async () => {
    await POST(buildRequest({ signature: "sig_abc" }));

    expect(mockConstructEvent).toHaveBeenCalledWith(
      '{"raw":"body"}',
      "sig_abc",
      "whsec_test",
    );
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("bad signature");
    });

    await POST(buildRequest());

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Invalid signature" },
      { status: 400 },
    );
  });

  it("notifies on the first paid invoice of a new subscription", async () => {
    await POST(buildRequest());

    const [lead] = mockCreateLead.mock.calls[0];
    expect(lead).toEqual({
      formType: "Paid signup",
      name: "Test User",
      email: "test@example.com",
      phone: "+11234567890",
      company: "Test Co",
      opportunityAmountDollars: 495,
      fields: expect.objectContaining({
        Plan: "basic",
        "Billing cycle": "monthly",
        "Employee count": "5",
        "Amount paid": "$495.00 CAD",
        Invoice: "in_123",
      }),
    });
    expect(lead.fields).toEqual(mockNotify.mock.calls[0][0].fields);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        formType: "Paid signup",
        submitterName: "Test User",
        fields: expect.objectContaining({
          "Amount paid": "$495.00 CAD",
          Plan: "basic",
        }),
      }),
    );
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("sends a purchase conversion event carrying the GA identifiers, value, and currency", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_succeeded",
      data: { object: paidInvoiceWithGaIds },
    });

    await POST(buildRequest());

    expect(mockSendConversionEvent).toHaveBeenCalledWith({
      name: "purchase",
      clientId: "111111111.222222222",
      sessionId: "333333333",
      params: {
        transaction_id: "in_123",
        value: 495,
        currency: "CAD",
      },
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("still calls the conversion sender (which no-ops and logs) when GA identifiers are absent", async () => {
    await POST(buildRequest());

    expect(mockSendConversionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: undefined,
        sessionId: undefined,
      }),
    );
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("does not fail the webhook or the other side effects when the conversion event rejects", async () => {
    mockSendConversionEvent.mockRejectedValueOnce(
      new Error("MP request failed"),
    );

    await POST(buildRequest());

    expect(mockCreateLead).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("ignores renewal invoices", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_succeeded",
      data: {
        object: { ...paidInvoice, billing_reason: "subscription_cycle" },
      },
    });

    await POST(buildRequest());

    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockSendConversionEvent).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("ignores manual invoices from `stripe trigger`", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_succeeded",
      data: { object: { ...paidInvoice, billing_reason: "manual" } },
    });

    await POST(buildRequest());

    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockSendConversionEvent).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  describe("delivery matrix", () => {
    const syncroRejected = { ok: false, reason: "rejected", status: 422 };

    it("returns 200 quietly when both Syncro and the email land", async () => {
      await POST(buildRequest());

      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it("returns 200 and reports Syncro when only the email lands", async () => {
      mockCreateLead.mockResolvedValueOnce(syncroRejected);

      await POST(buildRequest());

      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Paid signup notification failure: Syncro rejected (HTTP 422), webmaster email ok (invoice in_123)",
        "error",
      );
    });

    it("returns 200 and reports the email when only Syncro lands", async () => {
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest());

      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "Paid signup notification failure: Syncro ok, webmaster email failed (invoice in_123)",
        "error",
      );
    });

    it("returns 500 so Stripe retries when neither lands", async () => {
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "unreachable",
        code: "network_error",
      });
      mockNotify.mockResolvedValueOnce(false);

      await POST(buildRequest());

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Notification delivery failed" },
        { status: 500 },
      );
    });
  });

  it("keeps customer details out of the Sentry message", async () => {
    mockCreateLead.mockResolvedValueOnce({
      ok: false,
      reason: "rejected",
      status: 422,
      message: "Email test@example.com is invalid for Test Co",
    });
    mockNotify.mockResolvedValueOnce(false);

    await POST(buildRequest());

    const [captured] = (Sentry.captureMessage as jest.Mock).mock.calls[0];
    for (const value of [
      "Test User",
      "test@example.com",
      "4567890",
      "Test Co",
    ]) {
      expect(captured).not.toContain(value);
    }
  });

  it("logs one structured line per paid signup", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    await POST(buildRequest());

    const leadLines = log.mock.calls
      .map(([line]) => String(line))
      .filter((line) => line.includes('"event":"lead_submission"'));
    expect(leadLines).toHaveLength(1);
    expect(JSON.parse(leadLines[0])).toEqual({
      event: "lead_submission",
      formType: "Paid signup",
      name: "Test User",
      company: "Test Co",
      email: "test@example.com",
      phone: "+11234567890",
      syncro: "ok",
      webmasterEmail: "ok",
    });
    log.mockRestore();
  });

  it("logs failed renewal payments to Sentry and returns 200", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "invoice.payment_failed",
      data: {
        object: { ...paidInvoice, billing_reason: "subscription_cycle" },
      },
    });

    await POST(buildRequest());

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("Invoice payment failed"),
      "warning",
    );
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("logs cancellations to Sentry and returns 200", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123" } },
    });

    await POST(buildRequest());

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Subscription cancelled: sub_123",
      "warning",
    );
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("returns 200 for unhandled event types", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.created",
      data: { object: { id: "cus_123" } },
    });

    await POST(buildRequest());

    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  describe("monthly brief opt-in", () => {
    const optedInInvoice = {
      ...paidInvoice,
      parent: {
        subscription_details: {
          metadata: {
            ...paidInvoice.parent.subscription_details.metadata,
            wants_brief: "true",
          },
        },
      },
    };

    function deliverInvoice(invoice: object) {
      mockConstructEvent.mockReturnValueOnce({
        type: "invoice.payment_succeeded",
        data: { object: invoice },
      });
      return POST(buildRequest());
    }

    it("subscribes a paid signup who ticked the box at checkout", async () => {
      await deliverInvoice(optedInInvoice);

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
      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it("makes no Resend call when the metadata carries no opt-in", async () => {
      await deliverInvoice(paidInvoice);

      expect(mockCreateResendContact).not.toHaveBeenCalled();
      expect(mockSendResendEvent).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: expect.objectContaining({ "Monthly brief": "No" }),
        }),
      );
    });

    it("makes no Resend call on a renewal invoice", async () => {
      await deliverInvoice({
        ...optedInInvoice,
        billing_reason: "subscription_cycle",
      });

      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });

    it("makes no Resend call when the invoice has no email", async () => {
      await deliverInvoice({ ...optedInInvoice, customer_email: null });

      expect(mockCreateResendContact).not.toHaveBeenCalled();
    });

    it("still returns 200, with a Sentry warning, when the Resend write fails", async () => {
      mockCreateResendContact.mockResolvedValue({
        data: null,
        error: { name: "internal_server_error", message: "x", statusCode: 500 },
      });

      await deliverInvoice(optedInInvoice);

      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("Monthly brief opt-in failed (checkout)"),
        "warning",
      );
    });

    it("sends one lead.opted_in event with source checkout", async () => {
      await deliverInvoice(optedInInvoice);

      expect(mockSendResendEvent).toHaveBeenCalledTimes(1);
      expect(mockSendResendEvent).toHaveBeenCalledWith({
        event: "lead.opted_in.test",
        email: "test@example.com",
        payload: { source: "checkout" },
      });
    });

    it("sends no event when the contact write fails", async () => {
      mockCreateResendContact.mockRejectedValue(new Error("socket hang up"));

      await deliverInvoice(optedInInvoice);

      expect(mockSendResendEvent).not.toHaveBeenCalled();
    });

    it("still returns 200, with a Sentry warning, when the event send fails", async () => {
      mockSendResendEvent.mockRejectedValue(new Error("socket hang up"));

      await deliverInvoice(optedInInvoice);

      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("opt-in event not sent (checkout)"),
        "warning",
      );
    });
  });

  describe("paid-customer flag", () => {
    function deliverInvoice(invoice: object) {
      mockConstructEvent.mockReturnValueOnce({
        type: "invoice.payment_succeeded",
        data: { object: invoice },
      });
      return POST(buildRequest());
    }

    function existingContact(properties: object = {}) {
      return {
        data: {
          object: "contact",
          id: "contact_1",
          email: "test@example.com",
          first_name: "Test",
          last_name: "User",
          created_at: "2026-10-01T00:00:00.000Z",
          unsubscribed: false,
          properties,
        },
        error: null,
      };
    }

    it("sets customer to paid on an existing Resend contact", async () => {
      mockGetResendContact.mockResolvedValue(existingContact());

      await deliverInvoice(paidInvoice);

      expect(mockGetResendContact).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(mockUpdateResendContact).toHaveBeenCalledTimes(1);
      expect(mockUpdateResendContact).toHaveBeenCalledWith({
        email: "test@example.com",
        properties: { customer: "paid" },
      });
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it("makes no update and no create when the payer is not a Resend contact", async () => {
      await deliverInvoice(paidInvoice);

      expect(mockGetResendContact).toHaveBeenCalledTimes(1);
      expect(mockUpdateResendContact).not.toHaveBeenCalled();
      expect(mockCreateResendContact).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it("flags the payer on a renewal invoice too", async () => {
      mockGetResendContact.mockResolvedValue(existingContact());

      await deliverInvoice({
        ...paidInvoice,
        billing_reason: "subscription_cycle",
      });

      expect(mockUpdateResendContact).toHaveBeenCalledWith({
        email: "test@example.com",
        properties: { customer: "paid" },
      });
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("makes no Resend call when the invoice has no email", async () => {
      await deliverInvoice({ ...paidInvoice, customer_email: null });

      expect(mockGetResendContact).not.toHaveBeenCalled();
      expect(mockUpdateResendContact).not.toHaveBeenCalled();
    });

    it("flags a contact the checkout opt-in has just created", async () => {
      const calls: string[] = [];
      mockCreateResendContact.mockImplementation(async () => {
        calls.push("create");
        return { data: { id: "contact_1" }, error: null };
      });
      mockGetResendContact.mockImplementation(async () => {
        calls.push("get");
        return existingContact();
      });

      await deliverInvoice({
        ...paidInvoice,
        parent: {
          subscription_details: {
            metadata: {
              ...paidInvoice.parent.subscription_details.metadata,
              wants_brief: "true",
            },
          },
        },
      });

      expect(calls).toEqual(["create", "get"]);
      expect(mockUpdateResendContact).toHaveBeenCalledTimes(1);
    });

    it("reports a failed lookup as a PII-free Sentry warning and still returns 200", async () => {
      mockGetResendContact.mockResolvedValue({
        data: null,
        error: {
          name: "internal_server_error",
          message: "test@example.com lookup failed",
          statusCode: 500,
        },
      });

      await deliverInvoice(paidInvoice);

      expect(mockUpdateResendContact).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      const [detail, level] = (Sentry.captureMessage as jest.Mock).mock
        .calls[0];
      expect(level).toBe("warning");
      expect(detail).toContain("Paid-customer flag");
      expect(detail).toContain("internal_server_error");
      expect(detail).not.toContain("test@example.com");
      expect(detail).not.toContain("Test User");
      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it("reports a thrown lookup as a Sentry warning and still returns 200", async () => {
      mockGetResendContact.mockRejectedValue(
        new Error("fetch failed for test@example.com"),
      );

      await deliverInvoice(paidInvoice);

      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      const [detail, level] = (Sentry.captureMessage as jest.Mock).mock
        .calls[0];
      expect(level).toBe("warning");
      expect(detail).not.toContain("test@example.com");
      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it("reports a failed update as a Sentry warning and still returns 200", async () => {
      mockGetResendContact.mockResolvedValue(existingContact());
      mockUpdateResendContact.mockResolvedValue({
        data: null,
        error: {
          name: "validation_error",
          message: "Property customer does not exist",
          statusCode: 422,
        },
      });

      await deliverInvoice(paidInvoice);

      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("update validation_error"),
        "warning",
      );
      expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it("does not turn a total delivery failure into a 200", async () => {
      mockGetResendContact.mockResolvedValue(existingContact());
      mockCreateLead.mockResolvedValueOnce({
        ok: false,
        reason: "unreachable",
        code: "server_error",
        status: 500,
      });
      mockNotify.mockResolvedValueOnce(false);

      await deliverInvoice(paidInvoice);

      expect(mockUpdateResendContact).toHaveBeenCalledTimes(1);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Notification delivery failed" },
        { status: 500 },
      );
    });
  });
});
