import { createSyncroLead } from "@/lib/syncro-leads";
import { addResendMarketingContact } from "@/lib/resend-marketing";

// Both are placeholders for #596-601. Until that work replaces them, they must
// fail loudly with this exact message rather than pretend to succeed.
const NOT_IMPLEMENTED = "not yet implemented — blocked on bxmty/dotca#596-601";

describe("lead capture stubs", () => {
  it("createSyncroLead throws the not-yet-implemented error", async () => {
    await expect(
      createSyncroLead({ email: "a@example.com", source: "lead-magnet:x" }),
    ).rejects.toThrow(new Error(NOT_IMPLEMENTED));
  });

  it("addResendMarketingContact throws the not-yet-implemented error", async () => {
    await expect(
      addResendMarketingContact({
        email: "a@example.com",
        topic: "monthly-security-brief",
      }),
    ).rejects.toThrow(new Error(NOT_IMPLEMENTED));
  });
});
