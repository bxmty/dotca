import { render, screen } from "@testing-library/react";
import { captureMessage } from "@sentry/nextjs";
import ServiceRequestPage, {
  metadata,
} from "@/app/service-request/[token]/page";
import { resolveIntakeToken } from "@/lib/syncro";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));

// jest.setup.js mocks next/navigation without notFound; mirror Next's
// behavior of notFound() throwing so the page stops rendering.
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/syncro", () => ({ resolveIntakeToken: jest.fn() }));

const TOKEN = "Placeholder-Intake-Token-000000000";
const CLIENT_NAME = "Placeholder Dental";

const mockResolveIntakeToken = jest.mocked(resolveIntakeToken);

const renderPage = async (token = TOKEN) =>
  render(await ServiceRequestPage({ params: Promise.resolve({ token }) }));

describe("/service-request/[token]", () => {
  beforeEach(() => {
    mockResolveIntakeToken.mockReset();
    jest.mocked(captureMessage).mockClear();
  });

  it("404s on a token that matches no client", async () => {
    mockResolveIntakeToken.mockResolvedValue({ status: "no_match" });

    await expect(
      ServiceRequestPage({ params: Promise.resolve({ token: "unknown" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockResolveIntakeToken).toHaveBeenCalledWith("unknown");
  });

  describe("when the token could not be checked", () => {
    beforeEach(() => {
      mockResolveIntakeToken.mockResolvedValue({
        status: "could_not_check",
        detail: "HTTP 503",
      });
    });

    it("shows an error with a phone number instead of a 404 or the form", async () => {
      await renderPage();

      expect(
        screen.getByRole("heading", { level: 1, name: /unavailable/i }),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/\(289\) 539-0098/).length).toBeGreaterThan(0);
      expect(
        screen.queryByRole("button", { name: /send request/i }),
      ).toBeNull();
    });

    it("reports the failure to Sentry without the token", async () => {
      await renderPage();

      expect(captureMessage).toHaveBeenCalledTimes(1);
      const [message, level] = jest.mocked(captureMessage).mock.calls[0];
      expect(message).toContain("HTTP 503");
      expect(message).not.toContain(TOKEN);
      expect(level).toBe("error");
    });
  });

  describe("with a valid token", () => {
    beforeEach(() => {
      mockResolveIntakeToken.mockResolvedValue({
        status: "matched",
        organization: { id: 42, name: CLIENT_NAME },
        isStale: false,
      });
    });

    it("renders the request form", async () => {
      await renderPage();

      expect(
        screen.getByRole("button", { name: /send request/i }),
      ).toBeInTheDocument();
      expect(captureMessage).not.toHaveBeenCalled();
    });

    it("keeps the client's name out of the page", async () => {
      const page = await ServiceRequestPage({
        params: Promise.resolve({ token: TOKEN }),
      });
      const { container } = render(page);

      expect(JSON.stringify(page)).not.toContain(CLIENT_NAME);
      expect(container.innerHTML).not.toContain(CLIENT_NAME);
    });

    it("leaves the <main> landmark to the root layout", async () => {
      const { container } = await renderPage();

      expect(container.querySelector("main")).toBeNull();
    });
  });

  it("is kept out of search indexes and referrers", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.referrer).toBe("no-referrer");
  });
});
