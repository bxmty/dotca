// tests/api-geocode.test.ts
import {
  GET,
  resetGeocodeRateLimits,
} from "@/app/api/geocode/route";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { searchAddresses } from "@/lib/nominatim";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
}));

jest.mock("@/lib/nominatim", () => ({
  searchAddresses: jest.fn(),
}));

const mockSearchAddresses = searchAddresses as jest.Mock;
const mockNextResponseJson = NextResponse.json as jest.Mock;

function buildRequest(url: string, ip = "203.0.113.7"): Request {
  return {
    url: `http://localhost${url}`,
    headers: new Headers({ "x-forwarded-for": ip }),
  } as unknown as Request;
}

describe("Geocode API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetGeocodeRateLimits();
    mockSearchAddresses.mockResolvedValue([{ id: "1", displayName: "test" }]);
  });

  it("short-circuits queries under 3 characters without calling searchAddresses", async () => {
    await GET(buildRequest("/api/geocode?q=to"));

    expect(mockSearchAddresses).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith({ results: [] });
  });

  it("short-circuits a missing query param", async () => {
    await GET(buildRequest("/api/geocode"));

    expect(mockSearchAddresses).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith({ results: [] });
  });

  it("calls searchAddresses with the query and passes through results", async () => {
    const results = [{ id: "1", displayName: "123 Main St" }];
    mockSearchAddresses.mockResolvedValue(results);

    await GET(buildRequest("/api/geocode?q=123+Main+St"));

    expect(mockSearchAddresses).toHaveBeenCalledWith("123 Main St", {
      countryCodes: undefined,
    });
    expect(mockNextResponseJson).toHaveBeenCalledWith({ results });
  });

  it("passes countryCodes through when present", async () => {
    await GET(buildRequest("/api/geocode?q=Toronto&countryCodes=ca"));

    expect(mockSearchAddresses).toHaveBeenCalledWith("Toronto", {
      countryCodes: "ca",
    });
  });

  it("rate limits after 30 requests from the same IP within the window", async () => {
    for (let i = 0; i < 30; i++) {
      await GET(buildRequest(`/api/geocode?q=query${i}`, "198.51.100.1"));
    }
    expect(mockSearchAddresses).toHaveBeenCalledTimes(30);

    mockNextResponseJson.mockClear();
    await GET(buildRequest("/api/geocode?q=one+more", "198.51.100.1"));

    expect(mockSearchAddresses).toHaveBeenCalledTimes(30);
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Too many address lookups. Please slow down." },
      { status: 429 },
    );
  });

  it("tracks IPs independently for rate limiting", async () => {
    for (let i = 0; i < 30; i++) {
      await GET(buildRequest(`/api/geocode?q=query${i}`, "198.51.100.2"));
    }

    mockNextResponseJson.mockClear();
    await GET(buildRequest("/api/geocode?q=fresh+ip", "198.51.100.3"));

    expect(mockNextResponseJson).toHaveBeenCalledWith({
      results: [{ id: "1", displayName: "test" }],
    });
  });

  it("reports failures to Sentry and returns a 502", async () => {
    const error = new Error("upstream failure");
    mockSearchAddresses.mockRejectedValue(error);

    await GET(buildRequest("/api/geocode?q=this+will+fail"));

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { results: [], error: "Address lookup failed" },
      { status: 502 },
    );
  });
});
