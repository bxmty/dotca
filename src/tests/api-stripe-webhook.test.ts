import { POST } from "@/app/api/stripe/webhook/route";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { addBrevoContact } from "@/lib/brevo";
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

jest.mock("@/lib/brevo", () => ({
  addBrevoContact: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
}));
jest.mock("@/lib/ga4", () => ({
  sendConversionEvent: jest.fn(),
}));

// The Resend SDK is the boundary for the brief opt-in (notify is mocked
// above, so this only stands in for the opt-in's contact write and the
// lead.opted_in event that follows it)
const mockCreateResendContact = jest.fn();
const mockSendResendEvent = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: {
      create: mockCreateResendContact,
      segments: {
        add: jest.fn().mockResolvedValue({ error: { name: "not_found" } }),
      },
      topics: { update: jest.fn() },
    },
    events: { send: mockSendResendEvent },
  })),
}));

const mockBrevo = addBrevoContact as jest.Mock;
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
    mockBrevo.mockResolvedValue({ ok: true });
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

    expect(mockBrevo).toHaveBeenCalledWith({
      listId: 9,
      email: "test@example.com",
      attributes: expect.objectContaining({
        FULLNAME: "Test User",
        PLAN_NAME: "basic",
        BILLING_CYCLE: "monthly",
        EMPLOYEE_COUNT: "5",
      }),
    });
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

    expect(mockBrevo).toHaveBeenCalled();
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

    expect(mockBrevo).not.toHaveBeenCalled();
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

    expect(mockBrevo).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
    expect(mockSendConversionEvent).not.toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("still returns 200 and reports to Sentry on partial delivery failure", async () => {
    mockBrevo.mockResolvedValueOnce({ ok: false, status: 500 });

    await POST(buildRequest());

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("Paid signup notification failure"),
      "error",
    );
    expect(NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it("returns 500 so Stripe retries when both channels fail", async () => {
    mockBrevo.mockResolvedValueOnce({ ok: false, status: 500 });
    mockNotify.mockResolvedValueOnce(false);

    await POST(buildRequest());

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Notification delivery failed" },
      { status: 500 },
    );
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

    expect(mockBrevo).not.toHaveBeenCalled();
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
});
