import { NextResponse } from "next/server";
import { POST } from "@/app/api/stripe/create-payment-intent/route";

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

// Mock the getServerStripe function
const mockPaymentIntentsCreate = jest.fn();
const mockGetServerStripe = jest.fn().mockResolvedValue({
  paymentIntents: {
    create: mockPaymentIntentsCreate,
  },
});

jest.mock("@/lib/stripe", () => ({
  getServerStripe: () => mockGetServerStripe(),
}));

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/stripe/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("CREATE /api/stripe/create-payment-intent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPaymentIntentsCreate.mockResolvedValue({
      client_secret: "test_client_secret",
    });
  });

  it("computes the amount server-side from the order details", async () => {
    await POST(
      buildRequest({
        plan: "Basic",
        employeeCount: 5,
        billingCycle: "monthly",
      }),
    );

    // Basic is $99.00/user/month: 9900 * 5 = 49500 cents
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 49500,
      currency: "usd",
      metadata: {
        plan: "basic",
        employees: "5",
        billing_cycle: "monthly",
      },
      automatic_payment_methods: { enabled: true },
    });
  });

  it("applies the annual discount when billing cycle is annual", async () => {
    await POST(
      buildRequest({
        plan: "Standard",
        employeeCount: 10,
        billingCycle: "annual",
      }),
    );

    // Standard is $249.00/user/month: 24900 * 10 * 12 * 0.9 = 2689200 cents
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2689200,
        currency: "usd",
      }),
    );
  });

  it("ignores a client-supplied amount, currency, and metadata", async () => {
    await POST(
      buildRequest({
        plan: "Premium",
        employeeCount: 5,
        billingCycle: "monthly",
        amount: 1,
        currency: "eur",
        metadata: { injected: "value" },
      }),
    );

    // Premium is $449.00/user/month: 44900 * 5 = 224500 cents
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 224500,
      currency: "usd",
      metadata: {
        plan: "premium",
        employees: "5",
        billing_cycle: "monthly",
      },
      automatic_payment_methods: { enabled: true },
    });
  });

  it("returns client secret in the response", async () => {
    const response = await POST(
      buildRequest({
        plan: "Basic",
        employeeCount: 5,
        billingCycle: "monthly",
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith({
      clientSecret: "test_client_secret",
    });

    expect(response.data).toEqual({
      clientSecret: "test_client_secret",
    });
  });

  it("rejects an unknown plan", async () => {
    await POST(
      buildRequest({
        plan: "enterprise",
        employeeCount: 5,
        billingCycle: "monthly",
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unknown plan" },
      { status: 400 },
    );
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("rejects the free plan", async () => {
    await POST(
      buildRequest({ plan: "Free", employeeCount: 5, billingCycle: "monthly" }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "The selected plan does not require payment" },
      { status: 400 },
    );
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it.each([0, 4, 21, 5.5, "10", null, undefined])(
    "rejects invalid employee count %p",
    async (employeeCount) => {
      await POST(
        buildRequest({ plan: "Basic", employeeCount, billingCycle: "monthly" }),
      );

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Employee count must be a whole number between 5 and 20" },
        { status: 400 },
      );
      expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    },
  );

  it("rejects an invalid billing cycle", async () => {
    await POST(
      buildRequest({ plan: "Basic", employeeCount: 5, billingCycle: "weekly" }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Billing cycle must be "monthly" or "annual"' },
      { status: 400 },
    );
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("rejects a request body that is not valid JSON", async () => {
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
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
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("returns a generic error without leaking Stripe error details", async () => {
    mockPaymentIntentsCreate.mockRejectedValueOnce(
      new Error("sk_live_secret leaked in message"),
    );

    await POST(
      buildRequest({
        plan: "Basic",
        employeeCount: 5,
        billingCycle: "monthly",
      }),
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unable to process the payment request" },
      { status: 500 },
    );
  });
});
