import { Resend } from "resend";

/**
 * Webmaster notification email — the redundancy path for form submissions.
 *
 * Fires alongside the Brevo write so a Brevo outage can't silently lose a
 * lead. Never throws: callers branch on the returned boolean to build the
 * success/failure matrix, so a Resend outage must surface as `false`, not
 * as an exception that masks the Brevo result.
 */

export type NotificationFormType = "Contact" | "Onboarding" | "Paid signup";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendWebmasterNotification({
  formType,
  submitterName,
  fields,
}: {
  formType: NotificationFormType;
  submitterName: string;
  fields: Record<string, string>;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const webmasterEmail = process.env.WEBMASTER_EMAIL;

  if (!apiKey || !fromEmail || !webmasterEmail) {
    console.error(
      "Webmaster notification skipped: RESEND_API_KEY, RESEND_FROM_EMAIL, or WEBMASTER_EMAIL is not set",
    );
    return false;
  }

  const rows = Object.entries(fields).filter(([, value]) => value !== "");

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = [
    `<h2>New ${escapeHtml(formType)} submission</h2>`,
    '<table cellpadding="6" style="border-collapse:collapse">',
    ...rows.map(
      ([label, value]) =>
        `<tr><td style="border:1px solid #ddd"><strong>${escapeHtml(label)}</strong></td>` +
        `<td style="border:1px solid #ddd">${escapeHtml(value)}</td></tr>`,
    ),
    "</table>",
  ].join("\n");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Boximity Website <${fromEmail}>`,
      to: webmasterEmail,
      subject: `New ${formType} submission — ${submitterName}`,
      html,
      text,
    });
    if (error) {
      console.error("Webmaster notification failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Webmaster notification failed:", error);
    return false;
  }
}
