import { captureMessage } from "@sentry/nextjs";
import { signSdrToken } from "@/lib/sdr-link";
import { checkSdrSession, readSdrName } from "@/lib/sdr-session";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));

const originalEnv = process.env;

describe("SDR session checks", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SDR_LINK_SIGNING_SECRET: "s".repeat(64),
    };
    jest.mocked(captureMessage).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("names the SDR on a valid token", () => {
    const token = signSdrToken({ name: "Alex Doe" });

    expect(checkSdrSession(token)).toEqual({
      isValid: true,
      sdrName: "Alex Doe",
    });
    expect(readSdrName(token)).toBe("Alex Doe");
  });

  it("gives no name on a bad token, without reporting a fault", () => {
    expect(checkSdrSession("nope")).toEqual({
      isValid: false,
      reason: "malformed",
    });
    expect(readSdrName("nope")).toBeUndefined();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("reports a missing secret as a deployment fault, not a bad token", () => {
    const token = signSdrToken({ name: "Alex Doe" });
    delete process.env.SDR_LINK_SIGNING_SECRET;

    expect(checkSdrSession(token)).toEqual({
      isValid: false,
      reason: "secret-unset",
    });
    expect(readSdrName(token)).toBeUndefined();
    expect(captureMessage).toHaveBeenCalledTimes(1);
  });
});
