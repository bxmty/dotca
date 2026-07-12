import { addBrevoContact, formatE164Phone } from "@/lib/brevo";

const originalEnv = process.env;

describe("formatE164Phone", () => {
  it("formats a bare North American number to E.164", () => {
    expect(formatE164Phone("123-456-7890")).toBe("+11234567890");
  });

  it("keeps an explicit country code", () => {
    expect(formatE164Phone("+442071838750")).toBe("+442071838750");
  });

  it("returns null for impossible numbers", () => {
    expect(formatE164Phone("123")).toBeNull();
  });
});

describe("addBrevoContact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;
    process.env = { ...originalEnv, BREVO_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("posts the contact to Brevo with list, attributes, and SMS", async () => {
    const result = await addBrevoContact({
      listId: 9,
      email: "test@example.com",
      smsPhone: "+11234567890",
      attributes: { FULLNAME: "Test User" },
    });

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/contacts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "api-key": "test-api-key" }),
        body: JSON.stringify({
          email: "test@example.com",
          attributes: { FULLNAME: "Test User", SMS: "+11234567890" },
          listIds: [9],
          sms: { SMS: "+11234567890" },
          updateEnabled: true,
        }),
      }),
    );
  });

  it("omits the SMS channel when no phone is provided", async () => {
    await addBrevoContact({
      listId: 10,
      email: "test@example.com",
      attributes: { FULLNAME: "Test User" },
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.attributes.SMS).toBeUndefined();
    expect(body.sms).toBeUndefined();
    expect(body.listIds).toEqual([10]);
  });

  it("fails without throwing when the API key is missing", async () => {
    delete process.env.BREVO_API_KEY;

    const result = await addBrevoContact({
      listId: 9,
      email: "test@example.com",
      attributes: {},
    });

    expect(result).toEqual({ ok: false, code: "missing_api_key" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("surfaces Brevo error codes without throwing", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          code: "duplicate_parameter",
          message: "Contact already exists",
        }),
    });

    const result = await addBrevoContact({
      listId: 9,
      email: "test@example.com",
      attributes: {},
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      code: "duplicate_parameter",
      message: "Contact already exists",
    });
  });

  it("handles non-JSON error responses without throwing", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("not JSON")),
    });

    const result = await addBrevoContact({
      listId: 9,
      email: "test@example.com",
      attributes: {},
    });

    expect(result).toEqual({
      ok: false,
      status: 502,
      code: undefined,
      message: undefined,
    });
  });

  it("handles network failures without throwing", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("network down"),
    );

    const result = await addBrevoContact({
      listId: 9,
      email: "test@example.com",
      attributes: {},
    });

    expect(result).toEqual({
      ok: false,
      code: "network_error",
      message: "network down",
    });
  });
});
