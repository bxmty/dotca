import {
  COMPANY_PHONE_DISPLAY,
  COMPANY_PHONE_TEL_HREF,
} from "@/lib/company-phone";

describe("company phone", () => {
  it("shows the number in North American form", () => {
    expect(COMPANY_PHONE_DISPLAY).toBe("(289) 539-0098");
  });

  it("dials the same number in E.164", () => {
    expect(COMPANY_PHONE_TEL_HREF).toBe("tel:+12895390098");
  });
});
