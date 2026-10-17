/**
 * @jest-environment node
 */
import path from "path";
import * as Sentry from "@sentry/nextjs";
import { POST } from "@/app/api/lead-magnet/route";
import { createSyncroLead } from "@/lib/syncro-leads";
import { addResendMarketingContact } from "@/lib/resend-marketing";
import {
  sendLeadMagnetDeliveryEmail,
  sendWebmasterNotification,
} from "@/lib/notify";
import { verifyLeadMagnetToken } from "@/lib/lead-magnet-token";
import { resetRateLimits } from "@/lib/rate-limit";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
  sendLeadMagnetDeliveryEmail: jest.fn(),
}));
// The stubs run for real (they throw) unless a test overrides one call to
// exercise the path that opens up once #596-601 replaces them.
jest.mock("@/lib/syncro-leads", () => {
  const actual = jest.requireActual("@/lib/syncro-leads");
  return { createSyncroLead: jest.fn(actual.createSyncroLead) };
});
jest.mock("@/lib/resend-marketing", () => {
  const actual = jest.requireActual("@/lib/resend-marketing");
  return {
    addResendMarketingContact: jest.fn(actual.addResendMarketingContact),
  };
});

const mockCreateSyncroLead = createSyncroLead as jest.Mock;
const mockAddResendMarketingContact = addResendMarketingContact as jest.Mock;
const mockWebmasterNotification = sendWebmasterNotification as jest.Mock;
const mockDeliveryEmail = sendLeadMagnetDeliveryEmail as jest.Mock;

const FIXTURE_DIR = path.join(__dirname, "fixtures", "lead-magnets");
const SLUG = "test-fixture-guide";
const EMAIL = "jane.doe@example.com";
const UNAVAILABLE_COPY =
  "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.";
const originalEnv = process.env;

function post(body: unknown, { isRawBody = false } = {}) {
  return POST(
    new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.7",
      },
      body: isRawBody ? String(body) : JSON.stringify(body),
    }),
  );
}

async function expectResponse(
  response: Response,
  status: number,
  body: unknown,
) {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual(body);
}

describe("POST /api/lead-magnet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimits();
    process.env = {
      ...originalEnv,
      LEAD_MAGNET_CONTENT_DIR: FIXTURE_DIR,
      LEAD_MAGNET_SIGNING_SECRET: "s".repeat(64),
    };
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockWebmasterNotification.mockResolvedValue(true);
    mockDeliveryEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("returns 400 for a malformed JSON body", async () => {
    await expectResponse(await post("{not json", { isRawBody: true }), 400, {
      error: "Request body must be valid JSON",
    });
  });

  it("fakes success and records nothing when the honeypot is filled", async () => {
    await expectResponse(
      await post({ slug: SLUG, email: EMAIL, website: "https://spam.example" }),
      200,
      { success: true },
    );
    expect(mockCreateSyncroLead).not.toHaveBeenCalled();
    expect(mockDeliveryEmail).not.toHaveBeenCalled();
  });

  it("rate limits the sixth submission from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      await post({ slug: SLUG, email: EMAIL });
    }

    await expectResponse(await post({ slug: SLUG, email: EMAIL }), 429, {
      error: "Too many submissions. Please try again later.",
    });
    expect(mockCreateSyncroLead).toHaveBeenCalledTimes(5);
  });

  it.each([
    ["an unknown slug", "no-such-guide"],
    ["an unpublished magnet", "unpublished-fixture-guide"],
    ["a traversal attempt", "../../.env"],
    ["a missing slug", undefined],
  ])("returns 404 for %s", async (_name, slug) => {
    await expectResponse(await post({ slug, email: EMAIL }), 404, {
      error: "Resource not found",
    });
    expect(mockCreateSyncroLead).not.toHaveBeenCalled();
  });

  it("returns 400 when the email is missing", async () => {
    await expectResponse(await post({ slug: SLUG }), 400, {
      error: "Email is required",
    });
  });

  it.each(["not-an-email", "jane@example", 42])(
    "returns 400 for the invalid email %p",
    async (email) => {
      await expectResponse(await post({ slug: SLUG, email }), 400, {
        error: "Please enter a valid email address",
      });
      expect(mockCreateSyncroLead).not.toHaveBeenCalled();
    },
  );

  it("returns 503 with the failure copy while createSyncroLead is a stub", async () => {
    await expectResponse(
      await post({ slug: SLUG, email: EMAIL, wantsBrief: true }),
      503,
      { error: UNAVAILABLE_COPY },
    );
    expect(mockCreateSyncroLead).toHaveBeenCalledWith({
      email: EMAIL,
      source: `lead-magnet:${SLUG}`,
    });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("not yet implemented"),
      "error",
    );
    expect(mockAddResendMarketingContact).not.toHaveBeenCalled();
    expect(mockDeliveryEmail).not.toHaveBeenCalled();
    expect(mockWebmasterNotification).not.toHaveBeenCalled();
  });

  describe("once the lead is recorded", () => {
    beforeEach(() => {
      mockCreateSyncroLead.mockResolvedValueOnce(undefined);
    });

    it("returns a signed download link and sends both notifications", async () => {
      const response = await post({ slug: SLUG, email: EMAIL });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      const downloadUrl = new URL(body.downloadUrl, "https://boximity.ca");
      expect(downloadUrl.pathname).toBe("/api/lead-magnet/download");
      expect(downloadUrl.searchParams.get("slug")).toBe(SLUG);
      expect(
        verifyLeadMagnetToken({
          slug: SLUG,
          token: downloadUrl.searchParams.get("token") ?? "",
        }).isValid,
      ).toBe(true);

      expect(mockDeliveryEmail).toHaveBeenCalledWith({
        to: EMAIL,
        downloadUrl: `https://boximity.ca${body.downloadUrl}`,
        title: "Test fixture guide (not real content)",
      });
      expect(mockWebmasterNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          formType: "Lead magnet",
          fields: expect.objectContaining({ Email: EMAIL }),
        }),
      );
    });

    it("trims the email before recording the lead", async () => {
      const response = await post({ slug: SLUG, email: `  ${EMAIL}  ` });

      expect(response.status).toBe(200);
      expect(mockCreateSyncroLead).toHaveBeenCalledWith({
        email: EMAIL,
        source: `lead-magnet:${SLUG}`,
      });
      expect(mockDeliveryEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: EMAIL }),
      );
    });

    it.each([
      ["unset", undefined],
      ["shorter than 32 characters", "too-short"],
    ])(
      "returns 503 with the failure copy when the signing secret is %s",
      async (_name, secret) => {
        process.env.LEAD_MAGNET_SIGNING_SECRET = secret;

        await expectResponse(await post({ slug: SLUG, email: EMAIL }), 503, {
          error: UNAVAILABLE_COPY,
        });
        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          expect.stringContaining("LEAD_MAGNET_SIGNING_SECRET"),
          "error",
        );
        expect(Sentry.captureMessage).not.toHaveBeenCalledWith(
          expect.stringContaining(EMAIL),
          expect.anything(),
        );
        expect(mockDeliveryEmail).not.toHaveBeenCalled();
      },
    );

    it("succeeds even when both notifications fail", async () => {
      mockDeliveryEmail.mockRejectedValueOnce(new Error("resend down"));
      mockWebmasterNotification.mockResolvedValueOnce(false);

      const response = await post({ slug: SLUG, email: EMAIL });

      expect(response.status).toBe(200);
      expect((await response.json()).success).toBe(true);
    });

    it("does not opt the lead into the brief unless asked", async () => {
      await post({ slug: SLUG, email: EMAIL, wantsBrief: false });

      expect(mockAddResendMarketingContact).not.toHaveBeenCalled();
    });

    it("opts the lead into the brief when asked, failing loudly while stubbed", async () => {
      const response = await post({
        slug: SLUG,
        email: EMAIL,
        wantsBrief: true,
      });

      expect(mockAddResendMarketingContact).toHaveBeenCalledWith({
        email: EMAIL,
        topic: "monthly-security-brief",
      });
      expect(response.status).toBe(500);
    });
  });
});
