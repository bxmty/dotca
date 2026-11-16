import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  formatServiceRequestComment,
  formatServiceRequestFields,
  formatServiceRequestSubject,
  type JoinerFields,
  type ServiceRequest,
  validateServiceRequest,
} from "@/lib/service-request";
import {
  createIntakeTicket,
  createNewHireContact,
  type CreateNewHireContactResult,
  type CreateTicketResult,
  describeNewHireContactFailure,
  describeSyncroWriteOutcome,
  findAuthorizedContact,
  formatNewHireContactNote,
  type IntakeOrganization,
  resolveIntakeToken,
} from "@/lib/syncro";
import {
  sendWebmasterNotification,
  type SubmitterAuthorization,
} from "@/lib/notify";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import {
  formatUnavailableMessage,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "@/lib/service-unavailable";
import { isRecord } from "@/lib/isRecord";

/**
 * The rejection names no client: possession of a link must not confirm which
 * client it belongs to (spec #565, "Rejection copy omits the client name").
 */
const NOT_AUTHORIZED_MESSAGE = formatUnavailableMessage(
  "We don't recognise that email address.",
);

/**
 * A requester who is turned away still gets a way through: a refused
 * submission says so and gives a phone number (spec #565).
 */
const RATE_LIMITED_MESSAGE = formatUnavailableMessage(
  "Too many submissions. Try again later.",
);

/** Sentry and the server log; callers pass no submitted value, token or client name. */
function reportFailure(message: string): void {
  console.error(message);
  Sentry.captureMessage(message, "error");
}

function respondUnavailable() {
  return NextResponse.json(
    { error: SERVICE_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

/**
 * The webmaster email. The subject carries no client name, so the
 * organization leads the fields; an "unverified" `authorization` flags the
 * subject line. Resolves false when the send fails or throws.
 */
async function notifyWebmaster(
  serviceRequest: ServiceRequest,
  organization: IntakeOrganization,
  authorization: SubmitterAuthorization,
): Promise<boolean> {
  try {
    return await sendWebmasterNotification({
      formType: "Service request",
      submitterName: serviceRequest.fields.requesterName,
      authorization,
      fields: {
        Client: organization.name,
        ...formatServiceRequestFields(serviceRequest),
      },
    });
  } catch {
    return false;
  }
}

/**
 * Create the new hire's Syncro contact. Like fileTicket, the catch outlives
 * createNewHireContact's contract never to reject: a contact that could not
 * be created must not cost the requester their ticket.
 */
async function createContactForNewHire(
  fields: JoinerFields,
  organizationId: number,
): Promise<CreateNewHireContactResult> {
  try {
    return await createNewHireContact({
      organizationId,
      name: fields.newHireName,
      personalEmail: fields.newHirePersonalEmail,
      personalPhone: fields.newHirePersonalPhone,
    });
  } catch {
    return {
      status: "not_created",
      failure: { reason: "unreachable", code: "exception" },
    };
  }
}

/**
 * The ticket comment. A joiner's ends with a note on the new hire's Syncro
 * contact, which is created first so the comment can link it. A contact that
 * was not created is reported to Sentry by failure kind only, and the ticket
 * is filed all the same.
 */
async function buildTicketComment(
  serviceRequest: ServiceRequest,
  organizationId: number,
): Promise<string> {
  const comment = formatServiceRequestComment(serviceRequest);
  if (serviceRequest.mode !== "joiner") return comment;

  const contactResult = await createContactForNewHire(
    serviceRequest.fields,
    organizationId,
  );
  if (contactResult.status === "not_created") {
    reportFailure(
      `Service request new hire contact not created: ${describeNewHireContactFailure(
        contactResult.failure,
      )}`,
    );
  }
  return `${comment}\n\n${formatNewHireContactNote(contactResult)}`;
}

/**
 * File the ticket. createIntakeTicket's contract is never to reject, and the
 * catch is kept all the same: the two sinks settle together under
 * Promise.all, so a rejection here (a broken contract, or a formatter that
 * throws) would answer 500 for a submission whose email landed. The route's
 * guarantee is that either sink landing is a success, so a rejection reads
 * as an unreachable Syncro ("exception") and is reported like one.
 */
async function fileTicket(
  serviceRequest: ServiceRequest,
  organizationId: number,
  contactId: number,
): Promise<CreateTicketResult> {
  try {
    return await createIntakeTicket({
      organizationId,
      contactId,
      subject: formatServiceRequestSubject(serviceRequest),
      comment: await buildTicketComment(serviceRequest, organizationId),
    });
  } catch {
    return { ok: false, reason: "unreachable", code: "exception" };
  }
}

/**
 * Joiner/leaver intake (spec #565): files an authorized client contact's
 * request as a Syncro ticket and emails the webmaster alongside it. A joiner
 * also gets a Syncro contact for the new hire, created before the ticket. Guards
 * run in the spec's order; the submission succeeds when either sink lands.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }
  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object" },
      { status: 400 },
    );
  }
  const { token, mode, fields, website } = body;

  // Honeypot: the "website" field is hidden from humans. A filled value
  // means a bot — return success and do nothing.
  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
  }

  const validation = validateServiceRequest(mode, fields);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, fieldErrors: validation.fieldErrors },
      { status: 400 },
    );
  }
  const serviceRequest = validation.request;

  // A token that is not a string is an unknown token: the blank answers
  // "no match" without a Syncro call.
  const resolved = await resolveIntakeToken(
    typeof token === "string" ? token : "",
  );
  if (resolved.status === "no_match") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (resolved.status === "could_not_check") {
    // Every token, real or not, gets this answer during an outage with a
    // cold cache, so it says nothing about whether the token exists.
    reportFailure(
      `Service request token could not be checked: ${resolved.detail}`,
    );
    return respondUnavailable();
  }
  const { organization } = resolved;

  const authorization = await findAuthorizedContact(
    organization.id,
    serviceRequest.fields.requesterEmail,
  );
  if (authorization.status === "not_authorized") {
    return NextResponse.json(
      { error: NOT_AUTHORIZED_MESSAGE, code: "not_authorized" },
      { status: 403 },
    );
  }

  if (authorization.status === "could_not_check") {
    // Fail open: the confirmation call, not the allowlist, gates action. No
    // ticket, since it would assert an authorization nobody verified, and no
    // new hire contact: nothing is written to Syncro on an unverified
    // request. The email goes out flagged in its subject line.
    const isEmailSent = await notifyWebmaster(
      serviceRequest,
      organization,
      "unverified",
    );
    reportFailure(
      `Service request authorization unverified: contacts could not be checked (${
        authorization.detail
      }), no ticket created, webmaster email ${isEmailSent ? "ok" : "failed"}`,
    );
    return isEmailSent
      ? NextResponse.json({ success: true })
      : respondUnavailable();
  }

  const [ticketResult, isEmailSent] = await Promise.all([
    fileTicket(serviceRequest, organization.id, authorization.contact.id),
    notifyWebmaster(serviceRequest, organization, "verified"),
  ]);
  if (!ticketResult.ok || !isEmailSent) {
    reportFailure(
      `Service request delivery failure: Syncro ticket ${describeSyncroWriteOutcome(
        ticketResult,
      )}, webmaster email ${isEmailSent ? "ok" : "failed"}`,
    );
  }
  if (!ticketResult.ok) {
    return isEmailSent
      ? NextResponse.json({ success: true })
      : respondUnavailable();
  }

  return NextResponse.json({
    success: true,
    ...(ticketResult.ticketNumber
      ? { ticketNumber: ticketResult.ticketNumber }
      : {}),
  });
}
