import { isPossiblePhoneNumber, parsePhoneNumber } from "libphonenumber-js";

/**
 * Brevo (CRM) contact writes, shared by the contact route, the onboarding
 * route, and the Stripe webhook.
 *
 * Never throws: callers branch on the result to build the success/failure
 * matrix with the Resend notification path.
 */

export interface BrevoContactResult {
  ok: boolean;
  /** Brevo error code (e.g. "duplicate_parameter"), when the API returned one */
  code?: string;
  /** HTTP status from Brevo, when the request got that far */
  status?: number;
  message?: string;
}

/**
 * Format a phone number to the E.164 form Brevo's SMS field expects.
 * Numbers without a country code are assumed North American (+1).
 * Returns null when the number can't possibly be valid.
 */
export function formatE164Phone(phone: string): string | null {
  try {
    const phoneInput = phone.startsWith("+")
      ? phone
      : `+1${phone.replace(/\D/g, "")}`;
    if (!isPossiblePhoneNumber(phoneInput)) {
      return null;
    }
    return parsePhoneNumber(phoneInput).format("E.164");
  } catch {
    return null;
  }
}

export async function addBrevoContact({
  listId,
  email,
  attributes,
  smsPhone,
}: {
  listId: number;
  email: string;
  attributes: Record<string, string>;
  /** E.164 phone; enables Brevo's SMS channel for the contact */
  smsPhone?: string;
}): Promise<BrevoContactResult> {
  // The Brevo key is a secret: only ever read the server-side variable
  // (a NEXT_PUBLIC_ fallback would invite bundling the key into client JS)
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("Missing BREVO_API_KEY environment variable");
    return { ok: false, code: "missing_api_key" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email,
        attributes: smsPhone ? { ...attributes, SMS: smsPhone } : attributes,
        listIds: [listId],
        ...(smsPhone ? { sms: { SMS: smsPhone } } : {}),
        updateEnabled: true, // Allow updating existing contacts
      }),
    });

    if (response.ok) {
      return { ok: true };
    }

    let errorData: { code?: string; message?: string } | null = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    console.error("Brevo API error:", errorData ?? response.status);
    return {
      ok: false,
      status: response.status,
      code: errorData?.code,
      message: errorData?.message,
    };
  } catch (error) {
    console.error("Brevo request failed:", error);
    return {
      ok: false,
      code: "network_error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
