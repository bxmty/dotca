import { createLead, describeLeadOutcome } from "@/lib/syncro";

const originalEnv = process.env;

const contactLead = {
  formType: "Contact" as const,
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+12895550123",
  company: "Analytical Engines",
  fields: {
    Name: "Ada Lovelace",
    Email: "ada@example.com",
    Company: "Analytical Engines",
    Plan: "",
  },
};

function mockFetchResponse({
  status,
  body,
}: {
  status: number;
  body?: unknown;
}): jest.Mock {
  const mock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      body === undefined
        ? Promise.reject(new SyntaxError("Unexpected end of JSON input"))
        : Promise.resolve(body),
  });
  global.fetch = mock;
  return mock;
}

function sentBody(fetchMock: jest.Mock): Record<string, unknown> {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe("createLead", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    process.env = {
      ...originalEnv,
      SYNCRO_SUBDOMAIN: "boximity",
      SYNCRO_API_KEY: "test-syncro-key",
      NEXT_PUBLIC_ENVIRONMENT: "production",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("posts the lead to the account's Leads endpoint and returns its id", async () => {
    const fetchMock = mockFetchResponse({
      status: 200,
      body: { lead: { id: 4242 } },
    });

    const result = await createLead(contactLead);

    expect(result).toEqual({ ok: true, leadId: 4242 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://boximity.syncromsp.com/api/v1/leads",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-syncro-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("asks Syncro for JSON", async () => {
    const fetchMock = mockFetchResponse({ status: 200, body: {} });

    await createLead(contactLead);

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer test-syncro-key",
    });
  });

  it("trims whitespace around the subdomain and API key", async () => {
    process.env.SYNCRO_SUBDOMAIN = " boximity\n";
    process.env.SYNCRO_API_KEY = "\ttest-syncro-key ";
    const fetchMock = mockFetchResponse({ status: 200, body: {} });

    await createLead(contactLead);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://boximity.syncromsp.com/api/v1/leads",
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-syncro-key",
    );
  });

  it("reports success without a lead id when Syncro returns none", async () => {
    mockFetchResponse({ status: 200, body: {} });

    expect(await createLead(contactLead)).toStrictEqual({ ok: true });
  });

  it.each([
    ["Onboarding", "Website onboarding form — Analytical Engines"],
    ["Lead magnet", "Website lead magnet — Analytical Engines"],
    ["Security assessment", "Website security assessment — Analytical Engines"],
  ] as const)(
    "titles a %s lead with its own subject prefix",
    async (formType, subject) => {
      const fetchMock = mockFetchResponse({ status: 200, body: {} });

      await createLead({ ...contactLead, formType });

      expect(sentBody(fetchMock).ticket_subject).toBe(subject);
    },
  );

  it.each([
    ["a single-word name", "Ada", { first_name: "Ada", last_name: "" }],
    ["a blank name", "   ", { first_name: "", last_name: "" }],
  ])("sends both name fields for %s", async (_label, name, nameFields) => {
    const fetchMock = mockFetchResponse({ status: 200, body: {} });

    const result = await createLead({ ...contactLead, name });

    expect(result.ok).toBe(true);
    expect(sentBody(fetchMock)).toMatchObject(nameFields);
  });

  it("sends no amount for a lead that isn't a paid signup", async () => {
    const fetchMock = mockFetchResponse({ status: 200, body: {} });

    await createLead(contactLead);

    expect(sentBody(fetchMock)).not.toHaveProperty(
      "opportunity_amount_dollars",
    );
  });

  it("maps the contact onto Syncro's lead fields", async () => {
    const fetchMock = mockFetchResponse({ status: 200, body: { lead: {} } });

    await createLead({ ...contactLead, name: "Ada King Lovelace" });

    expect(sentBody(fetchMock)).toEqual({
      first_name: "Ada",
      last_name: "King Lovelace",
      email: "ada@example.com",
      phone: "+12895550123",
      business_name: "Analytical Engines",
      ticket_subject: "Website contact form — Analytical Engines",
      ticket_description:
        "Name: Ada Lovelace\nEmail: ada@example.com\nCompany: Analytical Engines\nPlan: ",
    });
  });

  it("names a discovery-call lead in the ticket subject", async () => {
    const fetchMock = mockFetchResponse({ status: 200, body: { lead: {} } });

    await createLead({
      ...contactLead,
      formType: "Discovery call assessment",
    });

    expect(sentBody(fetchMock).ticket_subject).toBe(
      "Discovery call assessment — Analytical Engines",
    );
  });

  it("titles the lead with the name when no company was given", async () => {
    const fetchMock = mockFetchResponse({ status: 200, body: { lead: {} } });

    await createLead({ ...contactLead, company: "" });

    expect(sentBody(fetchMock).ticket_subject).toBe(
      "Website contact form — Ada Lovelace",
    );
  });

  it("makes paid signups visibly distinct and carries the amount", async () => {
    const fetchMock = mockFetchResponse({ status: 200, body: { lead: {} } });

    await createLead({
      ...contactLead,
      formType: "Paid signup",
      opportunityAmountDollars: 1499.5,
    });

    expect(sentBody(fetchMock)).toEqual(
      expect.objectContaining({
        ticket_subject: "PAID SIGNUP — Analytical Engines",
        opportunity_amount_dollars: 1499.5,
      }),
    );
  });

  it("prefixes staging leads and says so in the hidden notes", async () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";
    const fetchMock = mockFetchResponse({ status: 200, body: { lead: {} } });

    await createLead(contactLead);

    const body = sentBody(fetchMock);
    expect(body.ticket_subject).toBe(
      "[STAGING] Website contact form — Analytical Engines",
    );
    expect(body.hidden_notes).toMatch(/staging/i);
  });

  describe("monthly brief consent", () => {
    beforeEach(() => {
      // 02:30 UTC on the 20th is still the evening of the 19th in Toronto
      jest.useFakeTimers({ now: new Date("2026-10-20T02:30:00Z") });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("records the opt-in and its Toronto date in the hidden notes", async () => {
      const fetchMock = mockFetchResponse({ status: 200, body: { lead: {} } });

      await createLead({ ...contactLead, hasOptedInToBrief: true });

      expect(sentBody(fetchMock).hidden_notes).toBe(
        "Opted in to the monthly security brief on 2026-10-19",
      );
    });

    it("keeps the staging note alongside the consent line", async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "staging";
      const fetchMock = mockFetchResponse({ status: 200, body: { lead: {} } });

      await createLead({ ...contactLead, hasOptedInToBrief: true });

      const notes = String(sentBody(fetchMock).hidden_notes).split("\n");
      expect(notes).toHaveLength(2);
      expect(notes[0]).toMatch(/staging/i);
      expect(notes[1]).toBe(
        "Opted in to the monthly security brief on 2026-10-19",
      );
    });

    it.each([
      ["not ticked", false],
      ["not given", undefined],
    ])(
      "sends no hidden notes in production when the box was %s",
      async (_label, hasOptedInToBrief) => {
        const fetchMock = mockFetchResponse({
          status: 200,
          body: { lead: {} },
        });

        await createLead({ ...contactLead, hasOptedInToBrief });

        expect(sentBody(fetchMock)).not.toHaveProperty("hidden_notes");
      },
    );
  });

  it("reports a 4xx as a rejection with Syncro's status and message", async () => {
    mockFetchResponse({
      status: 422,
      body: { message: ["Email is invalid"] },
    });

    const result = await createLead(contactLead);

    expect(result).toEqual({
      ok: false,
      reason: "rejected",
      status: 422,
      message: "Email is invalid",
    });
  });

  it("reports a 4xx with an HTML body as a rejection, without throwing", async () => {
    // json() rejects, as it does for an HTML error page
    mockFetchResponse({ status: 404 });

    expect(await createLead(contactLead)).toStrictEqual({
      ok: false,
      reason: "rejected",
      status: 404,
    });
  });

  it.each([
    ["a JSON null body", null],
    ["a JSON string body", "Not allowed"],
    ["a body with no message", { detail: "nope" }],
  ])(
    "reports a 4xx with %s as a rejection without a message",
    async (_label, body) => {
      mockFetchResponse({ status: 400, body });

      expect(await createLead(contactLead)).toStrictEqual({
        ok: false,
        reason: "rejected",
        status: 400,
      });
    },
  );

  it.each([
    [
      "a list of messages",
      { message: ["Email is invalid", "Name is blank"] },
      "Email is invalid; Name is blank",
    ],
    ["an error string", { error: "Unauthorized" }, "Unauthorized"],
    [
      "an errors object",
      { errors: { email: ["is invalid"] } },
      '{"email":["is invalid"]}',
    ],
  ])("reads %s from a rejection body", async (_label, body, message) => {
    mockFetchResponse({ status: 422, body });

    expect(await createLead(contactLead)).toStrictEqual({
      ok: false,
      reason: "rejected",
      status: 422,
      message,
    });
  });

  it("reports exactly HTTP 500 as unreachable, not a rejection", async () => {
    mockFetchResponse({ status: 500 });

    expect(await createLead(contactLead)).toEqual({
      ok: false,
      reason: "unreachable",
      code: "server_error",
      status: 500,
    });
  });

  it("reports a 5xx as Syncro being unreachable", async () => {
    mockFetchResponse({ status: 503 });

    const result = await createLead(contactLead);

    expect(result).toEqual({
      ok: false,
      reason: "unreachable",
      code: "server_error",
      status: 503,
    });
  });

  it("reports a network error as Syncro being unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

    const result = await createLead(contactLead);

    expect(result).toEqual({
      ok: false,
      reason: "unreachable",
      code: "network_error",
    });
  });

  it.each(["SYNCRO_API_KEY", "SYNCRO_SUBDOMAIN"])(
    "treats a missing %s as unreachable without calling Syncro",
    async (variable) => {
      delete process.env[variable];
      const fetchMock = mockFetchResponse({ status: 200, body: {} });

      const result = await createLead(contactLead);

      expect(result).toEqual({
        ok: false,
        reason: "unreachable",
        code: "missing_config",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

describe("describeLeadOutcome", () => {
  it.each([
    [{ ok: true as const, leadId: 1 }, "ok"],
    [
      {
        ok: false as const,
        reason: "rejected" as const,
        status: 422,
        message: "Email ada@example.com is invalid",
      },
      "rejected (HTTP 422)",
    ],
    [
      {
        ok: false as const,
        reason: "unreachable" as const,
        code: "server_error" as const,
        status: 503,
      },
      "unreachable (server_error, HTTP 503)",
    ],
    [
      {
        ok: false as const,
        reason: "unreachable" as const,
        code: "missing_config" as const,
      },
      "unreachable (missing_config)",
    ],
  ])("summarises %o without Syncro's message", (result, expected) => {
    expect(describeLeadOutcome(result)).toBe(expected);
  });
});
