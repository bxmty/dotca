const mockCaptureMessage = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}));

type SyncroModule = typeof import("@/lib/syncro");

type SyncroReply = { status: number; body?: unknown } | Error;

const originalEnv = process.env;

const INTAKE_TOKEN = "Placeholder-Intake-Token-000000000";

const customersPage = {
  customers: [
    { id: 11, business_name: "Other Client", properties: {} },
    {
      id: 42,
      business_name: "Placeholder Dental",
      properties: { intake_token: INTAKE_TOKEN },
    },
  ],
  meta: { total_pages: 1, page: 1 },
};

/**
 * The module caches in memory, so each test loads its own copy: a cold cache
 * without a test-only reset inside the module.
 */
function loadSyncro(): SyncroModule {
  let syncro!: SyncroModule;
  jest.isolateModules(() => {
    syncro = require("@/lib/syncro");
  });
  return syncro;
}

/** Answer each Syncro request from `reply`; an Error reply is a network failure. */
function mockSyncro(reply: (url: URL) => SyncroReply): jest.Mock {
  const mock = jest.fn((input: string) => {
    const answer = reply(new URL(input));
    if (answer instanceof Error) return Promise.reject(answer);
    const { status, body } = answer;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () =>
        body === undefined
          ? Promise.reject(new SyntaxError("Unexpected end of JSON input"))
          : Promise.resolve(body),
    });
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

beforeEach(() => {
  jest.clearAllMocks();
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
  jest.useRealTimers();
});

describe("resolveIntakeToken", () => {
  it("resolves a token to the organization whose intake_token field holds it", async () => {
    const fetchMock = mockSyncro(() => ({ status: 200, body: customersPage }));
    const { resolveIntakeToken } = loadSyncro();

    const result = await resolveIntakeToken(INTAKE_TOKEN);

    expect(result).toEqual({
      status: "matched",
      organization: { id: 42, name: "Placeholder Dental" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://boximity.syncromsp.com/api/v1/customers?page=1",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-syncro-key",
        },
        signal: expect.any(AbortSignal),
      },
    );
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("ignores whitespace around the submitted token and the stored field", async () => {
    mockSyncro(() => ({
      status: 200,
      body: {
        customers: [
          {
            id: 42,
            business_name: "Placeholder Dental",
            properties: { intake_token: `  ${INTAKE_TOKEN}\n` },
          },
        ],
        meta: { total_pages: 1 },
      },
    }));
    const { resolveIntakeToken } = loadSyncro();

    const result = await resolveIntakeToken(` ${INTAKE_TOKEN} `);

    expect(result).toMatchObject({
      status: "matched",
      organization: { id: 42 },
    });
  });

  it("matches the token exactly: a different case is no match", async () => {
    mockSyncro(() => ({ status: 200, body: customersPage }));
    const { resolveIntakeToken } = loadSyncro();

    const result = await resolveIntakeToken(INTAKE_TOKEN.toUpperCase());

    expect(result).toEqual({ status: "no_match" });
  });

  it("answers no match for a token no organization holds", async () => {
    mockSyncro(() => ({ status: 200, body: customersPage }));
    const { resolveIntakeToken } = loadSyncro();

    const result = await resolveIntakeToken("not-a-real-token");

    expect(result).toEqual({ status: "no_match" });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it.each(["", "   "])(
    "never matches the blank token %p to an organization with a blank field",
    async (token) => {
      const fetchMock = mockSyncro(() => ({
        status: 200,
        body: {
          customers: [
            { id: 7, business_name: "Blank", properties: { intake_token: "" } },
            {
              id: 8,
              business_name: "Spaces",
              properties: { intake_token: " " },
            },
            { id: 9, business_name: "Unset", properties: {} },
          ],
        },
      }));
      const { resolveIntakeToken } = loadSyncro();

      expect(await resolveIntakeToken(token)).toEqual({ status: "no_match" });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("skips customers whose record is malformed", async () => {
    mockSyncro(() => ({
      status: 200,
      body: {
        customers: [
          null,
          "customer",
          { id: 1, business_name: "No properties" },
          { id: 2, business_name: "Null properties", properties: null },
          { id: 3, business_name: "Numeric", properties: { intake_token: 5 } },
          {
            id: "4",
            business_name: "Text id",
            properties: { intake_token: "5" },
          },
          {
            id: 42,
            business_name: "Placeholder Dental",
            properties: { intake_token: INTAKE_TOKEN },
          },
        ],
        meta: { total_pages: 1 },
      },
    }));
    const { resolveIntakeToken } = loadSyncro();

    expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
      status: "matched",
      organization: { id: 42 },
    });
    expect(await resolveIntakeToken("5")).toEqual({ status: "no_match" });
  });

  it.each([
    [
      { business_name: "  Placeholder Dental ", fullname: "Dana Office" },
      "Placeholder Dental",
    ],
    [{ business_name: "", fullname: "Dana Office" }, "Dana Office"],
    [{ business_name: null, fullname: " Dana Office " }, "Dana Office"],
    [{ business_name: 12, fullname: 34 }, ""],
    [{}, ""],
  ])("names the organization from %p as %p", async (names, expectedName) => {
    mockSyncro(() => ({
      status: 200,
      body: {
        customers: [
          { id: 42, ...names, properties: { intake_token: INTAKE_TOKEN } },
        ],
        meta: { total_pages: 1 },
      },
    }));
    const { resolveIntakeToken } = loadSyncro();

    expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
      organization: { id: 42, name: expectedName },
    });
  });

  it("reads every page of the customer list", async () => {
    const fetchMock = mockSyncro((url) => ({
      status: 200,
      body:
        url.searchParams.get("page") === "1"
          ? {
              customers: [{ id: 11, business_name: "Other", properties: {} }],
              meta: { total_pages: 2, page: 1 },
            }
          : { ...customersPage, meta: { total_pages: 2, page: 2 } },
    }));
    const { resolveIntakeToken } = loadSyncro();

    expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
      status: "matched",
      organization: { id: 42 },
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://boximity.syncromsp.com/api/v1/customers?page=1",
      "https://boximity.syncromsp.com/api/v1/customers?page=2",
    ]);
  });

  it("stops paging when a page comes back empty", async () => {
    const fetchMock = mockSyncro((url) => ({
      status: 200,
      body: {
        customers:
          url.searchParams.get("page") === "1" ? customersPage.customers : [],
        meta: { total_pages: 50 },
      },
    }));
    const { resolveIntakeToken } = loadSyncro();

    expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
      status: "matched",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("pages until an empty page when Syncro sends no page count", async () => {
    const fetchMock = mockSyncro((url) => {
      const page = url.searchParams.get("page");
      if (page === "1") {
        return {
          status: 200,
          body: { customers: [customersPage.customers[0]] },
        };
      }
      if (page === "2") {
        return {
          status: 200,
          body: { customers: [customersPage.customers[1]] },
        };
      }
      return { status: 200, body: { customers: [] } };
    });
    const { resolveIntakeToken } = loadSyncro();

    expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
      status: "matched",
      organization: { id: 42 },
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://boximity.syncromsp.com/api/v1/customers?page=1",
      "https://boximity.syncromsp.com/api/v1/customers?page=2",
      "https://boximity.syncromsp.com/api/v1/customers?page=3",
    ]);
  });

  it.each<[string, unknown]>([
    ["sends no page count", undefined],
    ["claims more pages than the limit", { total_pages: 500 }],
  ])(
    "gives up after 50 pages of a list that never ends when Syncro %s",
    async (_case, meta) => {
      const fetchMock = mockSyncro(() => ({
        status: 200,
        body: { customers: customersPage.customers, meta },
      }));
      const { resolveIntakeToken } = loadSyncro();

      // A list cut short is not a list to judge a token on
      expect(await resolveIntakeToken("not-a-real-token")).toEqual({
        status: "could_not_check",
        detail: "invalid_response",
      });
      expect(fetchMock).toHaveBeenCalledTimes(50);
    },
  );

  it("reads a list that ends exactly at the page limit", async () => {
    const fetchMock = mockSyncro(() => ({
      status: 200,
      body: { customers: customersPage.customers, meta: { total_pages: 50 } },
    }));
    const { resolveIntakeToken } = loadSyncro();

    expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
      status: "matched",
    });
    expect(fetchMock).toHaveBeenCalledTimes(50);
  });

  describe("when Syncro answers 200 with a list that cannot be the real one", () => {
    const START_IN_MS = Date.UTC(2026, 10, 12, 15, 0, 0);
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

    const degradedLists: [string, unknown[]][] = [
      ["an empty customer list", []],
      [
        "customers that carry no properties",
        [
          { id: 11, business_name: "Other Client" },
          { id: 42, business_name: "Placeholder Dental", properties: null },
        ],
      ],
    ];

    it.each(degradedLists)(
      "answers could not check for %s",
      async (_case, customers) => {
        mockSyncro(() => ({
          status: 200,
          body: { customers, meta: { total_pages: 1 } },
        }));
        const { resolveIntakeToken } = loadSyncro();

        expect(await resolveIntakeToken(INTAKE_TOKEN)).toEqual({
          status: "could_not_check",
          detail: "invalid_response",
        });
      },
    );

    it.each(degradedLists)(
      "keeps the last-known-good list, with a Sentry warning, over %s",
      async (_case, customers) => {
        const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
        mockSyncro(() => ({ status: 200, body: customersPage }));
        const { resolveIntakeToken } = loadSyncro();
        await resolveIntakeToken(INTAKE_TOKEN);

        mockSyncro(() => ({
          status: 200,
          body: { customers, meta: { total_pages: 1 } },
        }));
        now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS);

        expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
          status: "matched",
          organization: { id: 42, name: "Placeholder Dental" },
        });
        expect(mockCaptureMessage).toHaveBeenCalledWith(
          "Syncro customer list unavailable (invalid_response): serving the last-known-good copy",
          "warning",
        );
        // The degraded answer replaced nothing: the next read still matches
        expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
          status: "matched",
        });
      },
    );

    it("accepts a list in which one customer carries properties", async () => {
      mockSyncro(() => ({
        status: 200,
        body: {
          customers: [
            { id: 11, business_name: "Other Client" },
            { id: 12, business_name: "No Link Yet", properties: {} },
          ],
          meta: { total_pages: 1 },
        },
      }));
      const { resolveIntakeToken } = loadSyncro();

      expect(await resolveIntakeToken(INTAKE_TOKEN)).toEqual({
        status: "no_match",
      });
    });
  });

  describe("when Syncro cannot be asked and nothing is cached", () => {
    it.each<[string, SyncroReply, string]>([
      ["the network fails", new TypeError("fetch failed"), "network_error"],
      ["Syncro answers 500", { status: 500 }, "HTTP 500"],
      [
        "Syncro answers 401",
        { status: 401, body: { error: "Unauthorized" } },
        "HTTP 401",
      ],
      ["the body is not JSON", { status: 200 }, "invalid_response"],
      [
        "the body has no customer list",
        { status: 200, body: { customers: "none" } },
        "invalid_response",
      ],
      [
        "the body is a list",
        { status: 200, body: [customersPage] },
        "invalid_response",
      ],
    ])("answers could not check when %s", async (_case, reply, detail) => {
      mockSyncro(() => reply);
      const { resolveIntakeToken } = loadSyncro();

      const result = await resolveIntakeToken(INTAKE_TOKEN);

      expect(result).toEqual({ status: "could_not_check", detail });
      // Stale-serving warns; a cold failure is the caller's to report
      expect(mockCaptureMessage).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        `Syncro customer list unavailable (${detail})`,
      );
    });

    it.each([
      { SYNCRO_API_KEY: "" },
      { SYNCRO_SUBDOMAIN: "" },
      { SYNCRO_API_KEY: "  " },
    ])("treats the missing config %p as an unreachable Syncro", async (env) => {
      process.env = { ...process.env, ...env };
      const fetchMock = mockSyncro(() => ({
        status: 200,
        body: customersPage,
      }));
      const { resolveIntakeToken } = loadSyncro();

      expect(await resolveIntakeToken(INTAKE_TOKEN)).toEqual({
        status: "could_not_check",
        detail: "missing_config",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("does not judge the token on a partial list when a later page fails", async () => {
      mockSyncro((url) =>
        url.searchParams.get("page") === "1"
          ? {
              status: 200,
              body: { ...customersPage, meta: { total_pages: 2 } },
            }
          : { status: 503 },
      );
      const { resolveIntakeToken } = loadSyncro();

      expect(await resolveIntakeToken("not-a-real-token")).toEqual({
        status: "could_not_check",
        detail: "HTTP 503",
      });
    });

    it("never throws, even when reading the body throws", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => {
          throw new Error("boom");
        },
      });
      const { resolveIntakeToken } = loadSyncro();

      expect(await resolveIntakeToken(INTAKE_TOKEN)).toEqual({
        status: "could_not_check",
        detail: "invalid_response",
      });
    });
  });

  describe("caching", () => {
    const START_IN_MS = Date.UTC(2026, 10, 12, 15, 0, 0);
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

    /** The list once the client's token has been cleared in Syncro */
    const customersWithoutTheToken = {
      customers: [customersPage.customers[0]],
      meta: { total_pages: 1 },
    };

    it("answers from memory for five minutes, then asks Syncro again", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
      const fetchMock = mockSyncro(() => ({
        status: 200,
        body: customersPage,
      }));
      const { resolveIntakeToken } = loadSyncro();

      await resolveIntakeToken(INTAKE_TOKEN);
      now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS - 1);
      await resolveIntakeToken(INTAKE_TOKEN);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS);
      await resolveIntakeToken(INTAKE_TOKEN);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("honours a revoked token once the cache expires", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
      mockSyncro(() => ({ status: 200, body: customersPage }));
      const { resolveIntakeToken } = loadSyncro();
      await resolveIntakeToken(INTAKE_TOKEN);

      mockSyncro(() => ({ status: 200, body: customersWithoutTheToken }));
      expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
        status: "matched",
      });

      now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS);
      expect(await resolveIntakeToken(INTAKE_TOKEN)).toEqual({
        status: "no_match",
      });
    });

    it("serves the last-known-good list, with a Sentry warning, while Syncro is unreachable", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
      mockSyncro(() => ({ status: 200, body: customersPage }));
      const { resolveIntakeToken } = loadSyncro();
      await resolveIntakeToken(INTAKE_TOKEN);

      mockSyncro(() => new TypeError("fetch failed"));
      now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS);
      const result = await resolveIntakeToken(INTAKE_TOKEN);

      expect(result).toEqual({
        status: "matched",
        organization: { id: 42, name: "Placeholder Dental" },
      });
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Syncro customer list unavailable (network_error): serving the last-known-good copy",
        "warning",
      );
      expect(console.error).toHaveBeenCalledWith(
        "Syncro customer list unavailable (network_error): serving the last-known-good copy",
      );
    });

    it("still answers no match from the last-known-good list", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
      mockSyncro(() => ({ status: 200, body: customersPage }));
      const { resolveIntakeToken } = loadSyncro();
      await resolveIntakeToken(INTAKE_TOKEN);

      mockSyncro(() => ({ status: 502 }));
      now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS);

      expect(await resolveIntakeToken("not-a-real-token")).toEqual({
        status: "no_match",
      });
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Syncro customer list unavailable (HTTP 502): serving the last-known-good copy",
        "warning",
      );
    });

    it("keeps serving the last-known-good list for as long as the outage lasts, retrying each time", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
      mockSyncro(() => ({ status: 200, body: customersPage }));
      const { resolveIntakeToken } = loadSyncro();
      await resolveIntakeToken(INTAKE_TOKEN);

      const failingFetch = mockSyncro(() => new TypeError("fetch failed"));
      now.mockReturnValue(START_IN_MS + 24 * 60 * 60 * 1000);

      expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
        status: "matched",
      });
      expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
        status: "matched",
      });
      expect(failingFetch).toHaveBeenCalledTimes(2);
    });

    it("returns to the fresh list when Syncro recovers", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
      mockSyncro(() => ({ status: 200, body: customersPage }));
      const { resolveIntakeToken } = loadSyncro();
      await resolveIntakeToken(INTAKE_TOKEN);

      mockSyncro(() => new TypeError("fetch failed"));
      now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS);
      await resolveIntakeToken(INTAKE_TOKEN);

      mockSyncro(() => ({ status: 200, body: customersWithoutTheToken }));
      expect(await resolveIntakeToken(INTAKE_TOKEN)).toEqual({
        status: "no_match",
      });
    });

    it("does not cache a failed read", async () => {
      mockSyncro(() => ({ status: 500 }));
      const { resolveIntakeToken } = loadSyncro();
      await resolveIntakeToken(INTAKE_TOKEN);

      mockSyncro(() => ({ status: 200, body: customersPage }));

      expect(await resolveIntakeToken(INTAKE_TOKEN)).toMatchObject({
        status: "matched",
      });
    });
  });
});

describe("findAuthorizedContact", () => {
  const START_IN_MS = Date.UTC(2026, 10, 12, 15, 0, 0);
  const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

  const contactsPage = {
    contacts: [
      {
        id: 501,
        customer_id: 42,
        name: "Dana Office",
        email: "Dana.Office@Client.example",
        properties: { intake_authorized: "1" },
      },
      {
        id: 502,
        customer_id: 42,
        name: "Sam Existing",
        email: "sam@client.example",
        properties: { intake_authorized: "0" },
      },
    ],
    meta: { total_pages: 1 },
  };

  function contactWithCheckbox(value: unknown) {
    return {
      contacts: [
        {
          id: 501,
          customer_id: 42,
          name: "Dana Office",
          email: "dana@client.example",
          properties: { intake_authorized: value },
        },
      ],
      meta: { total_pages: 1 },
    };
  }

  it("finds the organization's authorized contact by email, ignoring case and whitespace", async () => {
    const fetchMock = mockSyncro(() => ({ status: 200, body: contactsPage }));
    const { findAuthorizedContact } = loadSyncro();

    const result = await findAuthorizedContact(
      42,
      "  dana.office@CLIENT.example ",
    );

    expect(result).toEqual({
      status: "authorized",
      contact: {
        id: 501,
        name: "Dana Office",
        email: "dana.office@client.example",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://boximity.syncromsp.com/api/v1/contacts?customer_id=42&page=1",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-syncro-key",
        },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("does not authorize a contact whose checkbox is unticked", async () => {
    mockSyncro(() => ({ status: 200, body: contactsPage }));
    const { findAuthorizedContact } = loadSyncro();

    expect(await findAuthorizedContact(42, "sam@client.example")).toEqual({
      status: "not_authorized",
    });
  });

  it("does not authorize an email no contact has", async () => {
    mockSyncro(() => ({ status: 200, body: contactsPage }));
    const { findAuthorizedContact } = loadSyncro();

    expect(
      await findAuthorizedContact(42, "mallory@elsewhere.example"),
    ).toEqual({ status: "not_authorized" });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it.each([true, 1, "1", "true", "TRUE", " yes ", "on"])(
    "reads the checkbox value %p as ticked",
    async (value) => {
      mockSyncro(() => ({ status: 200, body: contactWithCheckbox(value) }));
      const { findAuthorizedContact } = loadSyncro();

      expect(
        await findAuthorizedContact(42, "dana@client.example"),
      ).toMatchObject({ status: "authorized", contact: { id: 501 } });
    },
  );

  it.each([false, 0, 2, "0", "false", "", "no", "off", null, undefined, {}])(
    "reads the checkbox value %p as unticked",
    async (value) => {
      mockSyncro(() => ({ status: 200, body: contactWithCheckbox(value) }));
      const { findAuthorizedContact } = loadSyncro();

      expect(await findAuthorizedContact(42, "dana@client.example")).toEqual({
        status: "not_authorized",
      });
    },
  );

  it("skips contacts whose record is malformed", async () => {
    mockSyncro(() => ({
      status: 200,
      body: {
        contacts: [
          null,
          { id: 1, customer_id: 42, email: "noprops@client.example" },
          {
            id: "2",
            customer_id: 42,
            email: "textid@client.example",
            properties: { intake_authorized: "1" },
          },
          {
            id: 3,
            customer_id: 42,
            email: 7,
            properties: { intake_authorized: "1" },
          },
          {
            id: 4,
            customer_id: 42,
            email: " ",
            properties: { intake_authorized: "1" },
          },
          {
            id: 5,
            customer_id: 42,
            name: 9,
            email: "noname@client.example",
            properties: { intake_authorized: "1" },
          },
        ],
        meta: { total_pages: 1 },
      },
    }));
    const { findAuthorizedContact } = loadSyncro();

    for (const email of [
      "noprops@client.example",
      "textid@client.example",
      "7",
      "",
      " ",
    ]) {
      expect(await findAuthorizedContact(42, email)).toEqual({
        status: "not_authorized",
      });
    }
    expect(await findAuthorizedContact(42, "noname@client.example")).toEqual({
      status: "authorized",
      contact: { id: 5, name: "", email: "noname@client.example" },
    });
  });

  it("reads every page of the contact list", async () => {
    const fetchMock = mockSyncro((url) => ({
      status: 200,
      body:
        url.searchParams.get("page") === "1"
          ? { contacts: [contactsPage.contacts[1]], meta: { total_pages: 2 } }
          : { contacts: [contactsPage.contacts[0]], meta: { total_pages: 2 } },
    }));
    const { findAuthorizedContact } = loadSyncro();

    expect(
      await findAuthorizedContact(42, "dana.office@client.example"),
    ).toMatchObject({ status: "authorized", contact: { id: 501 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps each organization's contacts apart", async () => {
    const fetchMock = mockSyncro((url) => ({
      status: 200,
      body:
        url.searchParams.get("customer_id") === "42"
          ? contactsPage
          : { contacts: [] },
    }));
    const { findAuthorizedContact } = loadSyncro();

    expect(
      await findAuthorizedContact(42, "dana.office@client.example"),
    ).toMatchObject({ status: "authorized" });
    expect(
      await findAuthorizedContact(43, "dana.office@client.example"),
    ).toEqual({ status: "not_authorized" });
    expect(
      await findAuthorizedContact(42, "dana.office@client.example"),
    ).toMatchObject({ status: "authorized" });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://boximity.syncromsp.com/api/v1/contacts?customer_id=42&page=1",
      "https://boximity.syncromsp.com/api/v1/contacts?customer_id=43&page=1",
    ]);
  });

  it.each<[string, Record<string, unknown>]>([
    ["belongs to another organization", { customer_id: 43 }],
    ["names no organization", {}],
    ["names its organization as text", { customer_id: "42" }],
  ])(
    "does not authorize a contact that %s, even when Syncro returns it for this one",
    async (_case, owner) => {
      // A Syncro that ignores the customer_id filter answers with everybody
      mockSyncro(() => ({
        status: 200,
        body: {
          contacts: [
            {
              id: 601,
              name: "Robin Elsewhere",
              email: "robin@elsewhere.example",
              properties: { intake_authorized: "1" },
              ...owner,
            },
            contactsPage.contacts[0],
          ],
          meta: { total_pages: 1 },
        },
      }));
      const { findAuthorizedContact } = loadSyncro();

      expect(
        await findAuthorizedContact(42, "robin@elsewhere.example"),
      ).toEqual({ status: "not_authorized" });
      expect(
        await findAuthorizedContact(42, "dana.office@client.example"),
      ).toMatchObject({ status: "authorized", contact: { id: 501 } });
    },
  );

  it.each<[string, SyncroReply, string]>([
    ["the network fails", new TypeError("fetch failed"), "network_error"],
    ["Syncro answers 500", { status: 500 }, "HTTP 500"],
    ["Syncro answers 403", { status: 403 }, "HTTP 403"],
    [
      "the body has no contact list",
      { status: 200, body: {} },
      "invalid_response",
    ],
  ])(
    "answers could not check, not a rejection, when %s and nothing is cached",
    async (_case, reply, detail) => {
      mockSyncro(() => reply);
      const { findAuthorizedContact } = loadSyncro();

      expect(await findAuthorizedContact(42, "dana@client.example")).toEqual({
        status: "could_not_check",
        detail,
      });
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    },
  );

  it("answers could not check when Syncro is not configured", async () => {
    process.env = { ...process.env, SYNCRO_API_KEY: undefined };
    const fetchMock = mockSyncro(() => ({ status: 200, body: contactsPage }));
    const { findAuthorizedContact } = loadSyncro();

    expect(await findAuthorizedContact(42, "dana@client.example")).toEqual({
      status: "could_not_check",
      detail: "missing_config",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers from memory for five minutes, then honours a removed contact", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
    mockSyncro(() => ({ status: 200, body: contactsPage }));
    const { findAuthorizedContact } = loadSyncro();
    await findAuthorizedContact(42, "dana.office@client.example");

    const secondFetch = mockSyncro(() => ({
      status: 200,
      body: { contacts: [] },
    }));
    now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS - 1);
    expect(
      await findAuthorizedContact(42, "dana.office@client.example"),
    ).toMatchObject({ status: "authorized" });
    expect(secondFetch).not.toHaveBeenCalled();

    now.mockReturnValue(START_IN_MS + FIVE_MINUTES_IN_MS);
    expect(
      await findAuthorizedContact(42, "dana.office@client.example"),
    ).toEqual({ status: "not_authorized" });
  });

  it("serves the last-known-good contacts, with a Sentry warning, while Syncro is unreachable", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(START_IN_MS);
    mockSyncro(() => ({ status: 200, body: contactsPage }));
    const { findAuthorizedContact } = loadSyncro();
    await findAuthorizedContact(42, "dana.office@client.example");

    mockSyncro(() => ({ status: 503 }));
    now.mockReturnValue(START_IN_MS + 60 * 60 * 1000);

    expect(
      await findAuthorizedContact(42, "dana.office@client.example"),
    ).toEqual({
      status: "authorized",
      contact: {
        id: 501,
        name: "Dana Office",
        email: "dana.office@client.example",
      },
    });
    expect(await findAuthorizedContact(42, "sam@client.example")).toEqual({
      status: "not_authorized",
    });
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      "Syncro contact list unavailable (HTTP 503): serving the last-known-good copy",
      "warning",
    );
  });

  it("cannot check an organization it has never read, even with another one cached", async () => {
    mockSyncro(() => ({ status: 200, body: contactsPage }));
    const { findAuthorizedContact } = loadSyncro();
    await findAuthorizedContact(42, "dana.office@client.example");

    mockSyncro(() => new TypeError("fetch failed"));

    expect(
      await findAuthorizedContact(43, "dana.office@client.example"),
    ).toEqual({ status: "could_not_check", detail: "network_error" });
  });
});

describe("createIntakeTicket", () => {
  const ticket = {
    organizationId: 42,
    contactId: 501,
    subject: "Leaver: John Roe, last day 2026-11-30",
    comment: "Leaver request\n\nYour details\nYour name: Dana Office",
  };

  function sentRequest(fetchMock: jest.Mock): {
    url: string;
    init: RequestInit;
    body: Record<string, unknown>;
  } {
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    return { url, init, body: JSON.parse(String(init.body)) };
  }

  it("creates a New Onboarding/Offboarding ticket for the organization and contact, with a public emailed comment", async () => {
    const fetchMock = mockSyncro(() => ({
      status: 200,
      body: { ticket: { id: 9001, number: 3417 } },
    }));
    const { createIntakeTicket } = loadSyncro();

    const result = await createIntakeTicket(ticket);

    expect(result).toEqual({ ok: true, ticketId: 9001, ticketNumber: "3417" });
    const { url, init, body } = sentRequest(fetchMock);
    expect(url).toBe("https://boximity.syncromsp.com/api/v1/tickets");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer test-syncro-key",
    });
    expect(body).toEqual({
      customer_id: 42,
      contact_id: 501,
      subject: "Leaver: John Roe, last day 2026-11-30",
      problem_type: "Onboarding/Offboarding",
      status: "New",
      comments_attributes: [
        {
          subject: "Initial Issue",
          body: "Leaver request\n\nYour details\nYour name: Dana Office",
          hidden: false,
          do_not_email: false,
        },
      ],
    });
  });

  it.each([
    [
      { ticket: { id: 9001, number: "3417" } },
      { ok: true, ticketId: 9001, ticketNumber: "3417" },
    ],
    [{ ticket: { id: 9001 } }, { ok: true, ticketId: 9001 }],
    [{ ticket: { id: 9001, number: "" } }, { ok: true, ticketId: 9001 }],
    [{ ticket: { id: 9001, number: null } }, { ok: true, ticketId: 9001 }],
    [
      { ticket: { id: "9001", number: 3417 } },
      { ok: true, ticketNumber: "3417" },
    ],
    [{ ticket: null }, { ok: true }],
    [{}, { ok: true }],
    [undefined, { ok: true }],
  ])("reads the ticket reference from %p", async (body, expected) => {
    mockSyncro(() => ({ status: 201, body }));
    const { createIntakeTicket } = loadSyncro();

    expect(await createIntakeTicket(ticket)).toEqual(expected);
  });

  it("marks the subject of a ticket created by the staging site", async () => {
    process.env = { ...process.env, NEXT_PUBLIC_ENVIRONMENT: "staging" };
    const fetchMock = mockSyncro(() => ({ status: 200, body: {} }));
    const { createIntakeTicket } = loadSyncro();

    await createIntakeTicket(ticket);

    expect(sentRequest(fetchMock).body.subject).toBe(
      "[STAGING] Leaver: John Roe, last day 2026-11-30",
    );
  });

  it("reports a missing config as unreachable without calling Syncro", async () => {
    process.env = { ...process.env, SYNCRO_SUBDOMAIN: undefined };
    const fetchMock = mockSyncro(() => ({ status: 200, body: {} }));
    const { createIntakeTicket, describeSyncroWriteOutcome } = loadSyncro();

    const result = await createIntakeTicket(ticket);

    expect(result).toEqual({
      ok: false,
      reason: "unreachable",
      code: "missing_config",
    });
    expect(describeSyncroWriteOutcome(result)).toBe(
      "unreachable (missing_config)",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Syncro ticket skipped: SYNCRO_SUBDOMAIN or SYNCRO_API_KEY is not set",
    );
  });

  it("reports a network failure as unreachable", async () => {
    const networkError = new TypeError("fetch failed");
    mockSyncro(() => networkError);
    const { createIntakeTicket } = loadSyncro();

    expect(await createIntakeTicket(ticket)).toEqual({
      ok: false,
      reason: "unreachable",
      code: "network_error",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Syncro ticket request failed:",
      networkError,
    );
  });

  it("reports a Syncro 5xx as unreachable", async () => {
    mockSyncro(() => ({ status: 502 }));
    const { createIntakeTicket, describeSyncroWriteOutcome } = loadSyncro();

    const result = await createIntakeTicket(ticket);

    expect(result).toEqual({
      ok: false,
      reason: "unreachable",
      code: "server_error",
      status: 502,
    });
    expect(describeSyncroWriteOutcome(result)).toBe(
      "unreachable (server_error, HTTP 502)",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Syncro ticket request failed: HTTP 502",
    );
  });

  it("reports a Syncro 4xx as a rejection, with Syncro's message kept out of the summary and the log", async () => {
    // Syncro's validation errors can quote the value they reject
    const echoingMessage = "Subject 'Leaver: John Roe' is too long";
    mockSyncro(() => ({ status: 422, body: { message: echoingMessage } }));
    const { createIntakeTicket, describeSyncroWriteOutcome } = loadSyncro();

    const result = await createIntakeTicket(ticket);

    expect(result).toEqual({
      ok: false,
      reason: "rejected",
      status: 422,
      message: echoingMessage,
    });
    expect(describeSyncroWriteOutcome(result)).toBe("rejected (HTTP 422)");
    expect(jest.mocked(console.error).mock.calls).toEqual([
      ["Syncro rejected the ticket: HTTP 422"],
    ]);
  });

  it("summarizes a created ticket as ok", async () => {
    mockSyncro(() => ({ status: 200, body: { ticket: { id: 1, number: 2 } } }));
    const { createIntakeTicket, describeSyncroWriteOutcome } = loadSyncro();

    expect(describeSyncroWriteOutcome(await createIntakeTicket(ticket))).toBe(
      "ok",
    );
  });
});

describe("a Syncro that never answers", () => {
  const TIMEOUT_IN_MS = 10_000;

  /** Every request hangs until its abort signal fires, as a real fetch does. */
  function mockHungSyncro(): jest.Mock {
    const mock = jest.fn(
      (_input: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(
              new DOMException("This operation was aborted", "AbortError"),
            );
          });
        }),
    );
    global.fetch = mock as unknown as typeof fetch;
    return mock;
  }

  /** Syncro answers `status`, then the body stalls until the request is aborted. */
  function mockStalledBody(status: number): void {
    global.fetch = jest.fn((_input: string, init?: RequestInit) =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(
                new DOMException("This operation was aborted", "AbortError"),
              );
            });
          }),
      }),
    ) as unknown as typeof fetch;
  }

  const STILL_WAITING = "still waiting on Syncro";

  /** What `pending` has settled to once `elapsedInMs` has passed, if anything. */
  async function outcomeAfter<Result>(
    pending: Promise<Result>,
    elapsedInMs: number,
  ): Promise<Result | typeof STILL_WAITING> {
    await jest.advanceTimersByTimeAsync(elapsedInMs);
    return Promise.race([pending, Promise.resolve(STILL_WAITING)]);
  }

  const ticket = {
    organizationId: 42,
    contactId: 501,
    subject: "Leaver: John Roe, last day 2026-11-30",
    comment: "Leaver request",
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  it("gives up on the customer list after ten seconds and answers could not check", async () => {
    mockHungSyncro();
    const { resolveIntakeToken } = loadSyncro();
    const pending = resolveIntakeToken(INTAKE_TOKEN);

    expect(await outcomeAfter(pending, TIMEOUT_IN_MS - 1)).toBe(STILL_WAITING);
    expect(await outcomeAfter(pending, 1)).toEqual({
      status: "could_not_check",
      detail: "network_error",
    });
  });

  it("gives up on a customer list whose body stalls", async () => {
    mockStalledBody(200);
    const { resolveIntakeToken } = loadSyncro();

    const result = await outcomeAfter(
      resolveIntakeToken(INTAKE_TOKEN),
      TIMEOUT_IN_MS,
    );

    expect(result).toEqual({
      status: "could_not_check",
      detail: "network_error",
    });
  });

  it("serves the last-known-good customer list, with a Sentry warning", async () => {
    mockSyncro(() => ({ status: 200, body: customersPage }));
    const { resolveIntakeToken } = loadSyncro();
    await resolveIntakeToken(INTAKE_TOKEN);
    jest.advanceTimersByTime(5 * 60 * 1000);

    mockHungSyncro();
    const result = await outcomeAfter(
      resolveIntakeToken(INTAKE_TOKEN),
      TIMEOUT_IN_MS,
    );

    expect(result).toEqual({
      status: "matched",
      organization: { id: 42, name: "Placeholder Dental" },
    });
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      "Syncro customer list unavailable (network_error): serving the last-known-good copy",
      "warning",
    );
  });

  it("gives up on the contact list and leaves authorization unverified", async () => {
    mockHungSyncro();
    const { findAuthorizedContact } = loadSyncro();

    const result = await outcomeAfter(
      findAuthorizedContact(42, "dana@client.example"),
      TIMEOUT_IN_MS,
    );

    expect(result).toEqual({
      status: "could_not_check",
      detail: "network_error",
    });
  });

  it("gives up on the ticket after ten seconds and reports Syncro unreachable", async () => {
    mockHungSyncro();
    const { createIntakeTicket } = loadSyncro();
    const pending = createIntakeTicket(ticket);

    expect(await outcomeAfter(pending, TIMEOUT_IN_MS - 1)).toBe(STILL_WAITING);
    expect(await outcomeAfter(pending, 1)).toEqual({
      ok: false,
      reason: "unreachable",
      code: "network_error",
    });
  });

  it("counts a ticket Syncro accepted as created when the body stalls", async () => {
    mockStalledBody(201);
    const { createIntakeTicket } = loadSyncro();

    const result = await outcomeAfter(
      createIntakeTicket(ticket),
      TIMEOUT_IN_MS,
    );

    expect(result).toEqual({ ok: true });
  });

  it("stops the clock once Syncro has answered", async () => {
    mockSyncro(() => ({ status: 200, body: customersPage }));
    const { resolveIntakeToken } = loadSyncro();

    await resolveIntakeToken(INTAKE_TOKEN);

    expect(jest.getTimerCount()).toBe(0);
  });
});
