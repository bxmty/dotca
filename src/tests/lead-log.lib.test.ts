import { logLeadSubmission } from "@/lib/lead-log";

describe("logLeadSubmission", () => {
  afterEach(() => jest.restoreAllMocks());

  it("writes one JSON line carrying the lead and each sink's outcome", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    logLeadSubmission({
      formType: "Onboarding",
      name: "Ada Lovelace",
      company: "Analytical Engines",
      email: "ada@example.com",
      phone: "+12895550123",
      syncro: { ok: false, reason: "unreachable", code: "network_error" },
      isEmailSent: true,
    });

    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      event: "lead_submission",
      formType: "Onboarding",
      name: "Ada Lovelace",
      company: "Analytical Engines",
      email: "ada@example.com",
      phone: "+12895550123",
      syncro: "unreachable (network_error)",
      webmasterEmail: "ok",
    });
  });
});
