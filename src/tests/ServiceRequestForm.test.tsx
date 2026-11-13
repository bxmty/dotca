import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ServiceRequestForm from "@/app/service-request/[token]/ServiceRequestForm";

const TOKEN = "Placeholder-Intake-Token-000000000";

const mockFetch = jest.fn();

type Reply = { status: number; body: unknown };

const replyWith = ({ status, body }: Reply) =>
  mockFetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });

const setField = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const setPhone = (value: string) =>
  fireEvent.change(
    document.getElementById("service-request-requesterPhone") as HTMLElement,
    { target: { value } },
  );

const choose = (group: RegExp, option: string) =>
  fireEvent.click(
    within(screen.getByRole("group", { name: group })).getByLabelText(option),
  );

function fillRequester() {
  setField("Your name", "Dana Client");
  setField("Your email", "dana@client.example");
  setPhone("12895550142");
}

function fillJoiner() {
  fillRequester();
  setField("New hire's name", "Jane Doe");
  setField("Start date", "2026-12-01");
  setField("Match the access of", "Sam Existing");
}

function fillLeaver() {
  choose(/what are you reporting/i, "Someone is leaving");
  fillRequester();
  setField("Departing employee's name", "John Roe");
  choose(/departure type/i, "Involuntary");
  setField("Last working day", "2026-11-30");
  setField("Cut access at", "2026-11-30T17:00");
}

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: /send request/i }));

const readPostedBody = () => JSON.parse(mockFetch.mock.calls[0][1].body);

describe("ServiceRequestForm", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    replyWith({ status: 200, body: { success: true, ticketNumber: "4321" } });
  });

  describe("joiner and leaver toggle", () => {
    it("starts on the joiner fields, grouped into labelled sections", () => {
      render(<ServiceRequestForm token={TOKEN} />);

      expect(screen.getByLabelText("New hire's name")).toBeInTheDocument();
      expect(screen.getByLabelText("Match the access of")).toBeInTheDocument();
      expect(screen.queryByLabelText("Departing employee's name")).toBeNull();
      for (const section of [
        "Your details",
        "New hire",
        "Access and equipment",
        "Anything else",
      ]) {
        expect(
          screen.getByRole("heading", { level: 2, name: section }),
        ).toBeInTheDocument();
      }
    });

    it("switches to the leaver fields and keeps what was typed about the requester", () => {
      render(<ServiceRequestForm token={TOKEN} />);
      setField("Your name", "Dana Client");

      choose(/what are you reporting/i, "Someone is leaving");

      expect(
        screen.getByLabelText("Departing employee's name"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Cut access at")).toBeInTheDocument();
      expect(screen.queryByLabelText("New hire's name")).toBeNull();
      expect(screen.getByLabelText("Your name")).toHaveValue("Dana Client");
      expect(
        screen.getByRole("heading", { level: 2, name: "Handover" }),
      ).toBeInTheDocument();
    });

    it("says an involuntary departure changes how fast Boximity acts", () => {
      render(<ServiceRequestForm token={TOKEN} />);
      choose(/what are you reporting/i, "Someone is leaving");
      expect(screen.queryByText(/ahead of other requests/i)).toBeNull();

      choose(/departure type/i, "Involuntary");

      expect(screen.getByText(/ahead of other requests/i)).toBeInTheDocument();

      choose(/departure type/i, "Amicable");

      expect(screen.queryByText(/ahead of other requests/i)).toBeNull();
    });
  });

  describe("required-field validation", () => {
    it("names the fix beside each blank required field and sends nothing", () => {
      render(<ServiceRequestForm token={TOKEN} />);

      submit();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Your name")).toHaveAccessibleDescription(
        /enter your name/,
      );
      expect(screen.getByLabelText("Start date")).toHaveAccessibleDescription(
        /enter the start date/,
      );
      expect(screen.getByLabelText(/^Job title/)).not.toHaveAttribute(
        "aria-invalid",
      );
      expect(screen.getByLabelText("Your name")).toHaveFocus();
    });

    it("flags a required choice that was left unanswered", () => {
      render(<ServiceRequestForm token={TOKEN} />);
      choose(/what are you reporting/i, "Someone is leaving");

      submit();

      expect(
        within(
          screen.getByRole("group", { name: /departure type/i }),
        ).getByText(/choose a departure type/),
      ).toBeInTheDocument();
    });

    it("rejects a malformed email before sending", () => {
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();
      setField("Your email", "dana@client");

      submit();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Your email")).toHaveAccessibleDescription(
        /enter the full address/,
      );
    });

    it("clears a field's error once the field is edited", () => {
      render(<ServiceRequestForm token={TOKEN} />);
      submit();

      setField("Your name", "Dana Client");

      expect(screen.getByLabelText("Your name")).not.toHaveAttribute(
        "aria-invalid",
      );
    });
  });

  describe("honeypot", () => {
    it("is in the form but hidden from people and assistive tech", () => {
      const { container } = render(<ServiceRequestForm token={TOKEN} />);

      const honeypot = container.querySelector('input[name="website"]');

      expect(honeypot).not.toBeNull();
      expect(honeypot).toHaveAttribute("tabindex", "-1");
      expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    });

    it("is posted with the request", async () => {
      const { container } = render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();
      fireEvent.change(
        container.querySelector('input[name="website"]') as HTMLElement,
        { target: { value: "https://spam.example" } },
      );

      submit();

      await screen.findByRole("heading", { name: /request received/i });
      expect(readPostedBody().website).toBe("https://spam.example");
    });
  });

  describe("submitting", () => {
    it("posts a joiner request with the token, mode and cleaned fields", async () => {
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();
      setField(/^Apps/, "  Accounting suite  ");
      choose(/remote access/i, "Yes");

      submit();

      await screen.findByRole("heading", { name: /request received/i });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("/api/service-request");
      expect(init.method).toBe("POST");
      expect(readPostedBody()).toEqual({
        token: TOKEN,
        mode: "joiner",
        website: "",
        fields: {
          requesterName: "Dana Client",
          requesterEmail: "dana@client.example",
          requesterPhone: "+12895550142",
          newHireName: "Jane Doe",
          jobTitle: "",
          startDate: "2026-12-01",
          matchAccessOf: "Sam Existing",
          apps: "Accounting suite",
          licenses: "",
          hardware: "",
          remoteAccess: "yes",
          distributionLists: "",
          notes: "",
        },
      });
    });

    it("posts a leaver request with only the leaver's fields", async () => {
      render(<ServiceRequestForm token={TOKEN} />);
      setField("New hire's name", "Typed Before Switching");
      fillLeaver();

      submit();

      await screen.findByRole("heading", { name: /request received/i });
      expect(readPostedBody()).toEqual({
        token: TOKEN,
        mode: "leaver",
        website: "",
        fields: {
          requesterName: "Dana Client",
          requesterEmail: "dana@client.example",
          requesterPhone: "+12895550142",
          employeeName: "John Roe",
          departureType: "involuntary",
          lastWorkingDay: "2026-11-30",
          accessCutoff: "2026-11-30T17:00",
          mailboxRecipient: "",
          fileOwner: "",
          hardwareReturn: "",
          notes: "",
        },
      });
    });

    it("disables the submit button while the request is in flight", async () => {
      let resolveFetch: (value: unknown) => void = () => {};
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();

      submit();

      const button = screen.getByRole("button", { name: /sending/i });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFetch({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: "Down." }),
        });
      });

      expect(
        screen.getByRole("button", { name: /send request/i }),
      ).toBeEnabled();
    });
  });

  describe("confirmation screen", () => {
    it("shows the ticket reference and says a call comes before any change", async () => {
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();

      submit();

      await screen.findByRole("heading", { name: /request received/i });
      expect(screen.getByText(/ticket reference/i)).toHaveTextContent("4321");
      expect(
        screen.getByText(
          /Boximity will phone you to confirm before any change is made/i,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/nothing has been changed yet/i)).toBeVisible();
      expect(
        screen.queryByRole("button", { name: /send request/i }),
      ).toBeNull();
    });

    it("reads correctly when the response carries no ticket reference", async () => {
      replyWith({ status: 200, body: { success: true } });
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();

      submit();

      await screen.findByRole("heading", { name: /request received/i });
      expect(
        screen.getByText(
          /Boximity will phone you to confirm before any change is made/i,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/reference/i)).toBeNull();
      expect(screen.queryByText(/undefined/)).toBeNull();
    });
  });

  describe("rejections and errors", () => {
    it("shows the not-recognised message and its phone number, and keeps the form", async () => {
      replyWith({
        status: 403,
        body: {
          error:
            "That email address isn't recognised for this form. Call (289) 539-0098 to be added.",
          code: "not_authorized",
        },
      });
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();

      submit();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "That email address isn't recognised for this form. Call (289) 539-0098 to be added.",
      );
      expect(screen.getByLabelText("New hire's name")).toHaveValue("Jane Doe");
      expect(
        screen.queryByRole("heading", { name: /request received/i }),
      ).toBeNull();
    });

    it.each([429, 503])(
      "shows the server's message on a %i",
      async (status) => {
        replyWith({ status, body: { error: "Server says no, call us." } });
        render(<ServiceRequestForm token={TOKEN} />);
        fillJoiner();

        submit();

        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Server says no, call us.",
        );
      },
    );

    it("shows the server's field errors on a 400", async () => {
      replyWith({
        status: 400,
        body: {
          error: "Please check the highlighted fields and try again.",
          fieldErrors: { startDate: "enter the date as YYYY-MM-DD" },
        },
      });
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();

      submit();

      await screen.findByRole("alert");
      expect(screen.getByLabelText("Start date")).toHaveAccessibleDescription(
        /enter the date as YYYY-MM-DD/,
      );
    });

    it.each([
      ["the network fails", () => mockFetch.mockRejectedValue(new Error("x"))],
      [
        "the response is not JSON",
        () =>
          mockFetch.mockResolvedValue({
            ok: false,
            status: 502,
            json: () => Promise.reject(new Error("not json")),
          }),
      ],
      [
        "the link stopped resolving (404)",
        () => replyWith({ status: 404, body: { error: "Not found" } }),
      ],
      [
        "a 200 does not confirm success",
        () => replyWith({ status: 200, body: {} }),
      ],
    ])("gives a phone number when %s", async (_name, arrange) => {
      arrange();
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();

      submit();

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(/did not go through/i);
      expect(alert).toHaveTextContent("(289) 539-0098");
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /send request/i }),
        ).toBeEnabled(),
      );
    });

    it("clears the error when the request is sent again", async () => {
      replyWith({ status: 503, body: { error: "Down." } });
      render(<ServiceRequestForm token={TOKEN} />);
      fillJoiner();
      submit();
      await screen.findByRole("alert");
      replyWith({ status: 200, body: { success: true } });

      submit();

      await screen.findByRole("heading", { name: /request received/i });
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
