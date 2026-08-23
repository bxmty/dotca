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
    process.env = { ...originalEnv, STRIPE_WEBHOOK_SECRET: "whsec_test" };
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
    mockSendConversionEvent.mockRejectedValueOnce(new Error("MP request failed"));

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
});
