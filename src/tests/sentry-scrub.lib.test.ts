import { isIntakePagePath, scrubLinkTokens } from "@/lib/sentry-scrub";

describe("scrubLinkTokens", () => {
  it.each([
    ["url.full", "https://boximity.ca/security-assessment/call?t=abc.def-_1"],
    ["http.target", "/security-assessment/call?from=mail&t=abc.def-_1#top"],
    ["url.query", "?t=abc.def-_1"],
    ["bare query string", "t=abc.def-_1&from=mail"],
  ])("removes the token from %s", (_name, value) => {
    const scrubbed = scrubLinkTokens(value);

    expect(scrubbed).not.toContain("abc.def-_1");
    expect(scrubbed).toContain("t=[Filtered]");
  });

  it("keeps the rest of the URL", () => {
    expect(scrubLinkTokens("/call?from=mail&t=abc&x=1#top")).toBe(
      "/call?from=mail&t=[Filtered]&x=1#top",
    );
  });

  it("leaves parameters merely ending in t alone", () => {
    expect(scrubLinkTokens("/blog?sort=asc&limit=5")).toBe(
      "/blog?sort=asc&limit=5",
    );
  });

  it("reaches strings nested in objects and arrays without changing the input", () => {
    const span = {
      name: "GET /security-assessment/call",
      attributes: {
        "url.full": { value: "/call?t=abc", type: "string" },
        "http.status_code": 200,
      },
      spans: [{ data: { "url.query": "?t=abc" } }],
      missing: null,
    };

    expect(scrubLinkTokens(span)).toEqual({
      name: "GET /security-assessment/call",
      attributes: {
        "url.full": { value: "/call?t=[Filtered]", type: "string" },
        "http.status_code": 200,
      },
      spans: [{ data: { "url.query": "?t=[Filtered]" } }],
      missing: null,
    });
    expect(span.attributes["url.full"].value).toBe("/call?t=abc");
  });
});

describe("scrubLinkTokens: intake token path segment (#565)", () => {
  // Made up: stands in for a client's intake_token value
  const TOKEN = "abc.def-_1";

  it.each([
    ["url.full", `https://boximity.ca/service-request/${TOKEN}`],
    ["http.target with a query", `/service-request/${TOKEN}?_rsc=1abc`],
    ["a trailing slash", `/service-request/${TOKEN}/`],
    ["a Referer header", `https://boximity.ca/service-request/${TOKEN}#top`],
    ["a span name", `GET /service-request/${TOKEN}`],
    ["an encoded URL", `next=%2Fservice-request%2F${TOKEN}&from=mail`],
    ["a URL inside JSON", `{"href":"/service-request/${TOKEN}"}`],
  ])("removes the token from %s", (_name, value) => {
    const scrubbed = scrubLinkTokens(value);

    expect(scrubbed).not.toContain(TOKEN);
    expect(scrubbed).toContain("[Filtered]");
  });

  it("keeps the rest of the URL", () => {
    expect(
      scrubLinkTokens(`https://boximity.ca/service-request/${TOKEN}?_rsc=1`),
    ).toBe("https://boximity.ca/service-request/[Filtered]?_rsc=1");
    expect(scrubLinkTokens(`a=%2Fservice-request%2F${TOKEN}&from=mail`)).toBe(
      "a=%2Fservice-request%2F[Filtered]&from=mail",
    );
    expect(scrubLinkTokens(`{"href":"/service-request/${TOKEN}"}`)).toBe(
      '{"href":"/service-request/[Filtered]"}',
    );
  });

  it.each([
    "GET /service-request/[token]",
    "/service-request/:token",
    "app:///_next/server/app/service-request/[token]/page.js",
    "POST /api/service-request",
    "https://boximity.ca/api/service-request?x=1",
  ])("leaves %s alone: it holds no token", (value) => {
    expect(scrubLinkTokens(value)).toBe(value);
  });
});

describe("scrubLinkTokens: intake submission body (#565)", () => {
  const BODY = '{"token":"k3Zr","fields":{"requesterEmail":"a@b.ca"}}';

  it("drops the request body from an event raised by the intake route", () => {
    const event = {
      message: "Service request delivery failure",
      request: {
        method: "POST",
        url: "https://boximity.ca/api/service-request",
        data: BODY,
        headers: { "user-agent": "jest" },
      },
    };

    const scrubbed = scrubLinkTokens(event);

    expect(scrubbed.request).toEqual({
      method: "POST",
      url: "https://boximity.ca/api/service-request",
      headers: { "user-agent": "jest" },
    });
    expect(JSON.stringify(scrubbed)).not.toContain("k3Zr");
    expect(event.request.data).toBe(BODY);
  });

  it("drops the body attribute from an intake transaction and span", () => {
    const transaction = {
      transaction: "POST /api/service-request",
      contexts: {
        trace: { data: { "http.request.body.data": BODY, "http.route": "x" } },
      },
      spans: [{ data: { "http.request.body.data": BODY } }],
    };
    const streamedSpan = {
      name: "POST /api/service-request",
      attributes: {
        "http.request.body.data": { value: BODY, type: "string" },
        "http.request.method": { value: "POST", type: "string" },
      },
    };

    expect(scrubLinkTokens(transaction)).toEqual({
      transaction: "POST /api/service-request",
      contexts: { trace: { data: { "http.route": "x" } } },
      spans: [{ data: {} }],
    });
    expect(scrubLinkTokens(streamedSpan)).toEqual({
      name: "POST /api/service-request",
      attributes: {
        "http.request.method": { value: "POST", type: "string" },
      },
    });
  });

  it("keeps the request body of every other route", () => {
    const event = {
      request: { url: "https://boximity.ca/api/contact", data: '{"a":1}' },
      contexts: { trace: { data: { "http.request.body.data": '{"a":1}' } } },
    };

    expect(scrubLinkTokens(event)).toEqual(event);
  });

  it("keeps a `data` key that is not the request body", () => {
    const event = {
      request: { url: "https://boximity.ca/api/service-request" },
      breadcrumbs: [{ category: "fetch", data: { status_code: 503 } }],
    };

    expect(scrubLinkTokens(event)).toEqual(event);
  });
});

describe("isIntakePagePath", () => {
  it.each([
    "/service-request/k3Zr",
    "/service-request/k3Zr/",
    "https://boximity.ca/service-request/k3Zr?x=1",
  ])("is true for %s", (href) => {
    expect(isIntakePagePath(href)).toBe(true);
  });

  it.each(["/", "/contact", "/api/service-request", "/service-request"])(
    "is false for %s",
    (href) => {
      expect(isIntakePagePath(href)).toBe(false);
    },
  );
});
