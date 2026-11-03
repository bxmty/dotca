import {
  INITIAL_CALL,
  reduceCall,
  type CallContent,
  type CallState,
} from "@/app/security-assessment/call/callState";
import {
  projectPresenterScreen,
  type PresenterScreen,
} from "@/app/security-assessment/call/presenterBroadcast";
import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  type QuizConfig,
  type QuizSegment,
  type RiskTier,
} from "@/lib/security-assessment/quizTypes";
import type { NextStep } from "@/lib/security-assessment/sdrTypes";

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

// SECRET_ marks every string that must stay on the console.
const config: QuizConfig = {
  landing: { title: "", intro: "", timeEstimate: "", startLabel: "" },
  segments: {
    solo: { label: "Solopreneur", description: "Just me" },
    small_team: { label: "Small team", description: "5-20" },
    growing: { label: "Growing business", description: "20-50" },
  },
  sections: { access: { label: "Access" }, data: { label: "Data" } },
  sizeQuestion: "How big?",
  tiers: {
    exposed: { label: "Exposed", headline: "Exposed headline", body: "b" },
    reactive: { label: "Reactive", headline: "Reactive headline", body: "b" },
    managed: { label: "Managed", headline: "Resilient h", body: "b" },
    resilient: { label: "Resilient", headline: "Resilient h", body: "b" },
  },
  thresholds: {
    solo: { reactive: 2, managed: 4, resilient: 6 },
    small_team: { reactive: 2, managed: 4, resilient: 6 },
    growing: { reactive: 2, managed: 4, resilient: 6 },
  },
  categories: {
    mfa: { section: "access", label: "MFA", weakCopy: "MFA weak" },
    backup: { section: "data", label: "Backups", weakCopy: "Backups weak" },
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
    {
      id: "q3",
      category: "backup",
      segments: ["solo", "small_team", "growing"],
      text: "Posture three?",
      answers: [
        { text: "P3 good", points: 3 },
        { text: "P3 bad", points: 0 },
      ],
    },
  ],
  ctas: perSegmentAndTier(() => ({
    heading: "SECRET_cta_heading",
    body: "SECRET_cta_body",
    buttonLabel: "SECRET_cta_button",
    buttonHref: "/SECRET_cta_href",
  })),
};

const content: CallContent = {
  config,
  sdr: {
    status: "draft",
    talkTracks: {
      q1: { whyItMatters: "SECRET_why", probe: "SECRET_probe" },
    },
    nextSteps: perSegmentAndTier<NextStep>(() => ({
      propose: "SECRET_propose",
      service: "SECRET_service",
    })),
    discovery: [
      { id: "why_now", group: "opening", kind: "text", text: "SECRET_q_open" },
      {
        id: "timeline",
        group: "closing",
        kind: "choice",
        text: "SECRET_q_close",
        choices: ["SECRET_choice"],
      },
    ],
  },
};

const fullCall: CallState = {
  ...INITIAL_CALL,
  segment: "small_team",
  lead: {
    name: "SECRET_name",
    email: "SECRET_email",
    company: "SECRET_company",
  },
  answers: { q1: 1, q2: 0, q3: 0 },
  notes: { q1: "SECRET_note" },
  discovery: { why_now: { note: "SECRET_dnote", choice: "SECRET_dchoice" } },
  callSummary: "SECRET_summary",
};

const NEUTRAL: PresenterScreen = { view: "neutral" };

describe("projectPresenterScreen", () => {
  it.each([
    ["details", { name: "details" }],
    ["size", { name: "size" }],
    ["opening discovery", { name: "opening", index: 0 }],
    ["closing discovery", { name: "closing", index: 0 }],
    ["the summary before the save", { name: "summary" }],
  ] as const)("is neutral on %s", (_label, screen) => {
    expect(projectPresenterScreen(content, { ...fullCall, screen })).toEqual(
      NEUTRAL,
    );
  });

  it("stays neutral on the summary while the save is sending or failed", () => {
    const screen = { name: "summary" } as const;
    for (const save of [
      { status: "sending" },
      { status: "error", message: "SECRET_error" },
    ] as const) {
      expect(
        projectPresenterScreen(content, { ...fullCall, screen, save }),
      ).toEqual(NEUTRAL);
    }
  });

  it("gives the posture question with its answers and section progress", () => {
    expect(
      projectPresenterScreen(content, {
        ...fullCall,
        screen: { name: "posture", index: 1 },
      }),
    ).toEqual({
      view: "posture",
      questionId: "q2",
      text: "Posture two?",
      answers: ["P2 good", "P2 bad"],
      selectedIndex: 0,
      categoryLabel: "MFA",
      position: 2,
      total: 3,
      sections: ["Access", "Data"],
      currentSection: 1,
      sectionFraction: 1,
    });
  });

  it("has no selection on an unanswered question", () => {
    expect(
      projectPresenterScreen(content, {
        ...fullCall,
        answers: {},
        screen: { name: "posture", index: 2 },
      }),
    ).toMatchObject({ selectedIndex: null, currentSection: 2 });
  });

  it.each([
    ["the results step", { screen: { name: "results" } }],
    [
      "the summary after the save",
      { screen: { name: "summary" }, save: { status: "saved" } },
    ],
  ] as const)("gives the result on %s", (_label, patch) => {
    expect(
      projectPresenterScreen(content, { ...fullCall, ...patch }),
    ).toMatchObject({
      view: "results",
      result: {
        tier: "resilient",
        headline: "Resilient h",
        score: 6,
        maxScore: 9,
        weakAreas: [
          { sectionLabel: "Access", label: "MFA", weakCopy: "MFA weak" },
        ],
      },
    });
  });

  it("is neutral on results with no score yet", () => {
    expect(
      projectPresenterScreen(content, {
        ...fullCall,
        answers: {},
        screen: { name: "results" },
      }),
    ).toEqual(NEUTRAL);
  });

  it("never carries private content on any screen", () => {
    const screens: CallState[] = [
      { ...fullCall, screen: { name: "details" } },
      { ...fullCall, screen: { name: "size" } },
      { ...fullCall, screen: { name: "opening", index: 0 } },
      { ...fullCall, screen: { name: "posture", index: 0 } },
      { ...fullCall, screen: { name: "results" } },
      { ...fullCall, screen: { name: "closing", index: 0 } },
      { ...fullCall, screen: { name: "summary" } },
      { ...fullCall, screen: { name: "summary" }, save: { status: "saved" } },
    ];
    for (const state of screens) {
      expect(
        JSON.stringify(projectPresenterScreen(content, state)),
      ).not.toContain("SECRET_");
    }
  });

  it("doesn't send the answers' points", () => {
    const posture = projectPresenterScreen(content, {
      ...fullCall,
      screen: { name: "posture", index: 0 },
    });
    expect(JSON.stringify(posture)).not.toMatch(/points|risk/);
  });
});

describe("an answer from the presenter", () => {
  const onQuestionOne: CallState = {
    ...INITIAL_CALL,
    screen: { name: "posture", index: 0 },
  };
  const answer = (questionId: string, answerIndex: number) =>
    ({ type: "answerFromPresenter", questionId, answerIndex }) as const;

  it("records on the question on screen", () => {
    expect(reduceCall(content, onQuestionOne, answer("q1", 1)).answers).toEqual(
      { q1: 1 },
    );
  });

  it.each([
    ["another question", "q2", 0],
    ["an answer that doesn't exist", "q1", 9],
    ["a non-integer answer", "q1", 0.5],
  ])("ignores %s", (_label, questionId, answerIndex) => {
    expect(
      reduceCall(content, onQuestionOne, answer(questionId, answerIndex)),
    ).toBe(onQuestionOne);
  });

  it.each(["sending", "saved"] as const)(
    "is ignored while the save is %s",
    (status) => {
      const locked: CallState = { ...onQuestionOne, save: { status } };
      expect(reduceCall(content, locked, answer("q1", 1))).toBe(locked);
    },
  );
});
