import { render, screen } from "@testing-library/react";
import {
  SdrCallSession,
  useSdrCallSession,
} from "@/app/security-assessment/call/SdrCallSession";

function SessionProbe() {
  const { sdrName, token } = useSdrCallSession();
  return (
    <p>
      {sdrName}|{token}
    </p>
  );
}

describe("SdrCallSession", () => {
  it("hands the name and in-memory token to descendants after stripping the URL", () => {
    window.history.replaceState(null, "", "/security-assessment/call?t=abc");

    render(
      <SdrCallSession sdrName="Alex Doe" token="abc">
        <SessionProbe />
      </SdrCallSession>,
    );

    expect(screen.getByText("Alex Doe|abc")).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("refuses to be read outside a session", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<SessionProbe />)).toThrow(/SdrCallSession/);

    consoleError.mockRestore();
  });

  it("never writes the token to web storage", () => {
    window.history.replaceState(null, "", "/security-assessment/call?t=abc");
    sessionStorage.clear();
    localStorage.clear();

    render(
      <SdrCallSession sdrName="Alex Doe" token="abc">
        <SessionProbe />
      </SdrCallSession>,
    );

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
