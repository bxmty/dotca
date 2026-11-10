/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

describe("gtag.ts during server rendering", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENVIRONMENT: "production",
      NEXT_PUBLIC_PRODUCTION_GA_ID: "GA-PRODUCTION-ID",
    };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("returns from initGA without touching window", () => {
    const { initGA } = require("@/lib/gtag");

    expect(typeof window).toBe("undefined");
    expect(() => initGA()).not.toThrow();
  });
});
