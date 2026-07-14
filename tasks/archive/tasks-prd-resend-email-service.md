# Task List: Resend Email Service for Webmaster Notifications

_Generated from: [prd-resend-email-service.md](./prd-resend-email-service.md)_

---

## Relevant Files

- `src/lib/resend-notify.ts` - Shared utility to send webmaster notification emails via Resend API.
- `src/tests/resend-notify.lib.test.ts` - Unit tests for the Resend notification utility.
- `src/app/api/contact/route.ts` - Contact and Waitlist form handler; integrates Resend in parallel with Brevo.
- `src/tests/api-contact.test.ts` - Unit tests for contact API (update to cover Resend integration).
- `src/app/api/onboarding/route.ts` - Onboarding form handler; integrates Resend notification.
- `src/tests/api-onboarding.test.ts` - Unit tests for onboarding API (create or update).
- `ansible/templates/docker-compose.yml.j2` - Add RESEND_API_KEY and WEBMASTER_EMAIL env vars.
- `ansible/staging-deploy.yml` - Add Resend-related variables for staging.
- `ansible/production-deploy.yml` - Add Resend-related variables for production.
- `.github/workflows/deploy.yml` - Add RESEND_API_KEY and WEBMASTER_EMAIL to deployment secrets.
- `.github/workflows/environments/*.yml` - Add Resend secrets to environment configs.
- `.github/actions/deploy/action.yml` - Add Resend env var validation for deployment.
- `scripts/setup-local-dev.sh` - Add RESEND_API_KEY and WEBMASTER_EMAIL to local dev template.
- `scripts/validate-secrets.sh` - Add validation for Resend API key.
- `scripts/validate-environment.sh` - Add Resend env var checks.
- `docs/secrets-rotation-guide.md` - Document Resend keys and rotation procedure.
- `docs/local-development-setup.md` - Document Resend env vars for local setup.
- `package.json` - Add Resend SDK dependency.

### Notes

- Lib tests follow the pattern `src/tests/<name>.lib.test.ts` (e.g., `resend-notify.lib.test.ts`); API route tests use `src/tests/api-<route>.test.ts`.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

---

## Tasks

- [x] 1.0 Update existing documentation where relevant (no new diagrams)
  - [x] 1.1 Add `RESEND_API_KEY` and `WEBMASTER_EMAIL` to `docs/secrets-rotation-guide.md` (table, rotation steps).
  - [x] 1.2 Add Resend env vars to `docs/local-development-setup.md`.
  - [x] 1.3 Update `README.md` env vars section if it lists required keys.
  - [x] 1.4 Update `.github/workflows/environments/README.md` to list Resend secrets.

- [ ] 2.0 Create Resend notification utility and add Resend SDK dependency
  - [ ] 2.1 Add `resend` package to `package.json` and run `npm install`.
  - [ ] 2.2 Create `src/lib/resend-notify.ts` with `sendWebmasterNotification(formType, payload)` that accepts form type and a record of field names to values.
  - [ ] 2.3 Format email body as plain text: form type header, separator, then labeled key-value pairs for all payload fields.
  - [ ] 2.4 Use subject `"New Form Submission on boximity.ca"` and read `WEBMASTER_EMAIL` and `RESEND_API_KEY` from env.
  - [ ] 2.5 If `RESEND_API_KEY` or `WEBMASTER_EMAIL` is missing, no-op and log a warning (do not throw).
  - [ ] 2.6 Wrap Resend call in try/catch; on failure log error and return (never throw to caller).

- [ ] 3.0 Integrate Resend into Contact/Waitlist API route
  - [ ] 3.1 After validation passes, build a payload object with all contact/waitlist fields (name, email, phone, company, address, city, state, zip, plan, billingCycle, employeeCount, isWaitlist).
  - [ ] 3.2 Determine form type: `"Waitlist"` when `isWaitlist === true`, otherwise `"Contact"`.
  - [ ] 3.3 Call `sendWebmasterNotification(formType, payload)` in parallel with the Brevo fetch (start both, await only Brevo for the response decision).
  - [ ] 3.4 Ensure Resend is fire-and-forget: do not await it for the HTTP response; use `.catch()` for logging if needed.
  - [ ] 3.5 Preserve existing Brevo-first logic: form success/failure depends only on Brevo; Resend errors must not affect the returned response.

- [ ] 4.0 Integrate Resend into Onboarding API route
  - [ ] 4.1 After validation passes, build a payload object with all onboarding fields (companyName, industry, employeeCount, contactName, contactEmail, contactPhone, address, city, state, zipCode).
  - [ ] 4.2 Call `sendWebmasterNotification("Onboarding", payload)` (fire-and-forget with `.catch()` for logging).
  - [ ] 4.3 Ensure onboarding success response is returned regardless of Resend outcome.

- [ ] 5.0 Add environment variables and deployment configuration
  - [ ] 5.1 Add `RESEND_API_KEY` and `WEBMASTER_EMAIL` to `ansible/templates/docker-compose.yml.j2` environment section.
  - [ ] 5.2 Add `resend_api_key` and `webmaster_email` to `ansible/staging-deploy.yml` and `ansible/production-deploy.yml` variable definitions.
  - [ ] 5.3 Add `RESEND_API_KEY` and `WEBMASTER_EMAIL` to the deploy job in `.github/workflows/deploy.yml` (from secrets).
  - [ ] 5.4 Add `RESEND_API_KEY` and `WEBMASTER_EMAIL` to the secrets list in `.github/workflows/environments/staging.yml` and `production.yml`.
  - [ ] 5.5 Add Resend env var validation to `.github/actions/deploy/action.yml` (require both for deployment).
  - [ ] 5.6 Add `RESEND_API_KEY` and `WEBMASTER_EMAIL` to `scripts/setup-local-dev.sh` template.
  - [ ] 5.7 Add `validate_resend_key` and Resend checks to `scripts/validate-secrets.sh`.
  - [ ] 5.8 Add Resend env var checks to `scripts/validate-environment.sh`.
  - [ ] 5.9 Add Resend format check to `scripts/check-secret-formats.sh` if applicable.

- [ ] 6.0 Add unit tests for Resend utility and API integrations
  - [ ] 6.1 Create `src/tests/resend-notify.lib.test.ts`: mock Resend SDK, verify `sendWebmasterNotification` formats body correctly and includes form type.
  - [ ] 6.2 Test that missing `RESEND_API_KEY` or `WEBMASTER_EMAIL` causes no-op (no throw, no Resend call).
  - [ ] 6.3 Test that Resend failure is caught and logged without throwing.
  - [ ] 6.4 In `src/tests/api-contact.test.ts`: add test that Resend is invoked with correct payload on successful Brevo response.
  - [ ] 6.5 In `src/tests/api-contact.test.ts`: add test that when Resend fails, form still returns success (mock Resend to reject).
  - [ ] 6.6 In `src/tests/api-onboarding.test.ts`: add test that Resend is invoked with correct payload on valid submission.
  - [ ] 6.7 In `src/tests/api-onboarding.test.ts`: add test that when Resend fails, form still returns success.

---
