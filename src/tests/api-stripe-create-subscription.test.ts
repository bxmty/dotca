import { NextResponse } from "next/server";
import { POST } from "@/app/api/stripe/create-subscription/route";
import { MissingStripePriceError } from "@/lib/stripe";

// Add Request to global scope if not available in test environment
if (typeof Request === "undefined") {
  // Simple mock for Request in test environment
  global.Request = class Request {
    url: string;
    method: string;
    headers: HeadersInit;
    body: string;

    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || "GET";
      this.headers = init?.headers || {};
      this.body = (init?.body as string) || "";
    }

    async json() {
      return JSON.parse(this.body);
    }
  } as unknown as typeof Request;
}

const mockCustomersCreate = jest.fn();
const mockSubscriptionsCreate = jest.fn();
const mockResolvePriceId = jest.fn();
const mockGetServerStripe = jest.fn().mockResolvedValue({
  customers: { create: mockCustomersCreate },
  subscriptions: { create: mockSubscriptionsCreate },
});

jest.mock("@/lib/stripe", () => {
  class MissingStripePriceError extends Error {
    constructor(lookupKey: string) {
      super(`No active Stripe Price found for lookup key "${lookupKey}".`);
      this.name = "MissingStripePriceError";
    }
  }
  return {
    getServerStripe: () => mockGetServerStripe(),
    resolvePriceId: (args: unknown) => mockResolvePriceId(args),
    MissingStripePriceError,
  };
});

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/stripe/create-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validCustomer = {
  name: "Test User",
  email: "test@example.com",
  phone: "+11234567890",
  company: "Test Co",
  address: "123 Test St",
  city: "Toronto",
  state: "ON",
  zip: "M5V 1A1",
};

const validBody = {
  plan: "Basic",
  employeeCount: 5,
  billingCycle: "monthly",
  customer: validCustomer,
  idempotencyKey: "key-1",
};

describe("POST /api/stripe/create-subscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolvePriceId.mockResolvedValue("price_123");
    mockCustomersCreate.mockResolvedValue({ id: "cus_123" });
    mockSubscriptionsCreate.mockResolvedValue({
      id: "sub_123",
      latest_invoice: {
        confirmation_secret: { client_secret: "test_client_secret" },
      },
    });
  });

  it("creates a per-seat subscription from the resolved lookup-key Price", async () => {
    const response = await POST(buildRequest(validBody));

    expect(mockResolvePriceId).toHaveBeenCalledWith({
      plan: "basic",
      cycle: "monthly",
    });
    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "test@example.com",
        phone: "+11234567890",
        address: {
          line1: "123 Test St",
          city: "Toronto",
          state: "ON",
          postal_code: "M5V 1A1",
        },
      }),
      { idempotencyKey: "key-1-customer" },
    );
    expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
      {
        customer: "cus_123",
        items: [{ price: "price_123", quantity: 5 }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.confirmation_secret"],
        metadata: {
          plan: "basic",
          billing_cycle: "monthly",
          employee_count: "5",
          company: "Test Co",
        },
      },
      { idempotencyKey: "key-1-subscription" },
    );
    expect(response.data).toEqual({ clientSecret: "test_client_secret" });
  });

  it("threads ga_client_id and ga_session_id into subscription metadata when both are present", async () => {
    await POST(
      buildRequest({
        ...validBody,
        ga_client_id: "111111111.222222222",
        ga_session_id: "333333333",
      }),
    );

    const [params] = mockSubscriptionsCreate.mock.calls[0];
    expect(params.metadata).toEqual({
      plan: "basic",
      billing_cycle: "monthly",
      employee_count: "5",
      company: "Test Co",
      ga_client_id: "111111111.222222222",
      ga_session_id: "333333333",
    });
  });

  it("omits ga_client_id and ga_session_id from metadata when both are absent", async () => {
    await POST(buildRequest(validBody));

    const [params] = mockSubscriptionsCreate.mock.calls[0];
    expect(params.metadata).not.toHaveProperty("ga_client_id");
    expect(params.metadata).not.toHaveProperty("ga_session_id");
  });

  it("threads only the identifier that is present when just one GA cookie was available", async () => {
    await POST(
      buildRequest({
        ...validBody,
        ga_client_id: "111111111.222222222",
      }),
    );

    const [params] = mockSubscriptionsCreate.mock.calls[0];
    expect(params.metadata).toMatchObject({ ga_client_id: "111111111.222222222" });
    expect(params.metadata).not.toHaveProperty("ga_session_id");
  });

  it("never lets a non-string or empty ga identifier reach Stripe metadata", async () => {
    await POST(
      buildRequest({
        ...validBody,
        ga_client_id: 12345,
        ga_session_id: "   ",
      }),
    );

    const [params] = mockSubscriptionsCreate.mock.calls[0];
    expect(params.metadata).not.toHaveProperty("ga_client_id");
    expect(params.metadata).not.toHaveProperty("ga_session_id");
  });

  it("never accepts a client-supplied amount or price", async () => {
    await POST(
      buildRequest({
        ...validBody,
        amount: 1,
        price: "price_evil",
        currency: "eur",
      }),
    );

    const [params] = mockSubscriptionsCreate.mock.calls[0];
    expect(params.items).toEqual([{ price: "price_123", quantity: 5 }]);
    expect(params.amount).toBeUndefined();
  });

  it("rejects an unknown plan", async () => {
    await POST(buildRequest({ ...validBody, plan: "enterprise" }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unknown plan" },
      { status: 400 },
    );
    expect(mockSubscriptionsCreate).not.toHaveBeenCalled();
  });

  it("rejects the free plan", async () => {
    await POST(buildRequest({ ...validBody, plan: "Free" }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "The selected plan does not require payment" },
      { status: 400 },
    );
  });

  it("rejects an out-of-range employee count", async () => {
    await POST(buildRequest({ ...validBody, employeeCount: 21 }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Employee count must be a whole number between 5 and 20" },
      { status: 400 },
    );
  });

  it("rejects a missing customer object", async () => {
    await POST(buildRequest({ ...validBody, customer: undefined }));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Customer information is required" },
      { status: 400 },
    );
  });

  it("rejects an invalid customer email", async () => {
    await POST(
      buildRequest({
        ...validBody,
        customer: { ...validCustomer, email: "nope" },
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Please enter a valid email address" },
      { status: 400 },
    );
  });

  it("rejects a missing customer name", async () => {
    await POST(
      buildRequest({
        ...validBody,
        customer: { ...validCustomer, name: "  " },
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Name is required" },
      { status: 400 },
    );
  });

  it("rejects non-string customer fields", async () => {
    await POST(
      buildRequest({
        ...validBody,
        customer: { ...validCustomer, company: 42 },
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Field "company" must be a string' },
      { status: 400 },
    );
  });

  it("rejects a request body that is not valid JSON", async () => {
    const request = new Request(
      "http://localhost/api/stripe/create-subscription",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      },
    );

    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  });

  it("returns 503 with contact info when the Price catalog is missing", async () => {
    mockResolvePriceId.mockRejectedValueOnce(
      new MissingStripePriceError("basic_monthly"),
    );

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        error:
          "Checkout is temporarily unavailable. Please contact us at hi@boximity.ca or (289) 539-0098.",
      },
      { status: 503 },
    );
  });

  it("returns 500 when the subscription has no confirmable invoice", async () => {
    mockSubscriptionsCreate.mockResolvedValueOnce({
      id: "sub_123",
      latest_invoice: null,
    });

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unable to initialize payment. Please try again." },
      { status: 500 },
    );
  });

  it("returns a generic error without leaking Stripe error details", async () => {
    mockSubscriptionsCreate.mockRejectedValueOnce(
      new Error("sk_live_secret leaked in message"),
    );

    await POST(buildRequest(validBody));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unable to process the payment request" },
      { status: 500 },
    );
  });
});
