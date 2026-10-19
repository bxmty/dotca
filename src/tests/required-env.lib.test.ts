import { describeMissingEnv, readRequiredEnv } from "@/lib/required-env";

describe("readRequiredEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, TEST_ALPHA: "alpha", TEST_BETA: "beta" };
    delete process.env.TEST_GAMMA;
    delete process.env.TEST_DELTA;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns every value when all the names are set", () => {
    expect(readRequiredEnv(["TEST_ALPHA", "TEST_BETA"])).toEqual({
      isComplete: true,
      valuesByName: { TEST_ALPHA: "alpha", TEST_BETA: "beta" },
    });
  });

  it("names every unset or empty variable, in the order asked", () => {
    process.env.TEST_DELTA = "";

    expect(readRequiredEnv(["TEST_GAMMA", "TEST_ALPHA", "TEST_DELTA"])).toEqual(
      { isComplete: false, missingNames: ["TEST_GAMMA", "TEST_DELTA"] },
    );
  });
});

describe("describeMissingEnv", () => {
  it("lists the names without any values", () => {
    expect(describeMissingEnv(["RESEND_API_KEY", "RESEND_FROM_EMAIL"])).toBe(
      "RESEND_API_KEY, RESEND_FROM_EMAIL not set",
    );
  });
});
