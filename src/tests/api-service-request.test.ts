/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import * as Sentry from "@sentry/nextjs";
import { POST } from "@/app/api/service-request/route";
import {
  createIntakeTicket,
  createNewHireContact,
  findAuthorizedContact,
  resolveIntakeToken,
} from "@/lib/syncro";
import { sendWebmasterNotification } from "@/lib/notify";
import { resetRateLimits } from "@/lib/rate-limit";

jest.mock("@sentry/nextjs", () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));
// The Syncro reads and writes are mocked; outcome summaries stay real
jest.mock("@/lib/syncro", () => ({
  ...jest.requireActual("@/lib/syncro"),
  resolveIntakeToken: jest.fn(),
  findAuthorizedContact: jest.fn(),
  createIntakeTicket: jest.fn(),
  createNewHireContact: jest.fn(),
}));
jest.mock("@/lib/notify", () => ({
  sendWebmasterNotification: jest.fn(),
}));

const mockResolveToken = resolveIntakeToken as jest.Mock;
const mockFindContact = findAuthorizedContact as jest.Mock;
const mockCreateTicket = createIntakeTicket as jest.Mock;
const mockCreateContact = createNewHireContact as jest.Mock;
const mockNotify = sendWebmasterNotification as jest.Mock;
const mockCaptureMessage = Sentry.captureMessage as jest.Mock;

const TOKEN = "t".repeat(40);
const CLIENT_NAME = "Placeholder Dental Group";
const UNAVAILABLE_COPY =
  "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.";

const joinerFields = {
  requesterName: "Dana Office",
  requesterEmail: "dana@client.example",
  requesterPhone: "+12895550123",
  newHireName: "Jane Doe",
  jobTitle: "Bookkeeper",
  startDate: "2026-12-01",
  newHirePersonalEmail: "jane.doe@personal.example",
  newHirePersonalPhone: "+19055550188",
  matchAccessOf: "Sam Existing",
  apps: "QuickBooks, Microsoft 365",
  licenses: "",
  hardware: "Laptop",
  remoteAccess: "yes",
  distributionLists: "",
  notes: "",
};

const leaverFields = {
  requesterName: "Dana Office",
  requesterEmail: "dana@client.example",
  requesterPhone: "+12895550123",
  employeeName: "John Roe",
  departureType: "involuntary",
  lastWorkingDay: "2026-11-30",
  accessCutoff: "2026-11-30T17:00",
  mailboxRecipient: "Sam Existing",
  fileOwner: "",
  hardwareReturn: "yes",
  notes: "",
};

const joinerBody = { token: TOKEN, mode: "joiner", fields: joinerFields };

function post(body: unknown, { isRawBody = false } = {}) {
  return POST(
    new Request("http://localhost/api/service-request", {
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

/** Nothing a submitter typed, the token or the client may reach Sentry. */
function expectNoSubmissionInSentry() {
  for (const [detail] of mockCaptureMessage.mock.calls) {
    for (const value of [
      "dana",
      "Dana",
      "5550123",
      "Jane Doe",
      "jane.doe",
      "5550188",
      "John Roe",
      TOKEN,
      CLIENT_NAME,
    ]) {
      expect(String(detail)).not.toContain(value);
    }
  }
}

describe("POST /api/service-request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimits();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockResolveToken.mockResolvedValue({
      status: "matched",
      organization: { id: 77, name: CLIENT_NAME },
    });
    mockFindContact.mockResolvedValue({
      status: "authorized",
      contact: { id: 501, name: "Dana Office", email: "dana@client.example" },
    });
    mockCreateTicket.mockResolvedValue({
      ok: true,
      ticketId: 9001,
      ticketNumber: "4321",
    });
    mockCreateContact.mockResolvedValue({
      status: "created",
      contact: {
        id: 9102,
        url: "https://boximity.syncromsp.com/contacts/9102",
      },
    });
    mockNotify.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("files a joiner as a ticket for the matched contact and emails the webmaster", async () => {
    const response = await post(joinerBody);

    await expectResponse(response, 200, {
      success: true,
      ticketNumber: "4321",
    });
    expect(mockResolveToken).toHaveBeenCalledWith(TOKEN);
    expect(mockFindContact).toHaveBeenCalledWith(77, "dana@client.example");
    expect(mockCreateTicket).toHaveBeenCalledTimes(1);
    const [ticket] = mockCreateTicket.mock.calls[0];
    expect(ticket).toEqual({
      organizationId: 77,
      contactId: 501,
      subject: "Joiner: Jane Doe, starts 2026-12-01",
      comment: expect.stringContaining("Sam Existing"),
    });
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith({
      formType: "Service request",
      submitterName: "Dana Office",
      authorization: "verified",
      fields: expect.objectContaining({
        Client: CLIENT_NAME,
        Request: "Joiner",
        "Your email": "dana@client.example",
      }),
    });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("puts the new hire's personal contact details in the ticket comment and the notification", async () => {
    await post({
      ...joinerBody,
      fields: { ...joinerFields, newHirePersonalPhone: "(905) 555-0188" },
    });

    const { comment } = mockCreateTicket.mock.calls[0][0];
    expect(comment).toContain(
      "New hire's personal email: jane.doe@personal.example",
    );
    expect(comment).toContain("New hire's personal phone: +19055550188");
    expect(mockNotify.mock.calls[0][0].fields).toMatchObject({
      "New hire's personal email": "jane.doe@personal.example",
      "New hire's personal phone": "+19055550188",
    });
  });

  it("files a leaver with the employee and last working day in the subject", async () => {
    const response = await post({
      token: TOKEN,
      mode: "leaver",
      fields: leaverFields,
    });

    await expectResponse(response, 200, {
      success: true,
      ticketNumber: "4321",
    });
    expect(mockCreateTicket.mock.calls[0][0].subject).toBe(
      "Leaver: John Roe, last day 2026-11-30",
    );
    expect(mockNotify.mock.calls[0][0].fields).toMatchObject({
      Client: CLIENT_NAME,
      Request: "Leaver",
    });
    // A leaver has no new hire: nothing about personal contact details
    expect(mockCreateTicket.mock.calls[0][0].comment).not.toMatch(/personal/i);
    expect(
      Object.keys(mockNotify.mock.calls[0][0].fields).join("\n"),
    ).not.toMatch(/personal/i);
  });

  describe("the new hire's Syncro contact", () => {
    const leaverBody = { token: TOKEN, mode: "leaver", fields: leaverFields };

    it("creates the contact under the organization, then files the ticket for the requester", async () => {
      const response = await post({
        ...joinerBody,
        fields: { ...joinerFields, newHirePersonalPhone: "(905) 555-0188" },
      });

      await expectResponse(response, 200, {
        success: true,
        ticketNumber: "4321",
      });
      expect(mockCreateContact.mock.calls).toEqual([
        [
          {
            organizationId: 77,
            name: "Jane Doe",
            personalEmail: "jane.doe@personal.example",
            personalPhone: "+19055550188",
          },
        ],
      ]);
      expect(mockCreateTicket).toHaveBeenCalledTimes(1);
      expect(mockCreateContact.mock.invocationCallOrder[0]).toBeLessThan(
        mockCreateTicket.mock.invocationCallOrder[0],
      );
      // Attributed to the requester, not to the new hire's contact
      expect(mockCreateTicket.mock.calls[0][0].contactId).toBe(501);
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("waits for the contact before it files the ticket", async () => {
      let finishContact!: (result: unknown) => void;
      mockCreateContact.mockReturnValue(
        new Promise((resolve) => {
          finishContact = resolve;
        }),
      );

      const pending = post(joinerBody);
      await new Promise((resolve) => setImmediate(resolve));
      expect(mockCreateTicket).not.toHaveBeenCalled();

      finishContact({ status: "created" });
      await pending;
      expect(mockCreateTicket).toHaveBeenCalledTimes(1);
    });

    it("links the created contact at the end of the ticket comment", async () => {
      await post(joinerBody);

      const { comment } = mockCreateTicket.mock.calls[0][0];
      expect(comment).toMatch(
        /\nNotes: \(not provided\)\n\nSyncro contact\nNew hire's contact: #9102 https:\/\/boximity\.syncromsp\.com\/contacts\/9102$/,
      );
    });

    it("says the contact was created when Syncro named no id to link", async () => {
      mockCreateContact.mockResolvedValue({ status: "created" });

      await post(joinerBody);

      expect(mockCreateTicket.mock.calls[0][0].comment).toMatch(
        /\n\nSyncro contact\nNew hire's contact: created \(Syncro returned no id to link\)$/,
      );
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("notes a possible existing contact instead of creating one", async () => {
      mockCreateContact.mockResolvedValue({
        status: "existing",
        contact: {
          id: 733,
          url: "https://boximity.syncromsp.com/contacts/733",
        },
      });

      await expectResponse(await post(joinerBody), 200, {
        success: true,
        ticketNumber: "4321",
      });
      expect(mockCreateTicket.mock.calls[0][0].comment).toMatch(
        /\n\nSyncro contact\nNew hire's contact: possible existing contact #733 https:\/\/boximity\.syncromsp\.com\/contacts\/733\. No contact was created or changed\.$/,
      );
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    describe("when the contact is not created", () => {
      beforeEach(() => {
        mockCreateContact.mockResolvedValue({
          status: "not_created",
          failure: { reason: "rejected", status: 422 },
        });
      });

      it("still files the ticket, with a note to add the contact manually, and confirms as usual", async () => {
        await expectResponse(await post(joinerBody), 200, {
          success: true,
          ticketNumber: "4321",
        });

        expect(mockCreateTicket).toHaveBeenCalledTimes(1);
        expect(mockCreateTicket.mock.calls[0][0].comment).toMatch(
          /\n\nSyncro contact\nNew hire's contact: not created\. Add the contact manually\.$/,
        );
        expect(mockNotify).toHaveBeenCalledTimes(1);
      });

      it("tells Sentry which step failed, without submitted values", async () => {
        await post(joinerBody);

        expect(mockCaptureMessage.mock.calls).toEqual([
          [
            "Service request new hire contact not created: Syncro contact rejected (HTTP 422)",
            "error",
          ],
        ]);
        expectNoSubmissionInSentry();
      });

      it("reports the contact and a failed ticket as two events", async () => {
        mockCreateTicket.mockResolvedValue({
          ok: false,
          reason: "unreachable",
          code: "network_error",
        });

        await expectResponse(await post(joinerBody), 200, { success: true });
        expect(mockCaptureMessage.mock.calls.map(([detail]) => detail)).toEqual(
          [
            "Service request new hire contact not created: Syncro contact rejected (HTTP 422)",
            "Service request delivery failure: Syncro ticket unreachable (network_error), webmaster email ok",
          ],
        );
      });
    });

    describe("when the create may have gone through", () => {
      // A create that timed out, lost its connection or answered 5xx can
      // still have landed in Syncro, as createIntakeTicket documents.
      it.each([
        ["network_error", { reason: "unreachable", code: "network_error" }],
        [
          "server_error",
          { reason: "unreachable", code: "server_error", status: 502 },
        ],
      ])(
        "says the contact may not have been created, to be checked before one is added (%s)",
        async (_code, failure) => {
          mockCreateContact.mockResolvedValue({
            status: "not_created",
            failure,
          });

          await expectResponse(await post(joinerBody), 200, {
            success: true,
            ticketNumber: "4321",
          });

          const { comment } = mockCreateTicket.mock.calls[0][0];
          expect(comment).toMatch(
            /contact: may not have been created\. .*[Cc]heck the organization's contacts before adding one\.$/,
          );
          expect(comment).not.toMatch(/contact: not created/);
        },
      );
    });

    describe("when nothing can have been created", () => {
      it.each([
        ["rejected", { reason: "rejected", status: 422 }],
        ["missing_config", { reason: "unreachable", code: "missing_config" }],
        ["lookup_failed", { reason: "lookup_failed", code: "network_error" }],
      ])("says the contact was not created (%s)", async (_reason, failure) => {
        mockCreateContact.mockResolvedValue({
          status: "not_created",
          failure,
        });

        await post(joinerBody);

        const { comment } = mockCreateTicket.mock.calls[0][0];
        expect(comment).toMatch(/contact: not created\. /);
        expect(comment).not.toMatch(/may not have been created/);
      });
    });

    it("treats a contact create that throws as a contact that may not have been created", async () => {
      mockCreateContact.mockRejectedValue(
        new Error("Jane Doe <jane.doe@personal.example> exploded"),
      );

      await expectResponse(await post(joinerBody), 200, {
        success: true,
        ticketNumber: "4321",
      });
      expect(mockCreateTicket.mock.calls[0][0].comment).toMatch(
        /contact: may not have been created\. .*[Cc]heck the organization's contacts before adding one\.$/,
      );
      expect(mockCaptureMessage.mock.calls).toEqual([
        [
          "Service request new hire contact not created: Syncro contact unreachable (exception)",
          "error",
        ],
      ]);
      expectNoSubmissionInSentry();
    });

    it("leaves the webmaster notification as the submitted fields", async () => {
      await post(joinerBody);

      expect(JSON.stringify(mockNotify.mock.calls[0][0].fields)).not.toMatch(
        /Syncro contact|9102/,
      );
    });

    it("makes no contact call for a leaver", async () => {
      await expectResponse(await post(leaverBody), 200, {
        success: true,
        ticketNumber: "4321",
      });

      expect(mockCreateContact).not.toHaveBeenCalled();
      expect(mockCreateTicket.mock.calls[0][0].comment).toMatch(
        /\nNotes: \(not provided\)$/,
      );
    });
  });

  it("succeeds without a ticket reference when Syncro returns none", async () => {
    mockCreateTicket.mockResolvedValue({ ok: true, ticketId: 9001 });

    await expectResponse(await post(joinerBody), 200, { success: true });
  });

  describe("guards", () => {
    function expectNothingSent() {
      expect(mockCreateContact).not.toHaveBeenCalled();
      expect(mockCreateTicket).not.toHaveBeenCalled();
      expect(mockNotify).not.toHaveBeenCalled();
    }

    it("silently accepts a honeypot submission without touching Syncro or email", async () => {
      const response = await post({
        ...joinerBody,
        website: "https://spam.example",
      });

      await expectResponse(response, 200, { success: true });
      expect(mockResolveToken).not.toHaveBeenCalled();
      expect(mockFindContact).not.toHaveBeenCalled();
      expectNothingSent();
    });

    it.each(["", "   ", undefined])(
      "files a real submission whose honeypot field is %p",
      async (website) => {
        await post({ ...joinerBody, website });

        expect(mockCreateTicket).toHaveBeenCalledTimes(1);
      },
    );

    it("rate limits the sixth submission from one IP", async () => {
      for (let i = 0; i < 5; i++) {
        await post(joinerBody);
      }
      jest.clearAllMocks();

      const response = await post(joinerBody);

      await expectResponse(response, 429, {
        error:
          "Too many submissions. Try again later. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      });
      expect(mockResolveToken).not.toHaveBeenCalled();
      expectNothingSent();
    });

    it("does not count honeypot submissions toward the rate limit", async () => {
      for (let i = 0; i < 6; i++) {
        await post({ ...joinerBody, website: "https://spam.example" });
      }

      const response = await post(joinerBody);

      expect(response.status).toBe(200);
    });

    it("returns 400 when the body is not valid JSON", async () => {
      const response = await post("{not json", { isRawBody: true });

      await expectResponse(response, 400, {
        error: "Request body must be valid JSON",
      });
      expectNothingSent();
    });

    it.each([null, "a string", ["an", "array"], 7])(
      "returns 400 for the non-object JSON body %p",
      async (body) => {
        const response = await post(body);

        expect(response.status).toBe(400);
        expect(mockResolveToken).not.toHaveBeenCalled();
        expectNothingSent();
      },
    );

    it("returns 400 naming the missing required fields before checking the token", async () => {
      const response = await post({
        ...joinerBody,
        fields: { ...joinerFields, newHireName: "", matchAccessOf: "  " },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(typeof body.error).toBe("string");
      expect(body.error).not.toBe("");
      expect(Object.keys(body.fieldErrors).sort()).toEqual([
        "matchAccessOf",
        "newHireName",
      ]);
      expect(mockResolveToken).not.toHaveBeenCalled();
      expectNothingSent();
    });

    it("returns 400 when the new hire's personal email is the requester's email", async () => {
      const response = await post({
        ...joinerBody,
        fields: {
          ...joinerFields,
          newHirePersonalEmail: "DANA@client.example",
        },
      });

      await expectResponse(response, 400, {
        error: "Please check the highlighted fields and try again.",
        fieldErrors: { newHirePersonalEmail: "enter the new hire's own email" },
      });
      expect(mockResolveToken).not.toHaveBeenCalled();
      expectNothingSent();
    });

    it("returns 400 for an unknown mode", async () => {
      const response = await post({ ...joinerBody, mode: "mover" });

      expect(response.status).toBe(400);
      expectNothingSent();
    });

    it("returns 404 and files nothing for an unknown token", async () => {
      mockResolveToken.mockResolvedValue({ status: "no_match" });

      const response = await post(joinerBody);

      await expectResponse(response, 404, { error: "Not found" });
      expect(mockFindContact).not.toHaveBeenCalled();
      expectNothingSent();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it.each([undefined, null, 12345, { a: 1 }])(
      "treats the non-string token %p as unknown",
      async (token) => {
        mockResolveToken.mockResolvedValue({ status: "no_match" });

        const response = await post({ ...joinerBody, token });

        expect(response.status).toBe(404);
        expect(mockResolveToken).toHaveBeenCalledWith("");
      },
    );

    it("rejects an email that is not on the allowlist, files nothing and names no client", async () => {
      mockFindContact.mockResolvedValue({ status: "not_authorized" });

      const response = await post(joinerBody);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        code: "not_authorized",
        error:
          "We don't recognise that email address. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
      });
      expect(JSON.stringify(body)).not.toContain(CLIENT_NAME);
      expect(JSON.stringify(body)).not.toContain("Placeholder");
      expectNothingSent();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });
  });

  describe("delivery matrix", () => {
    const syncroDown = {
      ok: false,
      reason: "unreachable",
      code: "server_error",
      status: 502,
    };

    it("succeeds without a ticket reference and reports Syncro when only the email lands", async () => {
      mockCreateTicket.mockResolvedValue(syncroDown);

      await expectResponse(await post(joinerBody), 200, { success: true });
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Service request delivery failure: Syncro ticket unreachable (server_error, HTTP 502), webmaster email ok",
        "error",
      );
      expectNoSubmissionInSentry();
    });

    it("succeeds with the ticket reference and reports the email when only the ticket lands", async () => {
      mockNotify.mockResolvedValue(false);

      await expectResponse(await post(joinerBody), 200, {
        success: true,
        ticketNumber: "4321",
      });
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Service request delivery failure: Syncro ticket ok, webmaster email failed",
        "error",
      );
    });

    it("returns 503 with a phone number when neither lands", async () => {
      mockCreateTicket.mockResolvedValue({
        ok: false,
        reason: "rejected",
        status: 422,
        message: "Contact dana@client.example is invalid",
      });
      mockNotify.mockResolvedValue(false);

      await expectResponse(await post(joinerBody), 503, {
        error: UNAVAILABLE_COPY,
      });
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Service request delivery failure: Syncro ticket rejected (HTTP 422), webmaster email failed",
        "error",
      );
      expectNoSubmissionInSentry();
    });

    it("treats a sink that throws as a failed sink, not a failed request", async () => {
      mockCreateTicket.mockRejectedValue(new Error("boom"));

      await expectResponse(await post(joinerBody), 200, { success: true });
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Service request delivery failure: Syncro ticket unreachable (exception), webmaster email ok",
        "error",
      );
    });

    it("returns 503 when both sinks throw", async () => {
      mockCreateTicket.mockRejectedValue(new Error("boom"));
      mockNotify.mockRejectedValue(new Error("bang"));

      await expectResponse(await post(joinerBody), 503, {
        error: UNAVAILABLE_COPY,
      });
    });
  });

  describe("when the token cannot be checked", () => {
    it("returns 503 with a phone number, files nothing and reports the outage", async () => {
      mockResolveToken.mockResolvedValue({
        status: "could_not_check",
        detail: "HTTP 503",
      });

      await expectResponse(await post(joinerBody), 503, {
        error: UNAVAILABLE_COPY,
      });
      expect(mockFindContact).not.toHaveBeenCalled();
      expect(mockCreateContact).not.toHaveBeenCalled();
      expect(mockCreateTicket).not.toHaveBeenCalled();
      expect(mockNotify).not.toHaveBeenCalled();
      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Service request token could not be checked: HTTP 503",
        "error",
      );
      expectNoSubmissionInSentry();
    });
  });

  describe("when authorization cannot be verified", () => {
    beforeEach(() => {
      mockFindContact.mockResolvedValue({
        status: "could_not_check",
        detail: "network_error",
      });
    });

    it("sends the email flagged unverified, creates no ticket and still confirms", async () => {
      await expectResponse(await post(joinerBody), 200, { success: true });

      // No Syncro write of any kind on an unverified request
      expect(mockCreateContact).not.toHaveBeenCalled();
      expect(mockCreateTicket).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith({
        formType: "Service request",
        submitterName: "Dana Office",
        authorization: "unverified",
        fields: expect.objectContaining({
          Client: CLIENT_NAME,
          Request: "Joiner",
          "Your email": "dana@client.example",
        }),
      });
    });

    it("reports the unverified submission to Sentry without submitted values", async () => {
      await post(joinerBody);

      expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Service request authorization unverified: contacts could not be checked (network_error), no ticket created, webmaster email ok",
        "error",
      );
      expectNoSubmissionInSentry();
    });

    it("returns 503 with a phone number when the email fails too", async () => {
      mockNotify.mockResolvedValue(false);

      await expectResponse(await post(joinerBody), 503, {
        error: UNAVAILABLE_COPY,
      });
      expect(mockCreateTicket).not.toHaveBeenCalled();
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Service request authorization unverified: contacts could not be checked (network_error), no ticket created, webmaster email failed",
        "error",
      );
    });
  });

  it("does not flag a submission authorized from a stale contact list", async () => {
    mockResolveToken.mockResolvedValue({
      status: "matched",
      organization: { id: 77, name: CLIENT_NAME },
    });
    mockFindContact.mockResolvedValue({
      status: "authorized",
      contact: { id: 501, name: "Dana Office", email: "dana@client.example" },
    });

    await expectResponse(await post(joinerBody), 200, {
      success: true,
      ticketNumber: "4321",
    });
    expect(mockNotify.mock.calls[0][0].authorization).toBe("verified");
  });
});
