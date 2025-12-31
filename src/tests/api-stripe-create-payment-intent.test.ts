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

describe("CREATE /api/stripe/create-payment-intent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPaymentIntentsCreate.mockResolvedValue({
      client_secret: "test_client_secret",
    });
  });

  it("creates a payment intent with the provided amount", async () => {
    // Prepare request
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 1000 }),
      },
    );

    // Call the route handler
    await POST(request);

    // Verify that the correct Stripe API call was made
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: "usd",
      metadata: {},
      automatic_payment_methods: { enabled: true },
    });
  });

  it("returns client secret in the response", async () => {
    // Prepare request
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 1000 }),
      },
    );

    // Call the route handler
    const response = await POST(request);

    // Verify the response
    expect(NextResponse.json).toHaveBeenCalledWith({
      clientSecret: "test_client_secret",
    });

    expect(response.data).toEqual({
      clientSecret: "test_client_secret",
    });
  });

  it("handles custom currency and metadata", async () => {
    // Prepare request with custom currency and metadata
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1500,
          currency: "eur",
          metadata: {
            orderId: "12345",
            customerName: "Test Customer",
          },
        }),
      },
    );

    // Call the route handler
    await POST(request);

    // Verify that the correct Stripe API call was made
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 1500,
      currency: "eur",
      metadata: {
        orderId: "12345",
        customerName: "Test Customer",
      },
      automatic_payment_methods: { enabled: true },
    });
  });

  it("returns error response when amount is missing", async () => {
    // Prepare request without amount
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency: "usd" }),
      },
    );

    // Call the route handler
    await POST(request);

    // Verify the error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "A valid amount is required" },
      { status: 400 },
    );

    // Stripe API should not be called
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("returns error response when amount is not a number", async () => {
    // Prepare request with invalid amount
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: "not-a-number" }),
      },
    );

    // Call the route handler
    await POST(request);

    // Verify the error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "A valid amount is required" },
      { status: 400 },
    );

    // Stripe API should not be called
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("handles Stripe API errors", async () => {
    // Mock Stripe API error
    mockPaymentIntentsCreate.mockRejectedValueOnce(
      new Error("Invalid currency"),
    );

    // Prepare request
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 1000 }),
      },
    );

    // Call the route handler
    await POST(request);

    // Verify the error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Invalid currency" },
      { status: 400 },
    );
  });

  it("handles unknown errors", async () => {
    // Mock unknown error (not an Error instance)
    mockPaymentIntentsCreate.mockRejectedValueOnce("Unknown error");

    // Prepare request
    const request = new Request(
      "http://localhost/api/stripe/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 1000 }),
      },
    );

    // Call the route handler
    await POST(request);

    // Verify the error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unknown error" },
      { status: 500 },
    );
  });
});
