import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import CallConsole from "@/app/security-assessment/call/CallConsole";
import { event as trackGaEvent } from "@/lib/gtag";
import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  type QuizConfig,
  type QuizSegment,
  type RiskTier,
} from "@/lib/security-assessment/quizTypes";
import type {
  NextStep,
  SdrCallLeadRequest,
  SdrContent,
} from "@/lib/security-assessment/sdrTypes";

jest.mock("@/lib/gtag", () => ({ event: jest.fn(), pageview: jest.fn() }));

function perSegmentAndTier<T>(
  build: (segment: QuizSegment, tier: RiskTier) => T,
) {
  return Object.fromEntries(
    QUIZ_SEGMENTS.map((segment) => [
      segment,
      Object.fromEntries(
        RISK_TIERS.map((tier) => [tier, build(segment, tier)]),
      ),
    ]),
  ) as Record<QuizSegment, Record<RiskTier, T>>;
}

const config: QuizConfig = {
  landing: {
    title: "Public title",
    intro: "",
    timeEstimate: "",
    startLabel: "",
  },
  segments: {
    solo: { label: "Solopreneur", description: "Just me" },
    small_team: { label: "Small team", description: "5-20" },
    growing: { label: "Growing business", description: "20-50" },
  },
  sections: { essentials: { label: "Essentials" } },
  sizeQuestion: "How big is the business?",
  tiers: {
    exposed: { label: "Exposed", headline: "Exposed headline", body: "b" },
    reactive: { label: "Reactive", headline: "Reactive headline", body: "b" },
    managed: { label: "Managed", headline: "Managed headline", body: "b" },
    resilient: {
      label: "Resilient",
      headline: "Resilient headline",
      body: "b",
    },
  },
  thresholds: {
    solo: { reactive: 2, managed: 4, resilient: 6 },
    small_team: { reactive: 2, managed: 4, resilient: 6 },
    growing: { reactive: 2, managed: 4, resilient: 6 },
  },
  categories: {
    mfa: { section: "essentials", label: "MFA", weakCopy: "MFA weak copy" },
  },
  questions: [
    {
      id: "q1",
      category: "mfa",
      segments: ["solo", "small_team", "growing"],
      text: "Posture one?",
      answers: [
        { text: "P1 good", points: 3 },
        { text: "P1 bad", points: 0, risk: true },
      ],
    },
    {
      id: "q2",
      category: "mfa",
      segments: ["solo", "small_team", "growing"],
      text: "Posture two?",
      answers: [
        { text: "P2 good", points: 3 },
        { text: "P2 bad", points: 0, risk: true },
      ],
    },
    {
      id: "q3",
      category: "mfa",
      segments: ["growing"],
      text: "Growing only?",
      answers: [
        { text: "P3 good", points: 3 },
        { text: "P3 bad", points: 0 },
      ],
    },
  ],
  ctas: perSegmentAndTier((segment, tier) => ({
    heading: `Public CTA ${segment} ${tier}`,
    body: "",
    buttonLabel: "Public button",
    buttonHref: "/",
  })),
};

const sdr: SdrContent = {
  status: "draft",
  talkTracks: {
    q1: { whyItMatters: "Why q1 matters", probe: "Probe q1" },
    q2: { whyItMatters: "Why q2 matters", probe: "Probe q2" },
    q3: { whyItMatters: "Why q3 matters", probe: "Probe q3" },
  },
  nextSteps: perSegmentAndTier<NextStep>((segment, tier) => ({
    propose: `Propose ${segment} ${tier}`,
    service: `Service ${segment} ${tier}`,
  })),
  discovery: [
    { id: "why_now", group: "opening", kind: "text", text: "Why now?" },
    {
      id: "current_it",
      group: "opening",
      kind: "choice",
      text: "Current IT?",
      choices: ["None", "Another MSP"],
    },
    {
      id: "timeline",
      group: "closing",
      kind: "choice",
      text: "Timeline?",
      choices: ["Now", "Later"],
    },
  ],
};

const mockFetch = jest.fn();

function respondWith(status: number, body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function renderConsole() {
  return render(<CallConsole sdrName="Alex Doe" config={config} sdr={sdr} />);
}

const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));
const choose = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("radio", { name }));
const type = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillDetails() {
  type(/^Name/, " Pat Prospect ");
  type(/^Email/, "pat@example.com");
  type(/^Company/, "Acme");
  click("Continue");
}

/** Details through to the first posture question, skipping opening discovery. */
function goToFirstPosture(segment: RegExp = /Solopreneur/) {
  fillDetails();
  choose(segment);
  click("Continue");
  click("Skip");
  click("Skip");
}

function goToResults() {
  goToFirstPosture();
  choose("P1 good");
  click("Next");
  choose("P2 bad");
  click("Next");
}

function goToSummary() {
  goToResults();
  click("Continue");
  click("Skip");
}

function lastRequest(): SdrCallLeadRequest {
  const [url, init] = mockFetch.mock.calls.at(-1)!;
  expect(url).toBe("/api/security-assessment/call");
  return JSON.parse(init.body);
}

describe("CallConsole", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("names the SDR and flags draft copy", () => {
    renderConsole();

    expect(screen.getByText(/Alex Doe/)).toBeInTheDocument();
    expect(screen.getByText("Draft copy")).toBeInTheDocument();
  });

  describe("details gate", () => {
    it("blocks on empty fields with errors and focus on the first", () => {
      renderConsole();

      click("Continue");

      expect(screen.getByText("enter the prospect's name")).toBeInTheDocument();
      expect(
        screen.getByText("enter the prospect's email address"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("enter the prospect's company name"),
      ).toBeInTheDocument();
      expect(screen.queryByText(/enter your/)).toBeNull();
      expect(screen.getByLabelText(/^Name/)).toHaveFocus();
      expect(
        screen.getByRole("heading", { name: "Who are you speaking with?" }),
      ).toBeInTheDocument();
    });

    it("focuses a bad email and clears its error on typing", () => {
      renderConsole();
      type(/^Name/, "Pat");
      type(/^Company/, "Acme");
      type(/^Email/, "not-an-email");

      click("Continue");

      expect(screen.getByLabelText(/^Email/)).toHaveFocus();
      expect(screen.getByLabelText(/^Email/)).toBeInvalid();

      type(/^Email/, "pat@example.com");

      expect(screen.getByLabelText(/^Email/)).toBeValid();
    });

    it("offers no brief opt-in", () => {
      renderConsole();

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  it("runs opening discovery, posture, results, closing, then summary", () => {
    renderConsole();
    const heading = () => screen.getByRole("heading", { level: 1 }).textContent;

    fillDetails();
    expect(heading()).toBe("How big is the business?");
    click("Continue");
    expect(heading()).toBe("Why now?");
    click("Skip");
    expect(heading()).toBe("Current IT?");
    click("Skip");
    expect(heading()).toBe("Posture one?");
    choose("P1 good");
    click("Next");
    expect(heading()).toBe("Posture two?");
    choose("P2 good");
    click("Next");
    expect(heading()).toBe("Resilient headline");
    click("Continue");
    expect(heading()).toBe("Timeline?");
    click("Skip");
    expect(heading()).toBe("Call summary");
  });

  it("moves focus to each new screen's heading", () => {
    renderConsole();

    fillDetails();

    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("shows the talk track and a note beside every posture question", () => {
    renderConsole();
    goToFirstPosture();

    expect(screen.getByText("Why q1 matters")).toBeInTheDocument();
    expect(screen.getByText("Probe q1")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Note/)).toBeInTheDocument();

    choose("P1 good");
    click("Next");

    expect(screen.getByText("Why q2 matters")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Note/)).toHaveValue("");
  });

  it("needs a posture answer to move on, and doesn't auto-advance", () => {
    renderConsole();
    goToFirstPosture();

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    choose("P1 good");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Posture one?",
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  describe("skipping discovery", () => {
    it("sends skipped questions as not asked and answered ones as given", async () => {
      respondWith(200, { success: true });
      renderConsole();
      fillDetails();
      click("Continue");
      type(/^Note/, " Lost a laptop ");
      click("Next");
      click("Skip");
      choose("P1 good");
      click("Next");
      choose("P2 good");
      click("Next");
      click("Continue");
      choose("Now");
      type(/^Note/, "Before renewal");
      click("Next");

      click("Save to Syncro");
      await screen.findByText("Saved");

      expect(lastRequest().discovery).toEqual({
        why_now: { note: "Lost a laptop" },
        current_it: { isNotAsked: true },
        timeline: { choice: "Now", note: "Before renewal" },
      });
    });

    it("lets a skipped question be filled in later", async () => {
      respondWith(200, { success: true });
      renderConsole();
      goToSummary();

      fireEvent.click(screen.getByRole("button", { name: /Opening/ }));
      click("Skip");
      choose("Another MSP");
      click("Next");
      choose("P1 good");
      click("Next");
      click("Next");
      click("Continue");
      click("Skip");
      click("Save to Syncro");
      await screen.findByText("Saved");

      expect(lastRequest().discovery?.current_it).toEqual({
        choice: "Another MSP",
      });
    });

    it("can take back a choice, which makes the question not asked again", async () => {
      respondWith(200, { success: true });
      renderConsole();
      fillDetails();
      click("Continue");
      click("Skip");
      choose("Another MSP");

      click("Clear choice");

      expect(
        screen.getByRole("radio", { name: "Another MSP" }),
      ).not.toBeChecked();
      click("Skip");
      choose("P1 good");
      click("Next");
      choose("P2 good");
      click("Next");
      click("Continue");
      click("Skip");
      click("Save to Syncro");
      await screen.findByText("Saved");

      expect(lastRequest().discovery?.current_it).toEqual({ isNotAsked: true });
    });
  });

  describe("backtracking", () => {
    it("keeps answers and notes across sections, all the way back", () => {
      renderConsole();
      fillDetails();
      choose(/Small team/);
      click("Continue");
      type(/^Note/, "Audit finding");
      click("Next");
      choose("None");
      click("Next");
      choose("P1 bad");
      type(/^Note/, "SMS only");
      click("Next");
      choose("P2 good");
      click("Next");
      click("Continue");
      choose("Later");
      click("Next");
      type(/^Summary/, "Warm");

      const expectations: [string, () => void][] = [
        [
          "Timeline?",
          () =>
            expect(screen.getByRole("radio", { name: "Later" })).toBeChecked(),
        ],
        ["Reactive headline", () => {}],
        [
          "Posture two?",
          () =>
            expect(
              screen.getByRole("radio", { name: "P2 good" }),
            ).toBeChecked(),
        ],
        [
          "Posture one?",
          () => {
            expect(screen.getByRole("radio", { name: "P1 bad" })).toBeChecked();
            expect(screen.getByLabelText(/^Note/)).toHaveValue("SMS only");
          },
        ],
        [
          "Current IT?",
          () =>
            expect(screen.getByRole("radio", { name: "None" })).toBeChecked(),
        ],
        [
          "Why now?",
          () =>
            expect(screen.getByLabelText(/^Note/)).toHaveValue("Audit finding"),
        ],
        [
          "How big is the business?",
          () =>
            expect(
              screen.getByRole("radio", { name: /Small team/ }),
            ).toBeChecked(),
        ],
        [
          "Who are you speaking with?",
          () => expect(screen.getByLabelText(/^Company/)).toHaveValue("Acme"),
        ],
      ];

      for (const [heading, check] of expectations) {
        click("Back");
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          heading,
        );
        check();
      }
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    });

    it("jumps back to an earlier section from the progress bar", () => {
      renderConsole();
      goToResults();

      fireEvent.click(screen.getByRole("button", { name: /Posture/ }));

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Posture one?",
      );
    });

    it("asks a larger segment's extra question after the size changes", () => {
      renderConsole();
      goToResults();
      fireEvent.click(screen.getByRole("button", { name: /Size/ }));
      choose(/Growing business/);
      click("Continue");
      click("Skip");
      click("Skip");
      click("Next");
      click("Next");

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Growing only?",
      );
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });
  });

  describe("results", () => {
    it("shows score, weak areas and the next step, not the public CTA", () => {
      renderConsole();
      goToResults();

      expect(screen.getByRole("meter", { name: "Score" })).toHaveAttribute(
        "aria-valuetext",
        "3 of 6, Reactive",
      );
      expect(screen.getByText("MFA weak copy")).toBeInTheDocument();
      expect(screen.getByText("Propose solo reactive")).toBeInTheDocument();
      expect(screen.getByText(/Service solo reactive/)).toBeInTheDocument();
      expect(screen.queryByText(/Public CTA/)).toBeNull();
      expect(screen.queryByRole("link", { name: "Public button" })).toBeNull();
    });

    it("re-scores when a posture answer changes", () => {
      renderConsole();
      goToResults();

      click("Back");
      choose("P2 good");
      click("Next");

      expect(screen.getByRole("meter", { name: "Score" })).toHaveAttribute(
        "aria-valuetext",
        "6 of 6, Resilient",
      );
      expect(screen.getByText("Propose solo resilient")).toBeInTheDocument();
    });

    it("fires no analytics event", () => {
      renderConsole();
      goToResults();

      expect(trackGaEvent).not.toHaveBeenCalled();
    });
  });

  describe("saving", () => {
    it("posts once with no token, even when clicked twice", async () => {
      let resolveSave: (value: unknown) => void = () => {};
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
      );
      renderConsole();
      goToSummary();
      type(/^Summary/, " Warm lead ");

      const saveButton = screen.getByRole("button", { name: "Save to Syncro" });
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(saveButton).toBeDisabled();
      expect(lastRequest()).toEqual({
        name: "Pat Prospect",
        email: "pat@example.com",
        company: "Acme",
        segment: "solo",
        answers: { q1: 0, q2: 1 },
        notes: {},
        discovery: {
          why_now: { isNotAsked: true },
          current_it: { isNotAsked: true },
          timeline: { isNotAsked: true },
        },
        callSummary: "Warm lead",
      });

      await act(async () => {
        resolveSave({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      });
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    it("sends only the current segment's answers and notes", async () => {
      respondWith(200, { success: true });
      renderConsole();
      fillDetails();
      choose(/Growing business/);
      click("Continue");
      click("Skip");
      click("Skip");
      choose("P1 good");
      click("Next");
      choose("P2 good");
      click("Next");
      choose("P3 good");
      type(/^Note/, "Only for growing");
      click("Next");
      fireEvent.click(screen.getByRole("button", { name: /Size/ }));
      choose(/Solopreneur/);
      click("Continue");
      click("Skip");
      click("Skip");
      click("Next");
      click("Next");
      click("Continue");
      click("Skip");
      click("Save to Syncro");
      await screen.findByText("Saved");

      expect(lastRequest().answers).toEqual({ q1: 0, q2: 0 });
      expect(lastRequest().notes).toEqual({});
    });

    it("shows the error and retries on failure, then locks", async () => {
      respondWith(503, { error: "Syncro is down" });
      respondWith(200, { success: true });
      renderConsole();
      goToSummary();

      click("Save to Syncro");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Syncro is down",
      );
      expect(sessionStorage.length).toBe(1);

      click("Try again");
      await screen.findByText("Saved");

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it.each([
      [
        "a network failure",
        () => mockFetch.mockRejectedValueOnce(new Error("x")),
      ],
      [
        "an unreadable response",
        () =>
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.reject(new Error("not json")),
          }),
      ],
    ])("offers a retry after %s", async (_name, fail) => {
      fail();
      renderConsole();
      goToSummary();

      click("Save to Syncro");

      expect(await screen.findByRole("alert")).toHaveTextContent("didn't save");
      expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
    });

    it("on 401 asks the SDR to reopen the link and keeps the call", async () => {
      respondWith(401, { error: "Unauthorized" });
      renderConsole();
      goToSummary();
      type(/^Summary/, "Warm");

      click("Save to Syncro");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /Open your SDR link again/,
      );
      const stored = JSON.parse(
        sessionStorage.getItem(sessionStorage.key(0)!)!,
      );
      expect(stored.callSummary).toBe("Warm");
      expect(stored.lead.company).toBe("Acme");
    });

    it("locks read-only after success and clears storage", async () => {
      respondWith(200, { success: true });
      renderConsole();
      goToSummary();
      type(/^Summary/, "Warm");

      click("Save to Syncro");
      await screen.findByText("Saved");

      expect(sessionStorage.length).toBe(0);
      expect(screen.getByLabelText(/^Summary/)).toHaveAttribute("readonly");
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
      expect(
        screen.queryByRole("button", { name: /Save to Syncro/ }),
      ).toBeNull();
      expect(screen.queryByRole("button", { name: /Posture/ })).toBeNull();
    });

    it("starts a new call from a clean slate", async () => {
      respondWith(200, { success: true });
      renderConsole();
      goToSummary();
      click("Save to Syncro");
      await screen.findByText("Saved");

      click("Start a new call");

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Who are you speaking with?",
      );
      expect(screen.getByLabelText(/^Name/)).toHaveValue("");
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe("reload", () => {
    it("restores the call and screen in a fresh mount", async () => {
      const first = renderConsole();
      fillDetails();
      click("Continue");
      type(/^Note/, "Audit finding");
      click("Next");
      choose("Another MSP");
      click("Next");
      choose("P1 bad");
      type(/^Note/, "SMS only");
      first.unmount();

      renderConsole();

      await waitFor(() =>
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Posture one?",
        ),
      );
      expect(screen.getByRole("radio", { name: "P1 bad" })).toBeChecked();
      expect(screen.getByLabelText(/^Note/)).toHaveValue("SMS only");
      click("Back");
      expect(screen.getByRole("radio", { name: "Another MSP" })).toBeChecked();
    });

    it("restores results with the same score", async () => {
      const first = renderConsole();
      goToResults();
      first.unmount();

      renderConsole();

      expect(
        await screen.findByRole("meter", { name: "Score" }),
      ).toHaveAttribute("aria-valuetext", "3 of 6, Reactive");
    });

    it("stores nothing resembling a token, and no idle save state", () => {
      renderConsole();
      fillDetails();

      expect(sessionStorage.length).toBe(1);
      const stored = JSON.parse(
        sessionStorage.getItem(sessionStorage.key(0)!)!,
      );
      expect(Object.keys(stored).sort()).toEqual([
        "answers",
        "callSummary",
        "discovery",
        "lead",
        "notes",
        "screen",
        "segment",
      ]);
      expect(localStorage.length).toBe(0);
    });

    describe("after a reload during a save", () => {
      const MAY_HAVE_SAVED = /may already have reached Syncro/;

      function reloadDuringSave() {
        mockFetch.mockReturnValueOnce(new Promise(() => {}));
        const first = renderConsole();
        goToSummary();
        click("Save to Syncro");
        expect(mockFetch).toHaveBeenCalledTimes(1);
        first.unmount();
        mockFetch.mockClear();
        return renderConsole();
      }

      it("warns that it may have saved, and sends nothing by itself", async () => {
        reloadDuringSave();

        expect(await screen.findByText(MAY_HAVE_SAVED)).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "Save to Syncro" }),
        ).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("retries only on an explicit confirmation, once", async () => {
        reloadDuringSave();
        const confirm = await screen.findByRole("button", {
          name: "Save again anyway",
        });
        respondWith(200, { success: true });

        fireEvent.click(confirm);

        expect(await screen.findByText("Saved")).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(MAY_HAVE_SAVED)).toBeNull();
      });

      it("still warns after another reload", async () => {
        const second = reloadDuringSave();
        await screen.findByText(MAY_HAVE_SAVED);
        second.unmount();

        renderConsole();

        expect(await screen.findByText(MAY_HAVE_SAVED)).toBeInTheDocument();
      });

      it("keeps warning while the SDR moves around the call", async () => {
        reloadDuringSave();
        await screen.findByText(MAY_HAVE_SAVED);

        click("Back");
        click("Skip");

        expect(screen.getByText(MAY_HAVE_SAVED)).toBeInTheDocument();
      });

      it("lets the SDR start a new call if the save did arrive", async () => {
        reloadDuringSave();

        fireEvent.click(
          await screen.findByRole("button", { name: "Start a new call" }),
        );

        expect(
          screen.getByRole("heading", { name: "Who are you speaking with?" }),
        ).toBeInTheDocument();
        expect(mockFetch).not.toHaveBeenCalled();
        expect(sessionStorage.length).toBe(0);
      });

      it("doesn't warn once a failed retry shows the save didn't land", async () => {
        reloadDuringSave();
        const confirm = await screen.findByRole("button", {
          name: "Save again anyway",
        });
        respondWith(503, { error: "Service down" });

        fireEvent.click(confirm);

        expect(await screen.findByText("Service down")).toBeInTheDocument();
        expect(screen.queryByText(MAY_HAVE_SAVED)).toBeNull();
        expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
      });
    });

    it("doesn't warn after a reload with no save under way", async () => {
      const first = renderConsole();
      goToSummary();
      first.unmount();

      renderConsole();

      expect(
        await screen.findByRole("button", { name: "Save to Syncro" }),
      ).toBeEnabled();
      expect(screen.queryByText(/may already have reached/)).toBeNull();
    });

    it("works with storage unavailable", () => {
      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("blocked");
      });

      renderConsole();
      fillDetails();

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "How big is the business?",
      );
    });

    function storedCall(overrides: Record<string, unknown>) {
      const key = "sdr-call";
      sessionStorage.setItem(
        key,
        JSON.stringify({
          screen: { name: "size" },
          lead: { name: "Pat", email: "pat@example.com", company: "Acme" },
          segment: "solo",
          answers: {},
          notes: {},
          discovery: {},
          callSummary: "",
          ...overrides,
        }),
      );
    }

    it("resumes a well-formed stored call", async () => {
      storedCall({});

      renderConsole();

      expect(
        await screen.findByRole("heading", {
          name: "How big is the business?",
        }),
      ).toBeInTheDocument();
    });

    it.each([
      ["a non-object", () => sessionStorage.setItem("sdr-call", '"x"')],
      ["bad JSON", () => sessionStorage.setItem("sdr-call", "{oops")],
      ["an unknown segment", () => storedCall({ segment: "huge" })],
      ["a bad lead", () => storedCall({ lead: { name: "Pat" } })],
      ["a bad answers map", () => storedCall({ answers: { q1: "0" } })],
      [
        "a screen that doesn't exist",
        () => storedCall({ screen: { name: "posture", index: 99 } }),
      ],
    ])("ignores %s in storage", (_name, seed) => {
      seed();

      renderConsole();

      expect(
        screen.getByRole("heading", { name: "Who are you speaking with?" }),
      ).toBeInTheDocument();
    });

    it("sends a results screen whose answers no longer score back to the questions", async () => {
      storedCall({ screen: { name: "results" }, answers: { q1: 0 } });

      renderConsole();

      expect(
        await screen.findByRole("heading", { name: "Posture one?" }),
      ).toBeInTheDocument();
    });
  });
});
