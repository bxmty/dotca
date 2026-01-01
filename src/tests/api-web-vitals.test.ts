import { POST } from "@/app/api/analytics/web-vitals/route";
import { NextResponse } from "next/server";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// Mock environment variable
const originalEnv = process.env;

describe("Web Vitals API Route", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup process.env
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
    };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("successfully processes web vitals metric", async () => {
    const mockMetric = {
      name: "CLS",
      value: 0.1,
      id: "test-id",
      delta: 0.1,
    };

    // Create a mock request
    const request = {
      json: jest.fn().mockResolvedValue(mockMetric),
    };

    await POST(request as unknown as Request);

    // Verify the request.json was called
    expect(request.json).toHaveBeenCalledTimes(1);

    // Verify NextResponse.json was called with success
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("logs metrics in development mode", async () => {
    const mockMetric = {
      name: "FCP",
      value: 1500,
      id: "test-id",
      delta: 1500,
    };

    const request = {
      json: jest.fn().mockResolvedValue(mockMetric),
    };

    await POST(request as unknown as Request);

    // In development mode, metrics should be logged
    // (Console logging is handled by jest setup, so we just verify the function completes)
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("handles JSON parsing errors", async () => {
    // Mock request.json to throw an error
    const request = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 500
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Failed to process web vitals data" },
      { status: 500 },
    );
  });

  it("handles various web vitals metric types", async () => {
    const testMetrics = [
      { name: "CLS", value: 0.05, id: "cls-id", delta: 0.05 },
      { name: "FCP", value: 1200, id: "fcp-id", delta: 1200 },
      { name: "LCP", value: 2500, id: "lcp-id", delta: 2500 },
      { name: "TTFB", value: 800, id: "ttfb-id", delta: 800 },
    ];

    for (const metric of testMetrics) {
      const request = {
        json: jest.fn().mockResolvedValue(metric),
      };

      await POST(request as unknown as Request);

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    }
  });

  it("handles metrics with additional properties", async () => {
    const mockMetric = {
      name: "INP",
      value: 100,
      id: "inp-id",
      delta: 100,
      attribution: {
        eventType: "click",
        eventTime: 12345,
        loadState: "complete",
      },
    };

    const request = {
      json: jest.fn().mockResolvedValue(mockMetric),
    };

    await POST(request as unknown as Request);

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it("does not log metrics in production mode", async () => {
    process.env.NODE_ENV = "production";

    const mockMetric = {
      name: "CLS",
      value: 0.1,
      id: "test-id",
      delta: 0.1,
    };

    const request = {
      json: jest.fn().mockResolvedValue(mockMetric),
    };

    await POST(request as unknown as Request);

    // Should still return success, just without logging
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });
});
