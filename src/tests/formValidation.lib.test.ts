import { isEmailAddress, omitFieldErrors } from "@/lib/formValidation";

describe("isEmailAddress", () => {
  it.each(["dana@company.ca", "  dana@company.ca  "])("accepts %p", (value) => {
    expect(isEmailAddress(value)).toBe(true);
  });

  it.each(["", "dana@", "dana@company", "dana company@x.ca"])(
    "rejects %p",
    (value) => {
      expect(isEmailAddress(value)).toBe(false);
    },
  );
});

describe("omitFieldErrors", () => {
  it("drops only the given fields and leaves the original intact", () => {
    const errors = { city: "enter your city", zip: "enter your postal code" };

    expect(omitFieldErrors(errors, ["city"])).toEqual({
      zip: "enter your postal code",
    });
    expect(errors).toHaveProperty("city");
  });
});
