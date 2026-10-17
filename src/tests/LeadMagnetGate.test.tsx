import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LeadMagnetGate from "@/app/components/LeadMagnetGate";

const UNAVAILABLE_COPY =
  "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.";
const BRIEF_LABEL = "Send me Boximity's monthly security brief";

const mockFetch = global.fetch as jest.Mock;

function renderGate() {
  render(
    <LeadMagnetGate
      slug="test-guide"
      title="The Test Guide"
      assetLabel="Get the checklist"
    />,
  );
  return userEvent.setup();
}

function respondWith(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("LeadMagnetGate", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("collects only an email, the honeypot and an unchecked opt-in", () => {
    renderGate();

    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(BRIEF_LABEL)).not.toBeChecked();
    expect(document.querySelector('input[name="website"]')).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    expect(document.querySelectorAll("input")).toHaveLength(3);
  });

  it("asks for a full address without calling the API", async () => {
    const user = renderGate();

    await user.type(screen.getByLabelText(/email/i), "jane@example");
    await user.click(
      screen.getByRole("button", { name: /get the checklist/i }),
    );

    expect(
      await screen.findByText(/enter the full address/i),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows a loading state, then the error the API returns", async () => {
    let resolveResponse: (value: unknown) => void = () => {};
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => (resolveResponse = resolve)),
    );
    const user = renderGate();

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.click(screen.getByLabelText(BRIEF_LABEL));
    await user.click(
      screen.getByRole("button", { name: /get the checklist/i }),
    );

    const button = screen.getByRole("button", { name: /sending/i });
    expect(button).toBeDisabled();
    expect(mockFetch).toHaveBeenCalledWith("/api/lead-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "test-guide",
        email: "jane@example.com",
        website: "",
        wantsBrief: true,
      }),
    });

    resolveResponse(await respondWith(503, { error: UNAVAILABLE_COPY }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(UNAVAILABLE_COPY);
    expect(
      screen.getByRole("button", { name: /get the checklist/i }),
    ).toBeEnabled();
    expect(screen.getByLabelText(/email/i)).toHaveValue("jane@example.com");
  });

  it("shows a generic error when the response has no message", async () => {
    mockFetch.mockImplementationOnce(() => respondWith(500, null));
    const user = renderGate();

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.click(
      screen.getByRole("button", { name: /get the checklist/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /something went wrong/i,
    );
  });

  it("unlocks the download link on success", async () => {
    const downloadUrl = "/api/lead-magnet/download?slug=test-guide&token=t";
    mockFetch.mockImplementationOnce(() =>
      respondWith(200, { success: true, downloadUrl }),
    );
    const user = renderGate();

    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.click(
      screen.getByRole("button", { name: /get the checklist/i }),
    );

    const link = await screen.findByRole("link", {
      name: /get the checklist/i,
    });
    expect(link).toHaveAttribute("href", downloadUrl);
    expect(screen.getByText("We also emailed you a copy.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  });

  it("falls back to the default button label", () => {
    render(<LeadMagnetGate slug="test-guide" title="The Test Guide" />);

    expect(
      screen.getByRole("button", { name: "Download the guide" }),
    ).toBeInTheDocument();
  });
});
