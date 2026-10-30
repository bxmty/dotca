import { scrubLinkTokens } from "@/lib/sentry-scrub";

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
