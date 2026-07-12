# PRD: Resend Email Service for Webmaster Notifications

## 1. Introduction/Overview

### Problem

The webmaster currently receives form submission data only through Brevo (contact lists and CRM). If Brevo experiences downtime, misconfiguration, or delivery issues, the webmaster may miss lead notifications entirely. There is no redundant notification channel.

### Solution

Implement a Resend-based email service that sends a second notification to the webmaster every time someone submits a form. This provides redundancy: if Brevo fails, the webmaster still receives the lead. If Resend fails, Brevo remains the primary system and the form submission still succeeds.

### Goal

Ensure the webmaster receives form submission notifications through two independent channels (Brevo + Resend) so that a single service failure does not result in lost leads.

---

## 2. Goals

1. **Redundancy**: Webmaster receives email notifications via Resend for every form submission, independent of Brevo.
2. **Non-blocking**: Form submission success depends only on Brevo (where applicable). Resend failures do not cause form submission failures.
3. **Completeness**: All forms that submit user data trigger webmaster notifications.
4. **Extensibility**: New forms can easily be integrated with the Resend notification service.

---

## 3. User Stories

1. **As a webmaster**, I want to receive an email every time someone submits the contact form, so that I never miss a lead even if Brevo has issues.
2. **As a webmaster**, I want to receive an email every time someone joins the waitlist, so that I can follow up on waitlist signups regardless of Brevo status.
3. **As a webmaster**, I want to receive an email every time someone submits the onboarding form, so that I am notified of new onboarding requests.
4. **As a webmaster**, I want each notification email to contain all submitted form fields, so that I have full context without opening another system.
5. **As a form submitter**, I want my form submission to succeed as long as the primary system (Brevo) succeeds, so that a Resend outage does not block me from submitting.

---

## 4. Functional Requirements

### 4.1 Scope of Forms

1. The system must send a webmaster notification for every successful form submission from:
   - **Contact form** (submits to `/api/contact`)
   - **Waitlist form** (submits to `/api/contact` with `isWaitlist: true`)
   - **Onboarding form** (submits to `/api/onboarding`)
   - **Future forms**: Any new form that submits user data must integrate with the Resend notification service.

### 4.2 Email Configuration

2. The webmaster email address must be configured via an environment variable (e.g., `WEBMASTER_EMAIL`).
3. The system must use Resend as the email delivery provider.
4. The Resend API key must be configured via an environment variable (e.g., `RESEND_API_KEY`).

### 4.3 Email Content

5. Each webmaster notification email must include **all submitted form fields** in a readable format (e.g., labeled key-value pairs or a simple table).
6. The email subject must be generic: `"New Form Submission on boximity.ca"` (or the appropriate domain).
7. The email must clearly indicate the **form type** (e.g., Contact, Waitlist, Onboarding) in the body so the webmaster can distinguish submissions at a glance.

### 4.4 Execution and Failure Handling

8. The Resend email must be sent **in parallel** with the primary form processing (e.g., Brevo API call). Both operations should be initiated without one blocking the other.
9. **Form submission success must depend only on the primary system**:
   - For Contact and Waitlist: success depends on Brevo. If Brevo succeeds and Resend fails, the form submission returns success.
   - For Onboarding: success depends on validation and any primary storage/processing. If Resend fails, the form submission still returns success.
10. If Resend fails, the system must log the error but must not return an error response to the user or fail the form submission.
11. If the primary system (e.g., Brevo) fails, the form submission must fail as defined by the existing behavior. Resend is not a fallback for primary processing.

### 4.5 Integration Points

12. The Resend notification logic must be callable from multiple API routes (contact, onboarding, and future form endpoints).
13. The implementation should use a shared module or utility (e.g., `sendWebmasterNotification`) to avoid code duplication across form handlers.

---

## 5. Non-Goals (Out of Scope)

- **No changes to Brevo integration**: Brevo remains the primary contact/CRM system. No modifications to how Brevo receives or processes form data.
- **No changes to user-facing UI**: No updates to form components, validation messages, or success/error states visible to the end user.
- **No auto-reply to the submitter**: This feature only sends notifications to the webmaster. It does not send confirmation or thank-you emails to the person who submitted the form.
- **No replacement of Brevo**: Resend is a redundancy layer, not a replacement. Brevo continues to handle contact management and list subscriptions.

---

## 6. Design Considerations

### 6.1 Email Format

- Use a simple, readable format: form type as a header, then labeled fields.
- Example structure:
  ```
  Form Type: Contact Form
  ---
  Name: John Smith
  Email: john@example.com
  Phone: +1234567890
  Company: Acme Inc.
  ...
  ```
- Plain text is sufficient; HTML is optional if it improves readability.

### 6.2 Form-Specific Data

| Form       | Endpoint          | Key Fields                                                                                                   |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Contact    | `/api/contact`    | name, email, phone, company, address, city, state, zip, plan, billingCycle, employeeCount, isWaitlist        |
| Waitlist   | `/api/contact`    | Same as Contact (distinguished by `isWaitlist: true`)                                                        |
| Onboarding | `/api/onboarding` | companyName, industry, employeeCount, contactName, contactEmail, contactPhone, address, city, state, zipCode |

---

## 7. Technical Considerations

### 7.1 Dependencies

- **Resend**: Use the official Resend SDK or REST API for sending emails.
- **Environment variables**: `RESEND_API_KEY`, `WEBMASTER_EMAIL`. Add to deployment configs (Ansible, GitHub Actions, etc.) alongside existing `BREVO_API_KEY`.

### 7.2 Architecture

- Create a shared utility (e.g., `src/lib/resend-notify.ts` or similar) that accepts form type and payload, then sends the email via Resend.
- Call this utility from `/api/contact/route.ts` and `/api/onboarding/route.ts` after validation passes.
- Use `Promise`-based parallel execution: start both Brevo and Resend calls, await Brevo for the response decision, and do not await Resend for the user-facing result (or await it only for logging).
- If Resend is called in parallel and we don't need to block the response on it, consider fire-and-forget with `.catch()` for logging.

### 7.3 Error Handling

- Wrap Resend calls in try/catch. On failure: log the error (e.g., `console.error`) and continue. Do not throw or return an error to the client.
- Ensure Resend failures do not affect the HTTP status or response body returned to the form submitter.

### 7.4 Testing

- Unit tests: mock Resend API; verify that form success/failure is determined only by the primary system (Brevo/onboarding logic).
- Verify that Resend is called with the correct payload when the form is valid.
- Verify that a Resend failure does not cause a 500 or error response to the client.

### 7.5 Deployment

- Add `RESEND_API_KEY` and `WEBMASTER_EMAIL` to:
  - Local development (e.g., `.env.local`, `setup-local-dev.sh`)
  - CI/CD secrets (e.g., GitHub Actions)
  - Ansible/deployment templates (e.g., `docker-compose.yml.j2`)
  - Environment documentation (e.g., `docs/secrets-rotation-guide.md`)

---

## 8. Success Metrics

1. **Delivery**: Webmaster receives an email for every valid form submission (Contact, Waitlist, Onboarding).
2. **Reliability**: Form submission success rate is unchanged; Resend failures do not increase form failure rate.
3. **Redundancy**: In the event of Brevo issues, webmaster still receives notifications via Resend (when Resend is operational).

---

## 9. Open Questions

1. **Resend domain**: Does the project have a verified domain in Resend for sending (e.g., `noreply@boximity.ca`)? If not, Resend may require onboarding/verification.
2. **Rate limits**: Are Resend rate limits sufficient for expected form volume?
3. **Onboarding primary system**: The onboarding API currently has no primary storage (it returns success without persisting). Should onboarding also integrate with Brevo or another system before this PRD is implemented, or is Resend the only persistence for onboarding for now?

---

_Document created: 2025-02-19_
