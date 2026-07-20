import { searchAddresses, resetNominatimState } from "@/lib/nominatim";

function mockResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  });
}

function rawResult(overrides: Record<string, unknown> = {}) {
  return {
    place_id: 1,
    display_name: "123 Main St, Toronto, Ontario, Canada",
    lat: "43.6532",
    lon: "-79.3832",
    address: {
      house_number: "123",
      road: "Main St",
      city: "Toronto",
      state: "Ontario",
      postcode: "M5V 2T6",
      country: "Canada",
      country_code: "ca",
    },
    ...overrides,
  };
}

describe("searchAddresses", () => {
  beforeEach(() => {
    resetNominatimState();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns an empty array without calling fetch for queries under 3 chars", async () => {
    const results = await searchAddresses("  1 ");
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["city", { city: "Toronto" }],
    ["town", { town: "Whitby" }],
    ["village", { village: "Ancaster" }],
    ["hamlet", { hamlet: "Cataraqui" }],
    ["municipality", { municipality: "Markham" }],
  ])("normalizes the %s address field", async (fieldName, addressOverride) => {
    (global.fetch as jest.Mock).mockReturnValueOnce(
      mockResponse([
        rawResult({
          address: {
            house_number: "1",
            road: "Test Rd",
            ...addressOverride,
            postcode: "L1L 1L1",
            country: "Canada",
            country_code: "ca",
          },
        }),
      ]),
    );

    const promise = searchAddresses("123 Main Street");
    await jest.advanceTimersByTimeAsync(1200);
    const results = await promise;

    expect(results[0].city).toBe(Object.values(addressOverride)[0]);
  });

  it.each([
    ["state", { state: "Ontario" }],
    ["province", { province: "Quebec" }],
    ["region", { region: "Nunavut" }],
  ])("normalizes the %s address field", async (fieldName, addressOverride) => {
    (global.fetch as jest.Mock).mockReturnValueOnce(
      mockResponse([
        rawResult({
          address: {
            house_number: "1",
            road: "Test Rd",
            city: "Somewhere",
            ...addressOverride,
            postcode: "L1L 1L1",
            country: "Canada",
            country_code: "ca",
          },
        }),
      ]),
    );

    const promise = searchAddresses("123 Main Street");
    await jest.advanceTimersByTimeAsync(1200);
    const results = await promise;

    expect(results[0].state).toBe(Object.values(addressOverride)[0]);
  });

  it("falls back to the first display_name segment when house_number/road are missing", async () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(
      mockResponse([
        rawResult({
          display_name: "Toronto, Ontario, Canada",
          address: {
            city: "Toronto",
            state: "Ontario",
            country: "Canada",
            country_code: "ca",
          },
        }),
      ]),
    );

    const promise = searchAddresses("Toronto");
    await jest.advanceTimersByTimeAsync(1200);
    const results = await promise;

    expect(results[0].addressLine).toBe("Toronto");
  });

  it("caches repeat queries and skips a second fetch", async () => {
    (global.fetch as jest.Mock).mockReturnValue(mockResponse([rawResult()]));

    const first = searchAddresses("123 main street");
    await jest.advanceTimersByTimeAsync(1200);
    await first;

    const second = await searchAddresses("123 MAIN STREET");

    expect(second).toEqual(await first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("treats different countryCodes as different cache entries", async () => {
    (global.fetch as jest.Mock).mockReturnValue(mockResponse([rawResult()]));

    const first = searchAddresses("123 main street", { countryCodes: "ca" });
    await jest.advanceTimersByTimeAsync(1200);
    await first;

    const second = searchAddresses("123 main street", { countryCodes: "us" });
    await jest.advanceTimersByTimeAsync(1200);
    await second;

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("expires the cache after the TTL elapses", async () => {
    (global.fetch as jest.Mock).mockReturnValue(mockResponse([rawResult()]));

    const first = searchAddresses("123 main street");
    await jest.advanceTimersByTimeAsync(1200);
    await first;

    // Advance past both the 1.1s throttle window and the 5 minute cache TTL
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000 + 1200);

    await searchAddresses("123 main street");

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throttles consecutive requests to at least 1.1s apart", async () => {
    (global.fetch as jest.Mock).mockReturnValue(mockResponse([rawResult()]));

    const first = searchAddresses("first query");
    const second = searchAddresses("second query");

    await jest.advanceTimersByTimeAsync(100);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1200);
    expect(global.fetch).toHaveBeenCalledTimes(2);

    await first;
    await second;
  });

  it("throws when the response is not ok", async () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(mockResponse({}, false));

    const promise = searchAddresses("this will fail please");
    const assertion = expect(promise).rejects.toThrow(
      "Nominatim request failed: 500",
    );
    await jest.advanceTimersByTimeAsync(1200);
    await assertion;
  });
});
