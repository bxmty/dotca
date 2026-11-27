import { splitFullName } from "@/lib/person-name";

describe("splitFullName", () => {
  it("takes the first word as the first name and the rest as the last name", () => {
    expect(splitFullName("Jane van der Berg")).toEqual({
      firstName: "Jane",
      lastName: "van der Berg",
    });
  });

  it("leaves the last name out for a single name", () => {
    expect(splitFullName("Jane")).toEqual({ firstName: "Jane" });
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(splitFullName("  Jane   Doe ")).toEqual({
      firstName: "Jane",
      lastName: "Doe",
    });
  });

  it.each(["", "   "])("returns no names for %p", (fullName) => {
    expect(splitFullName(fullName)).toEqual({});
  });
});
