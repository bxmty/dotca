import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SecurityAssessmentQuiz from "@/app/security-assessment/SecurityAssessmentQuiz";
import SecurityAssessmentPage from "@/app/security-assessment/page";
import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  type QuizConfig,
  type QuizCta,
  type QuizSegment,
  type RiskTier,
} from "@/lib/security-assessment";

function buildTestCtas(): Record<QuizSegment, Record<RiskTier, QuizCta>> {
  return Object.fromEntries(
    QUIZ_SEGMENTS.map((segment) => [
      segment,
      Object.fromEntries(
        RISK_TIERS.map((tier) => [
          tier,
          {
            heading: `CTA ${segment} ${tier}`,
            body: `CTA body ${segment} ${tier}`,
            buttonLabel: "Take action",
            buttonHref: "/#contact",
          },
        ]),
      ),
    ]),
  ) as Record<QuizSegment, Record<RiskTier, QuizCta>>;
}

const testConfig: QuizConfig = {
  landing: {
    title: "Test quiz title",
    intro: "Test intro copy",
    timeEstimate: "Takes about 3 minutes",
    startLabel: "Start the assessment",
  },
  segments: {
    solo: { label: "Solopreneur", description: "Just me" },
    small_team: { label: "Small team", description: "5-20 employees" },
    growing: { label: "Growing business", description: "20-50 employees" },
  },
  sections: {
    essentials: { label: "Essentials" },
    focus: { label: "Focus areas" },
  },
  sizeQuestion: "How big is your business?",
  tiers: {
    exposed: {
      label: "Exposed",
      headline: "Exposed headline",
      body: "Exposed body",
    },
    reactive: {
      label: "Reactive",
      headline: "Reactive headline",
      body: "Reactive body",
    },
    managed: {
      label: "Managed",
      headline: "Managed headline",
      body: "Managed body",
    },
    resilient: {
      label: "Resilient",
      headline: "Resilient headline",
      body: "Resilient body",
    },
  },
  thresholds: {
    solo: { reactive: 2, managed: 4, resilient: 6 },
    small_team: { reactive: 3, managed: 6, resilient: 8 },
    growing: { reactive: 4, managed: 8, resilient: 11 },
  },
  categories: {
    mfa: {
      section: "essentials",
      label: "Passwords & MFA",
      weakCopy: "MFA weak copy",
    },
    backups: {
      section: "focus",
      label: "Backups",
      weakCopy: "Backups weak copy",
    },
  },
  questions: [
    {
      id: "q1",
      category: "mfa",
      segments: ["solo", "small_team", "growing"],
      text: "First question text",
      answers: [
        { text: "Q1 good answer", points: 3 },
        { text: "Q1 bad answer", points: 0, risk: true },
      ],
    },
    {
      id: "q2",
      category: "backups",
      segments: ["solo", "small_team", "growing"],
      text: "Second question text",
      answers: [
        { text: "Q2 good answer", points: 3 },
        { text: "Q2 bad answer", points: 0, risk: true },
      ],
    },
    {
      id: "q3",
      category: "backups",
      segments: ["growing"],
      text: "Growing-only question text",
      answers: [
        { text: "Q3 good answer", points: 3 },
        { text: "Q3 bad answer", points: 0, risk: true },
      ],
    },
  ],
  ctas: buildTestCtas(),
};

const mockFetch = jest.fn();

function mockDeliveryResponse(status: number, body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

function goToDetails(segmentName: RegExp = /Solopreneur/i) {
  render(<SecurityAssessmentQuiz config={testConfig} />);
  fireEvent.click(
    screen.getByRole("button", { name: /Start the assessment/i }),
  );
  fireEvent.click(screen.getByRole("radio", { name: segmentName }));
  fireEvent.click(screen.getByRole("button", { name: /^Continue$/i }));
}

function fillLeadDetails() {
  fireEvent.change(screen.getByLabelText(/^Name/i), {
    target: { value: "Dana Tester" },
  });
  fireEvent.change(screen.getByLabelText(/^Email/i), {
    target: { value: "dana@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^Company/i), {
    target: { value: "Tester Accounting" },
  });
}

function startSoloQuiz() {
  goToDetails();
  fillLeadDetails();
  fireEvent.click(screen.getByRole("button", { name: /Start the questions/i }));
}

async function answerSoloQuestions() {
  fireEvent.click(screen.getByRole("radio", { name: /Q1 good answer/i }));
  act(() => {
    jest.advanceTimersByTime(300);
  });
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Second question text" }),
    ).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("radio", { name: /Q2 bad answer/i }));
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

describe("SecurityAssessmentQuiz", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the landing screen with config copy", () => {
    render(<SecurityAssessmentQuiz config={testConfig} />);
    expect(screen.getByText("Test quiz title")).toBeInTheDocument();
    expect(screen.getByText("Test intro copy")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start the assessment/i }),
    ).toBeInTheDocument();
  });

  it("routes to the size question and shows all three segments", () => {
    render(<SecurityAssessmentQuiz config={testConfig} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Start the assessment/i }),
    );
    expect(screen.getByText("How big is your business?")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Solopreneur/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Small team/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Growing business/i }),
    ).toBeInTheDocument();
  });

  it("shows only the segment's questions with a progress indicator", async () => {
    startSoloQuiz();
    expect(
      screen.getByRole("heading", { level: 1, name: "First question text" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /Q1 good answer/i }));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Second question text" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
  });

  it("includes the growing-only question for the growing segment", () => {
    goToDetails(/Growing business/i);
    fillLeadDetails();
    fireEvent.click(
      screen.getByRole("button", { name: /Start the questions/i }),
    );
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
  });

  it("requires name, email and company before any question", () => {
    goToDetails();
    expect(
      screen.queryByRole("heading", { level: 1, name: "First question text" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Start the questions/i }),
    );

    expect(screen.getByText("enter your name")).toBeInTheDocument();
    expect(screen.getByText("enter your email address")).toBeInTheDocument();
    expect(screen.getByText("enter your company name")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/i)).toHaveFocus();
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument();
  });

  it("rejects an incomplete email address", () => {
    goToDetails();
    fillLeadDetails();
    fireEvent.change(screen.getByLabelText(/^Email/i), {
      target: { value: "dana@example" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Start the questions/i }),
    );

    expect(
      screen.getByText("enter the full address, like dana@company.ca"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument();
  });

  it("keeps the details when stepping back from the first question", () => {
    startSoloQuiz();
    fireEvent.click(screen.getByRole("button", { name: /^Back$/i }));

    expect(screen.getByLabelText(/^Name/i)).toHaveValue("Dana Tester");
    expect(screen.getByLabelText(/^Company/i)).toHaveValue("Tester Accounting");
  });

  it("lets the respondent go back and change an answer", async () => {
    startSoloQuiz();
    fireEvent.click(screen.getByRole("radio", { name: /Q1 good answer/i }));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Second question text" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Back$/i }));
    expect(
      screen.getByRole("heading", { level: 1, name: "First question text" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Q1 good answer/i }),
    ).toBeChecked();

    fireEvent.click(screen.getByRole("radio", { name: /Q1 bad answer/i }));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Second question text" }),
      ).toBeInTheDocument();
    });
  });

  it("shows scored results and delivers the lead once", async () => {
    mockDeliveryResponse(200, { success: true });
    startSoloQuiz();
    await answerSoloQuestions();

    await waitFor(() => {
      expect(screen.getByText("Reactive headline")).toBeInTheDocument();
    });
    expect(screen.getByText("Backups weak copy")).toBeInTheDocument();
    expect(screen.getByText("CTA solo reactive")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(/We'll follow up at dana@example.com/),
      ).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/security-assessment");
    expect(JSON.parse(init.body)).toEqual({
      name: "Dana Tester",
      email: "dana@example.com",
      company: "Tester Accounting",
      website: "",
      wantsBrief: false,
      segment: "solo",
      answers: { q1: 0, q2: 1 },
    });
  });

  it("does not deliver a second lead after reviewing answers", async () => {
    mockDeliveryResponse(200, { success: true });
    startSoloQuiz();
    await answerSoloQuestions();
    await waitFor(() => {
      expect(screen.getByText(/We'll follow up at/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Review answers/i }));
    fireEvent.click(screen.getByRole("radio", { name: /Q2 good answer/i }));
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Resilient headline")).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("offers a retry when delivery fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockDeliveryResponse(503, { error: "Service unavailable" });
    startSoloQuiz();
    await answerSoloQuestions();

    await waitFor(() => {
      expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    });
    expect(screen.getByText("Reactive headline")).toBeInTheDocument();

    mockDeliveryResponse(200, { success: true });
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));

    await waitFor(() => {
      expect(screen.getByText(/We'll follow up at/)).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("SecurityAssessmentPage (server wrapper)", () => {
  it("renders the quiz from the real config", () => {
    render(<SecurityAssessmentPage />);
    expect(
      screen.getByText("How exposed is your business?"),
    ).toBeInTheDocument();
  });
});
