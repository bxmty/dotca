import {
  INITIAL_CALL,
  reduceCall,
  selectCallResult,
  type CallAction,
  type CallContent,
  type CallState,
} from "@/app/security-assessment/call/callState";
import type { QuizConfig } from "@/lib/security-assessment/quizTypes";
import type { SdrContent } from "@/lib/security-assessment/sdrTypes";

const content: CallContent = {
  config: {
    categories: { mfa: { section: "s", label: "MFA", weakCopy: "" } },
    questions: [
      {
        id: "q1",
        category: "mfa",
        segments: ["solo"],
        text: "Q1?",
        answers: [{ text: "A", points: 1 }],
      },
    ],
  } as unknown as QuizConfig,
  sdr: { discovery: [] } as unknown as SdrContent,
};

const reduce = (state: CallState, action: CallAction) =>
  reduceCall(content, state, action);

// Later actions can arrive after a save starts, e.g. from the presenter (#715)
describe("reduceCall once a save has started", () => {
  const edits: CallAction[] = [
    { type: "answerPosture", questionId: "q1", answerIndex: 0 },
    { type: "notePosture", questionId: "q1", note: "x" },
    { type: "setCallSummary", callSummary: "x" },
    { type: "updateLead", field: "name", value: "x" },
    { type: "goBack" },
    { type: "goToSection", name: "details" },
    { type: "saveStarted" },
  ];

  it.each(["sending", "saved"] as const)(
    "ignores edits, moves and another save while %s",
    (status) => {
      const locked: CallState = {
        ...INITIAL_CALL,
        screen: { name: "summary" },
        save: { status },
      };

      for (const action of edits) {
        expect(reduce(locked, action)).toBe(locked);
      }
    },
  );

  it("still takes the save's outcome and a new call", () => {
    const sending: CallState = { ...INITIAL_CALL, save: { status: "sending" } };

    expect(reduce(sending, { type: "saveSucceeded" }).save.status).toBe(
      "saved",
    );
    expect(reduce(sending, { type: "saveFailed", message: "no" }).save).toEqual(
      { status: "error", message: "no" },
    );
    expect(reduce(sending, { type: "startNewCall" })).toBe(INITIAL_CALL);
  });
});

describe("reduceCall moves", () => {
  it("goes nowhere past either end of the call", () => {
    const first: CallState = INITIAL_CALL;
    const last: CallState = { ...INITIAL_CALL, screen: { name: "summary" } };

    expect(reduce(first, { type: "goBack" }).screen).toEqual(first.screen);
    expect(reduce(last, { type: "goNext" }).screen).toEqual(last.screen);
  });

  it("doesn't pass an unanswered posture question", () => {
    const unanswered: CallState = {
      ...INITIAL_CALL,
      screen: { name: "posture", index: 0 },
    };

    expect(reduce(unanswered, { type: "goNext" })).toBe(unanswered);
  });
});

describe("selectCallResult", () => {
  const scoredContent = {
    ...content.config,
    thresholds: { solo: { reactive: 1, managed: 2, resilient: 3 } },
  } as unknown as QuizConfig;
  const select = (config: QuizConfig, answers: Record<string, number>) =>
    selectCallResult({ config }, { segment: "solo", answers });

  it("scores once every question has an answer", () => {
    expect(select(scoredContent, { q1: 0 })).toMatchObject({
      score: 1,
      maxScore: 1,
    });
  });

  it.each([
    ["missing", {}],
    ["past the end of the list", { q1: 9 }],
    ["not a whole number", { q1: 0.5 }],
  ])("gives no result for an answer %s", (_label, answers) => {
    expect(select(scoredContent, answers)).toBeUndefined();
  });

  it("doesn't hide a scoring error behind 'not finished yet'", () => {
    const withoutThresholds = {
      ...scoredContent,
      thresholds: {},
    } as unknown as QuizConfig;

    expect(() => select(withoutThresholds, { q1: 0 })).toThrow(TypeError);
  });
});
