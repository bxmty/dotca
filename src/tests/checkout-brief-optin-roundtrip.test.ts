// The checkout opt-in can only reach the webhook through Stripe metadata:
// create-subscription writes it onto the subscription, and Stripe hands it
// back on the paid invoice (parent.subscription_details.metadata). This runs
// both routes back to back, feeding the metadata the first one wrote into
// the invoice the second one receives.
import { POST as createSubscription } from "@/app/api/stripe/create-subscription/route";
import { POST as receiveWebhook } from "@/app/api/stripe/webhook/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
}));

const mockSubscriptionsCreate = jest.fn();
const mockConstructEvent = jest.fn();
jest.mock("@/lib/stripe", () => ({
  getServerStripe: jest.fn().mockResolvedValue({
    customers: { create: jest.fn().mockResolvedValue({ id: "cus_123" }) },
    subscriptions: {
      create: (...args: unknown[]) => mockSubscriptionsCreate(...args),
    },
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  }),
  resolvePriceId: jest.fn().mockResolvedValue("price_123"),
  MissingStripePriceError: class extends Error {},
}));

jest.mock("@/lib/brevo", () => ({
  addBrevoContact: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/ga4", () => ({
  sendConversionEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockCreateResendContact = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    contacts: { create: mockCreateResendContact },
  })),
}));

const originalEnv = process.env;

function buildJsonRequest(body: unknown): Request {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as Request;
}

function buildWebhookRequest(): Request {
  return {
    headers: new Headers({ "stripe-signature": "sig_valid" }),
    text: jest.fn().mockResolvedValue("{}"),
  } as unknown as Request;
}

async function checkOutAndPay(wantsBrief: boolean): Promise<void> {
  await createSubscription(
    buildJsonRequest({
      plan: "Basic",
      employeeCount: 5,
      billingCycle: "monthly",
      customer: { name: "Pat Lee", email: "pat@example.com" },
      wantsBrief,
    }),
  );
  const [{ metadata }] = mockSubscriptionsCreate.mock.calls[0];

  mockConstructEvent.mockReturnValue({
    type: "invoice.payment_succeeded",
    data: {
      object: {
        id: "in_123",
        billing_reason: "subscription_create",
        customer_email: "pat@example.com",
        customer_name: "Pat Lee",
        amount_paid: 49500,
        currency: "cad",
        parent: { subscription_details: { metadata } },
      },
    },
  });
  await receiveWebhook(buildWebhookRequest());
}

describe("checkout brief opt-in through Stripe metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      RESEND_API_KEY: "re_test_key",
      RESEND_OPTIN_SEGMENT_ID: "seg_brief",
      RESEND_OPTIN_TOPIC_ID: "topic_brief",
    };
    mockSubscriptionsCreate.mockResolvedValue({
      id: "sub_123",
      latest_invoice: { confirmation_secret: { client_secret: "cs_123" } },
    });
    mockCreateResendContact.mockResolvedValue({
      data: { id: "contact_1" },
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("subscribes the payer when the box was ticked at checkout", async () => {
    await checkOutAndPay(true);

    expect(mockCreateResendContact).toHaveBeenCalledTimes(1);
    expect(mockCreateResendContact).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "pat@example.com",
        segments: [{ id: "seg_brief" }],
        topics: [{ id: "topic_brief", subscription: "opt_in" }],
      }),
    );
  });

  it("makes no Resend call when the box was left unticked", async () => {
    await checkOutAndPay(false);

    expect(mockCreateResendContact).not.toHaveBeenCalled();
  });
});
