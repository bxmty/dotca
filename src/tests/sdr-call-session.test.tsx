import { render, screen } from "@testing-library/react";
import {
  SdrCallSession,
  useSdrCallSession,
} from "@/app/security-assessment/call/SdrCallSession";

function SessionProbe() {
  const session = useSdrCallSession();
  return <p>{JSON.stringify(session)}</p>;
}

describe("SdrCallSession", () => {
  it("hands descendants the SDR's name and nothing else", () => {
    render(
      <SdrCallSession sdrName="Alex Doe">
        <SessionProbe />
      </SdrCallSession>,
    );

    expect(screen.getByText('{"sdrName":"Alex Doe"}')).toBeInTheDocument();
  });

  it("refuses to be read outside a session", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<SessionProbe />)).toThrow(/SdrCallSession/);

    consoleError.mockRestore();
  });
});
