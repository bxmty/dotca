/**
 * @jest-environment node
 */
import * as Sentry from "@sentry/nextjs";
import {
  deliverLead,
  describeBriefOptIn,
  type LeadDetails,
} from "@/lib/lead-delivery";
import { createLead } from "@/lib/syncro";
import { sendWebmasterNotification } from "@/lib/notify";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));
jest.mock("@/lib/notify", () => ({ sendWebmasterNotification: jest.fn() }));
// The Syncro write is mocked; its outcome summaries stay real
jest.mock("@/lib/syncro", () => ({
  ...jest.requireActual("@/lib/syncro"),
  createLead: jest.fn(),
}));

const mockCreateLead = createLead as jest.Mock;
const mockNotification = sendWebmasterNotification as jest.Mock;
const mockCaptureMessage = Sentry.captureMessage as jest.Mock;

const EMAIL = "jane.doe@example.com";
const contactLead: LeadDetails = {
  formType: "Contact",
  name: "Jane Doe",
  email: EMAIL,
  phone: "+14165550123",
  company: "Doe Ltd",
  fields: { Name: "Jane Doe", Email: EMAIL },
};

function readLeadLogLines(log: jest.SpyInstance): unknown[] {
  return log.mock.calls
    .map(([line]) => String(line))
    .filter((line) => line.includes('"event":"lead_submission"'))
    .map((line) => JSON.parse(line));
}

function expectNoPiiInSentry() {
  for (const [message] of mockCaptureMessage.mock.calls) {
    expect(String(message)).not.toContain(EMAIL);
    expect(String(message)).not.toContain("Jane");
  }
}

describe("lead delivery", () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    log = jest.spyOn(console, "log").mockImplementation(() => {});
    mockCreateLead.mockResolvedValue({ ok: true, leadId: 7 });
    mockNotification.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("describeBriefOptIn", () => {
    it("says Yes only for an explicit true", () => {
      expect(describeBriefOptIn(true)).toBe("Yes");
      expect(describeBriefOptIn(false)).toBe("No");
      expect(describeBriefOptIn(undefined)).toBe("No");
    });
  });

  describe("deliverLead", () => {
    it("sends both sinks the same fields, with the brief consent line", async () => {
      await deliverLead({
        lead: { ...contactLead, hasOptedInToBrief: true },
        failureSummary: "Contact form delivery failure",
      });

      const expectedFields = {
        Name: "Jane Doe",
        Email: EMAIL,
        "Monthly brief": "Yes",
      };
      expect(mockCreateLead).toHaveBeenCalledWith(
        expect.objectContaining({
          formType: "Contact",
          name: "Jane Doe",
          fields: expectedFields,
          hasOptedInToBrief: true,
        }),
      );
      expect(mockNotification).toHaveBeenCalledWith({
        formType: "Contact",
        submitterName: "Jane Doe",
        fields: expectedFields,
      });
    });

    it("is delivered, logs one line and tells Sentry nothing when both land", async () => {
      const delivery = await deliverLead({
        lead: contactLead,
        failureSummary: "Contact form delivery failure",
      });

      expect(delivery).toEqual({ isDelivered: true });
      expect(mockCaptureMessage).not.toHaveBeenCalled();
      expect(readLeadLogLines(log)).toEqual([
        {
          event: "lead_submission",
          formType: "Contact",
          name: "Jane Doe",
          company: "Doe Ltd",
          email: EMAIL,
          phone: "+14165550123",
          syncro: "ok",
          webmasterEmail: "ok",
        },
      ]);
    });

    it("is still delivered when one sink fails, reporting it without PII", async () => {
      mockCreateLead.mockResolvedValue({
        ok: false,
        reason: "rejected",
        status: 422,
        message: `bad ${EMAIL}`,
      });

      const delivery = await deliverLead({
        lead: contactLead,
        failureSummary: "Contact form delivery failure",
      });

      expect(delivery).toEqual({ isDelivered: true });
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Contact form delivery failure: Syncro rejected (HTTP 422), webmaster email ok",
        "error",
      );
      expectNoPiiInSentry();
    });

    it("is not delivered when neither sink lands, even when they throw", async () => {
      mockCreateLead.mockRejectedValue(new Error(`boom ${EMAIL}`));
      mockNotification.mockRejectedValue(new Error("resend down"));

      const delivery = await deliverLead({
        lead: contactLead,
        failureSummary: "Paid signup notification failure",
        failureContext: "invoice in_123",
      });

      expect(delivery).toEqual({ isDelivered: false });
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Paid signup notification failure: Syncro unreachable (exception), webmaster email failed (invoice in_123)",
        "error",
      );
      expectNoPiiInSentry();
      expect(readLeadLogLines(log)).toEqual([
        expect.objectContaining({
          syncro: "unreachable (exception)",
          webmasterEmail: "failed",
        }),
      ]);
    });

    it("waits for the calls alongside, and never counts their failures", async () => {
      let isAlongsideSettled = false;
      const alongside = new Promise((_resolve, reject) =>
        setTimeout(() => {
          isAlongsideSettled = true;
          reject(new Error("GA4 down"));
        }, 0),
      );

      const delivery = await deliverLead({
        lead: contactLead,
        failureSummary: "Contact form delivery failure",
        alongside: [alongside],
      });

      expect(isAlongsideSettled).toBe(true);
      expect(delivery).toEqual({ isDelivered: true });
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("falls back to the address as the submitter name when the name is blank", async () => {
      await deliverLead({
        lead: { ...contactLead, formType: "Paid signup", name: "" },
        failureSummary: "Paid signup notification failure",
      });

      expect(mockCreateLead).toHaveBeenCalledWith(
        expect.objectContaining({ name: "" }),
      );
      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({ submitterName: EMAIL }),
      );
    });

    it("lets the address stand in for an omitted name, logging the name blank", async () => {
      await deliverLead({
        lead: {
          formType: "Lead magnet",
          email: EMAIL,
          fields: { Email: EMAIL },
        },
        failureSummary: "Lead magnet delivery failure (guide)",
      });

      expect(mockCreateLead).toHaveBeenCalledWith(
        expect.objectContaining({
          name: EMAIL,
          fields: { Email: EMAIL, "Monthly brief": "No" },
        }),
      );
      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({ submitterName: EMAIL }),
      );
      expect(readLeadLogLines(log)).toEqual([
        {
          event: "lead_submission",
          formType: "Lead magnet",
          name: "",
          company: "",
          email: EMAIL,
          phone: "",
          syncro: "ok",
          webmasterEmail: "ok",
        },
      ]);
    });
  });
});
