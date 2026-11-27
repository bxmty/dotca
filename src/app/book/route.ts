import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Short, stable link (boximity.ca/book) to the CEO's Microsoft Bookings page,
// for email signatures, cold-outreach confirmations, and the contact form.
//
// A route handler rather than a next.config.js redirect on purpose: Next
// normalises valueless query flags (`?anonymous` -> `?anonymous=`), and this
// URL must reach Microsoft exactly as Bookings generated it. It is a 307, not
// a 308, so the destination can change (new meeting type, new platform)
// without browsers or mail scanners holding a cached copy of the old one.
const BOOKINGS_URL =
  "https://bookings.cloud.microsoft/bookwithme/user/a5e211a51e1249c58887920054b48f6c@boximity.ca/meetingtype/kq0L7V3Fl0Sb2Pv0wkQ29A2?anonymous&ismsaljsauthenabled&ep=mlink";

export function GET() {
  return NextResponse.redirect(BOOKINGS_URL, 307);
}
