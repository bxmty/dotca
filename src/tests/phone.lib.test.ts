import { formatE164Phone } from "@/lib/phone";

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
