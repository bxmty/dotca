/**
 * The site's phone number, in the two forms pages use. The one place the
 * digits are written: `npm run lint` bans the literal everywhere else under
 * src (tests excepted), so a number change is a one-file edit.
 */

/** As shown to a reader */
export const COMPANY_PHONE_DISPLAY = "(289) 539-0098";

/** For an `href`, so a tap dials */
export const COMPANY_PHONE_TEL_HREF = `tel:+1${COMPANY_PHONE_DISPLAY.replace(/\D/g, "")}`;
