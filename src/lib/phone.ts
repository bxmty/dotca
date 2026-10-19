import { isPossiblePhoneNumber, parsePhoneNumber } from "libphonenumber-js";

/**
 * Format a phone number to E.164 (e.g. "+12895550123").
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
