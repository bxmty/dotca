import { GET } from "@/app/book/route";
import { NextResponse } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn((url, status) => ({ url, status })),
  },
}));

describe("/book redirect route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("temporarily redirects (307) to the Microsoft Bookings page", () => {
    GET();

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const [url, status] = (NextResponse.redirect as jest.Mock).mock.calls[0];
    expect(status).toBe(307);
    expect(url).toMatch(
      /^https:\/\/bookings\.cloud\.microsoft\/bookwithme\/user\/.+@boximity\.ca\/meetingtype\/.+/,
    );
  });

  it("keeps Microsoft's valueless query flags intact", () => {
    GET();

    const [url] = (NextResponse.redirect as jest.Mock).mock.calls[0];
    expect(url).toMatch(/\?anonymous&ismsaljsauthenabled&ep=mlink$/);
  });
});
