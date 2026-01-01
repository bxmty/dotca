import { GET } from "@/app/api/health/route";
import { NextResponse } from "next/server";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe("Health API Route", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it("returns health status ok", async () => {
    const response = await GET();

    // Verify NextResponse.json was called with correct data and status
    expect(NextResponse.json).toHaveBeenCalledWith(
      { status: "ok" },
      { status: 200 },
    );

    // Verify the response object structure
    expect(response).toEqual({
      data: { status: "ok" },
      options: { status: 200 },
    });
  });

  it("responds with HTTP 200 status", async () => {
    await GET();

    // Verify the status code is 200
    expect(NextResponse.json).toHaveBeenCalledWith(expect.any(Object), {
      status: 200,
    });
  });

  it("returns JSON response", async () => {
    const response = await GET();

    // Verify it's a JSON response with the expected structure
    expect(response.data).toEqual({ status: "ok" });
    expect(response.options).toEqual({ status: 200 });
  });
});
