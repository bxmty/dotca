import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import CallConsole from "@/app/security-assessment/call/CallConsole";
import CallPresenter from "@/app/security-assessment/call/CallPresenter";
import PresenterPage, {
  metadata,
} from "@/app/security-assessment/call/present/page";
import { SdrCallSession } from "@/app/security-assessment/call/SdrCallSession";
import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  type QuizConfig,
  type QuizSegment,
  type RiskTier,
} from "@/lib/security-assessment/quizTypes";
import type { SdrContent } from "@/lib/security-assessment/sdrTypes";

/**
 * Both tabs render in one document, joined by a fake of the browser's channel:
 * jsdom has none. Delivery is a later task to everyone but the sender, like the
 * real one, and goes through JSON so the messages must be serializable.
 */
class FakeBroadcastChannel {
  static openChannels = new Set<FakeBroadcastChannel>();
  static sent: string[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(readonly name: string) {
    FakeBroadcastChannel.openChannels.add(this);
  }

  postMessage(data: unknown) {
    const json = JSON.stringify(data);
    FakeBroadcastChannel.sent.push(json);
    queueMicrotask(() => {
      for (const peer of FakeBroadcastChannel.openChannels) {
        if (peer !== this && peer.name === this.name) {
          peer.onmessage?.({ data: JSON.parse(json) });
        }
      }
    });
  }

  close() {
    FakeBroadcastChannel.openChannels.delete(this);
  }
}

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
  landing: { title: "", intro: "", timeEstimate: "", startLabel: "" },
  segments: {
    solo: { label: "Solopreneur", description: "Just me" },
    small_team: { label: "Small team", description: "5-20" },
    growing: { label: "Growing business", description: "20-50" },
  },
  sections: { access: { label: "Access" } },
  sizeQuestion: "How big is the business?",
  tiers: {
    exposed: { label: "Exposed", headline: "Exposed headline", body: "b" },
    reactive: { label: "Reactive", headline: "Reactive headline", body: "b" },
    managed: { label: "Managed", headline: "Managed headline", body: "b" },
    resilient: { label: "Resilient", headline: "Resilient head", body: "b" },
  },
  thresholds: {
    solo: { reactive: 1, managed: 4, resilient: 6 },
    small_team: { reactive: 1, managed: 4, resilient: 6 },
    growing: { reactive: 1, managed: 4, resilient: 6 },
  },
  categories: {
    mfa: { section: "access", label: "MFA", weakCopy: "MFA weak copy" },
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
        { text: "P2 bad", points: 0 },
      ],
    },
  ],
  ctas: perSegmentAndTier(() => ({
    heading: "Private CTA",
    body: "",
    buttonLabel: "Private button",
    buttonHref: "/",
  })),
};

const sdr: SdrContent = {
  status: "draft",
  talkTracks: {
    q1: { whyItMatters: "Private why q1", probe: "Private probe q1" },
    q2: { whyItMatters: "Private why q2", probe: "Private probe q2" },
  },
  nextSteps: perSegmentAndTier(() => ({
    propose: "Private propose",
    service: "Private service",
  })),
  discovery: [
    { id: "why_now", group: "opening", kind: "text", text: "Private why now?" },
    {
      id: "timeline",
      group: "closing",
      kind: "choice",
      text: "Private timeline?",
      choices: ["Now", "Later"],
    },
  ],
};

const NEUTRAL = "Getting to know your business";
const WAITING = "Waiting for the console";

const flush = () => act(async () => {});

function renderTab(testId: string, tab: React.ReactNode) {
  return render(<div data-testid={testId}>{tab}</div>);
}

function openConsole() {
  return renderTab(
    "console",
    <SdrCallSession sdrName="Alex Doe">
      <CallConsole config={config} sdr={sdr} />
    </SdrCallSession>,
  );
}

// The form only scopes its radios: real tabs don't share a radio group, but two
// groups named after the same question in one document would.
const openPresenter = () =>
  renderTab(
    "presenter",
    <form>
      <CallPresenter />
    </form>,
  );
const consoleTab = () => within(screen.getByTestId("console"));
const presenterTab = () => within(screen.getByTestId("presenter"));

function clickOnConsole(name: string | RegExp) {
  fireEvent.click(consoleTab().getByRole("button", { name }));
}

/** From the first screen to the first posture question, on the console. */
async function advanceToPosture() {
  for (const [label, value] of [
    [/^Name/, "Pat Prospect"],
    [/^Email/, "pat@example.com"],
    [/^Company/, "Acme"],
  ] as const) {
    fireEvent.change(consoleTab().getByLabelText(label), { target: { value } });
  }
  clickOnConsole("Continue"); // details
  clickOnConsole("Continue"); // size
  clickOnConsole("Skip"); // opening discovery
  await flush();
}

async function answerBothOnConsole() {
  fireEvent.click(consoleTab().getByRole("radio", { name: "P1 bad" }));
  clickOnConsole("Next");
  fireEvent.click(consoleTab().getByRole("radio", { name: "P2 good" }));
  clickOnConsole("Next");
  await flush();
}

describe("the presenter tab", () => {
  beforeEach(() => {
    sessionStorage.clear();
    FakeBroadcastChannel.openChannels.clear();
    FakeBroadcastChannel.sent = [];
    Object.defineProperty(globalThis, "BroadcastChannel", {
      value: FakeBroadcastChannel,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
  });

  it("waits when there's no console", async () => {
    openPresenter();
    await flush();
    expect(
      presenterTab().getByRole("heading", { name: WAITING }),
    ).toBeInTheDocument();
  });

  it("waits, without crashing, in a browser with no BroadcastChannel", async () => {
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
    openPresenter();
    await flush();
    expect(
      presenterTab().getByRole("heading", { name: WAITING }),
    ).toBeInTheDocument();
  });

  it("shows the neutral screen on details, discovery and the summary", async () => {
    openPresenter();
    openConsole();
    await flush();
    expect(
      presenterTab().getByRole("heading", { name: NEUTRAL }),
    ).toBeInTheDocument();

    await advanceToPosture();
    clickOnConsole("Back"); // back onto opening discovery
    await flush();
    expect(consoleTab().getByText("Private why now?")).toBeInTheDocument();
    expect(
      presenterTab().getByRole("heading", { name: NEUTRAL }),
    ).toBeInTheDocument();
    expect(presenterTab().queryByText("Private why now?")).toBeNull();
  });

  it("follows the console's question, answers and progress", async () => {
    openPresenter();
    openConsole();
    await advanceToPosture();

    const presenter = presenterTab();
    expect(
      presenter.getByRole("heading", { name: "Posture one?" }),
    ).toBeInTheDocument();
    expect(presenter.getByText("Question 1 of 2")).toBeInTheDocument();
    expect(presenter.getByText(/Access/)).toBeInTheDocument();
    expect(presenter.getByRole("radio", { name: "P1 good" })).not.toBeChecked();

    fireEvent.click(consoleTab().getByRole("radio", { name: "P1 bad" }));
    await flush();
    expect(presenter.getByRole("radio", { name: "P1 bad" })).toBeChecked();

    clickOnConsole("Next");
    await flush();
    expect(
      presenter.getByRole("heading", { name: "Posture two?" }),
    ).toBeInTheDocument();
  });

  it("sends an answer to the console, which stays the source of truth", async () => {
    openPresenter();
    openConsole();
    await advanceToPosture();

    fireEvent.click(presenterTab().getByRole("radio", { name: "P1 bad" }));
    // Not checked by its own click: only what the console sends back counts.
    expect(
      presenterTab().getByRole("radio", { name: "P1 bad" }),
    ).not.toBeChecked();

    await flush();
    expect(consoleTab().getByRole("radio", { name: "P1 bad" })).toBeChecked();
    expect(presenterTab().getByRole("radio", { name: "P1 bad" })).toBeChecked();
    expect(consoleTab().getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("catches up at once when opened mid-call", async () => {
    openConsole();
    await advanceToPosture();
    fireEvent.click(consoleTab().getByRole("radio", { name: "P1 bad" }));
    await flush();

    openPresenter();
    await flush();

    expect(
      presenterTab().getByRole("heading", { name: "Posture one?" }),
    ).toBeInTheDocument();
    expect(presenterTab().getByRole("radio", { name: "P1 bad" })).toBeChecked();
  });

  it("shows results with no CTA or next step, and keeps them after the save", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as Response);
    openPresenter();
    openConsole();
    await advanceToPosture();
    await answerBothOnConsole();

    const presenter = presenterTab();
    expect(
      presenter.getByRole("heading", { name: "Reactive headline" }),
    ).toBeInTheDocument();
    expect(presenter.getByRole("meter", { name: "Score" })).toHaveAttribute(
      "aria-valuetext",
      "3 of 6, Reactive",
    );
    expect(presenter.getByText("MFA weak copy")).toBeInTheDocument();
    expect(consoleTab().getByText("Private propose")).toBeInTheDocument();
    expect(presenter.queryByText("Private propose")).toBeNull();
    expect(presenter.queryByText("Private CTA")).toBeNull();
    expect(presenter.queryByRole("link")).toBeNull();
    expect(presenter.queryByRole("button")).toBeNull();

    clickOnConsole("Continue"); // to closing discovery
    await flush();
    expect(
      presenter.getByRole("heading", { name: NEUTRAL }),
    ).toBeInTheDocument();

    clickOnConsole("Skip");
    await flush();
    expect(
      presenter.getByRole("heading", { name: NEUTRAL }),
    ).toBeInTheDocument();

    clickOnConsole("Save to Syncro");
    await flush();
    await flush();
    expect(
      consoleTab().getByRole("button", { name: "Start a new call" }),
    ).toBeInTheDocument();
    expect(
      presenter.getByRole("heading", { name: "Reactive headline" }),
    ).toBeInTheDocument();
    expect(presenter.queryByRole("radio")).toBeNull();
  });

  it("never sends notes, talk tracks or contact details over the channel", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as Response);
    openPresenter();
    openConsole();
    await advanceToPosture();
    fireEvent.change(consoleTab().getByLabelText(/^Note/), {
      target: { value: "Private note" },
    });
    await answerBothOnConsole();
    clickOnConsole("Continue");
    clickOnConsole("Skip");
    clickOnConsole("Save to Syncro");
    await flush();
    await flush();

    const sent = FakeBroadcastChannel.sent.join("\n");
    expect(sent).toContain("Posture one?");
    expect(sent).not.toMatch(/Private|Pat Prospect|pat@example|Acme|Alex Doe/);
  });

  it("waits when the console goes away, then catches up when it reloads", async () => {
    openPresenter();
    const firstConsole = openConsole();
    await advanceToPosture();
    fireEvent.click(presenterTab().getByRole("radio", { name: "P1 good" }));
    await flush();

    // A reload: the page goes, then a new one restores from sessionStorage.
    window.dispatchEvent(new Event("pagehide"));
    await flush();
    expect(
      presenterTab().getByRole("heading", { name: WAITING }),
    ).toBeInTheDocument();
    firstConsole.unmount();

    openConsole();
    await flush();
    expect(
      presenterTab().getByRole("heading", { name: "Posture one?" }),
    ).toBeInTheDocument();
    expect(
      presenterTab().getByRole("radio", { name: "P1 good" }),
    ).toBeChecked();
  });

  it("comes back when the console's page returns from the back/forward cache", async () => {
    openPresenter();
    openConsole();
    await advanceToPosture();

    window.dispatchEvent(new Event("pagehide"));
    await flush();
    window.dispatchEvent(new Event("pageshow"));
    await flush();

    expect(
      presenterTab().getByRole("heading", { name: "Posture one?" }),
    ).toBeInTheDocument();
  });

  it("doesn't flash the first screen while a reloaded console restores", async () => {
    openConsole().unmount();
    openConsole();
    await advanceToPosture();
    FakeBroadcastChannel.sent = [];
    cleanup();

    openConsole();
    await flush();

    expect(FakeBroadcastChannel.sent.join()).not.toContain('"view":"neutral"');
    expect(FakeBroadcastChannel.sent.join()).toContain("Posture one?");
  });

  it("waits when a crashed console stops answering, then recovers", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    openPresenter();
    const crashed = openConsole();
    await flush();
    expect(
      presenterTab().getByRole("heading", { name: NEUTRAL }),
    ).toBeInTheDocument();

    // No pagehide: the console's channel just stops responding.
    const [, ...consoleChannels] = FakeBroadcastChannel.openChannels;
    for (const channel of consoleChannels) channel.onmessage = null;
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(
      presenterTab().getByRole("heading", { name: WAITING }),
    ).toBeInTheDocument();

    crashed.unmount();
    openConsole();
    await act(async () => {});
    expect(
      presenterTab().getByRole("heading", { name: NEUTRAL }),
    ).toBeInTheDocument();
  });

  it("keeps showing the call while an idle console keeps answering", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    openPresenter();
    openConsole();
    await flush();

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    expect(
      presenterTab().getByRole("heading", { name: NEUTRAL }),
    ).toBeInTheDocument();
  });

  it("follows one console, and sends its answers only there", async () => {
    openPresenter();
    openConsole();
    await advanceToPosture();
    await flush();

    // A second console tab, on another call's first screen.
    render(
      <div data-testid="second-console">
        <SdrCallSession sdrName="Alex Doe">
          <CallConsole config={config} sdr={sdr} />
        </SdrCallSession>
      </div>,
    );
    await flush();

    expect(
      presenterTab().getByRole("heading", { name: "Posture one?" }),
    ).toBeInTheDocument();

    fireEvent.click(presenterTab().getByRole("radio", { name: "P1 bad" }));
    await flush();
    expect(consoleTab().getByRole("radio", { name: "P1 bad" })).toBeChecked();
  });

  describe("the console's Open presenter button", () => {
    it("opens a new window with no opener, no token and no storage copy", async () => {
      const open = jest.spyOn(window, "open").mockReturnValue(null);
      openConsole();

      clickOnConsole("Open presenter");

      expect(open).toHaveBeenCalledTimes(1);
      const [url, target, features] = open.mock.calls[0];
      expect(url).toBe("/security-assessment/call/present");
      expect(target).toBe("_blank");
      expect(features).toContain("noopener");
      expect(features).toContain("popup");
      open.mockRestore();
    });
  });

  describe("the page", () => {
    it("gives the presenter no props", () => {
      const page = PresenterPage();
      expect(page.type).toBe(CallPresenter);
      expect(page.props).toEqual({});
    });

    it("is noindex and not canonical to the quiz", () => {
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(metadata.referrer).toBe("no-referrer");
      expect(metadata.alternates).toEqual({ canonical: null });
    });

    it("has a title safe for a shared screen", () => {
      expect(metadata.title).not.toMatch(/console|SDR/i);
    });
  });
});
