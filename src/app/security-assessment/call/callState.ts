import { isRecord } from "@/lib/isRecord";
import {
  QUIZ_SEGMENTS,
  type QuizConfig,
  type QuizQuestion,
  type QuizResult,
  type QuizSegment,
} from "@/lib/security-assessment/quizTypes";
import {
  hasAnswerToEveryQuestion,
  scoreQuizAnswers,
} from "@/lib/security-assessment/scoreQuizAnswers";
import {
  getDiscoveryQuestions,
  type SdrCallLeadRequest,
  type SdrContent,
  type SdrDiscoveryAnswer,
} from "@/lib/security-assessment/sdrTypes";
import { getQuestionsForSegment } from "@/lib/security-assessment/validateQuizConfig";
import type { LeadFieldName, LeadFields } from "../leadFields";

/**
 * The whole call as one serializable object: the console renders it, stores it
 * in sessionStorage, and (#715) projects it into the presenter's broadcast. It
 * never holds the token, which stays in an httpOnly cookie.
 */

/** Where the SDR is. `index` is into that section's questions. */
export type CallScreen =
  | { name: "details" | "size" | "results" | "summary" }
  | { name: "opening" | "posture" | "closing"; index: number };

export type CallScreenName = CallScreen["name"];

export type DiscoveryEntry = { choice?: string; note?: string };

/**
 * "interrupted": the page reloaded while a save was sending, so nobody knows
 * whether it reached Syncro. Retrying needs the SDR's explicit confirmation.
 */
export type CallSave =
  | { status: "idle" | "sending" | "saved" | "interrupted" }
  | { status: "error"; message: string };

export type CallState = {
  screen: CallScreen;
  lead: LeadFields;
  segment: QuizSegment;
  /** Posture question id to answer index */
  answers: Record<string, number>;
  /** Posture question id to note */
  notes: Record<string, string>;
  /** Discovery question id to entry; blank means not asked */
  discovery: Record<string, DiscoveryEntry>;
  callSummary: string;
  save: CallSave;
};

export type CallAction =
  | { type: "updateLead"; field: LeadFieldName; value: string }
  | { type: "selectSegment"; segment: QuizSegment }
  | { type: "answerPosture"; questionId: string; answerIndex: number }
  | { type: "answerFromPresenter"; questionId: string; answerIndex: number }
  | { type: "notePosture"; questionId: string; note: string }
  | { type: "chooseDiscovery"; questionId: string; choice: string }
  | { type: "clearDiscoveryChoice"; questionId: string }
  | { type: "noteDiscovery"; questionId: string; note: string }
  | { type: "setCallSummary"; callSummary: string }
  | { type: "goNext" }
  | { type: "goBack" }
  | { type: "goToSection"; name: CallScreenName }
  | { type: "saveStarted" }
  | { type: "saveSucceeded" }
  | { type: "saveFailed"; message: string }
  | { type: "restore"; call: CallState }
  | { type: "startNewCall" };

export type CallContent = { config: QuizConfig; sdr: SdrContent };

export const INITIAL_CALL: CallState = {
  screen: { name: "details" },
  lead: { name: "", email: "", company: "" },
  segment: QUIZ_SEGMENTS[0],
  answers: {},
  notes: {},
  discovery: {},
  callSummary: "",
  save: { status: "idle" },
};

/** Every screen of a call for this segment, in order. */
function listCallScreens(
  { config, sdr }: CallContent,
  segment: QuizSegment,
): CallScreen[] {
  const indexed = (
    name: "opening" | "posture" | "closing",
    count: number,
  ): CallScreen[] =>
    Array.from({ length: count }, (_, index) => ({ name, index }));

  return [
    { name: "details" },
    { name: "size" },
    ...indexed("opening", getDiscoveryQuestions(sdr, "opening").length),
    ...indexed("posture", getQuestionsForSegment(config, segment).length),
    { name: "results" },
    ...indexed("closing", getDiscoveryQuestions(sdr, "closing").length),
    { name: "summary" },
  ];
}

function isSameScreen(a: CallScreen, b: CallScreen): boolean {
  const indexOf = (screen: CallScreen) =>
    "index" in screen ? screen.index : undefined;
  return a.name === b.name && indexOf(a) === indexOf(b);
}

/** The posture question on screen, if any. */
export function selectPostureQuestion(
  { config }: Pick<CallContent, "config">,
  { screen, segment }: Pick<CallState, "screen" | "segment">,
): QuizQuestion | undefined {
  return screen.name === "posture"
    ? getQuestionsForSegment(config, segment)[screen.index]
    : undefined;
}

/** The score of the answers so far, or undefined until every question has one. */
export function selectCallResult(
  { config }: Pick<CallContent, "config">,
  { segment, answers }: Pick<CallState, "segment" | "answers">,
): QuizResult | undefined {
  return hasAnswerToEveryQuestion({ config, segment, answers })
    ? scoreQuizAnswers({ config, segment, answers })
    : undefined;
}

/** The save has started or finished, so the call can't change underneath it. */
export function isCallLocked({ save }: Pick<CallState, "save">): boolean {
  return save.status === "sending" || save.status === "saved";
}

function moveBy(content: CallContent, state: CallState, step: 1 | -1) {
  const screens = listCallScreens(content, state.segment);
  const current = screens.findIndex((screen) =>
    isSameScreen(screen, state.screen),
  );
  return screens[current + step] ?? state.screen;
}

function patchDiscovery(
  state: CallState,
  questionId: string,
  patch: DiscoveryEntry,
): CallState {
  const entry = { ...state.discovery[questionId], ...patch };
  return { ...state, discovery: { ...state.discovery, [questionId]: entry } };
}

function reduceEdit(state: CallState, action: CallAction): CallState {
  switch (action.type) {
    case "updateLead":
      return {
        ...state,
        lead: { ...state.lead, [action.field]: action.value },
      };
    case "selectSegment":
      return { ...state, segment: action.segment };
    case "answerPosture":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answerIndex },
      };
    case "notePosture":
      return {
        ...state,
        notes: { ...state.notes, [action.questionId]: action.note },
      };
    case "chooseDiscovery":
      return patchDiscovery(state, action.questionId, {
        choice: action.choice,
      });
    case "clearDiscoveryChoice":
      return patchDiscovery(state, action.questionId, { choice: undefined });
    case "noteDiscovery":
      return patchDiscovery(state, action.questionId, { note: action.note });
    case "setCallSummary":
      return { ...state, callSummary: action.callSummary };
    default:
      return state;
  }
}

export function reduceCall(
  content: CallContent,
  state: CallState,
  action: CallAction,
): CallState {
  switch (action.type) {
    case "startNewCall":
      return INITIAL_CALL;
    case "saveSucceeded":
      return { ...state, save: { status: "saved" } };
    case "saveFailed":
      return { ...state, save: { status: "error", message: action.message } };
    case "restore":
      return action.call;
    default:
  }

  if (isCallLocked(state)) return state;

  switch (action.type) {
    case "saveStarted":
      return { ...state, save: { status: "sending" } };
    case "answerFromPresenter": {
      // It crossed tabs, so the console may have moved on since the click.
      const question = selectPostureQuestion(content, state);
      const isCurrent =
        question?.id === action.questionId &&
        Number.isInteger(action.answerIndex) &&
        question.answers[action.answerIndex] !== undefined;
      return isCurrent
        ? reduceEdit(state, {
            type: "answerPosture",
            questionId: action.questionId,
            answerIndex: action.answerIndex,
          })
        : state;
    }
    case "goBack":
      return { ...state, screen: moveBy(content, state, -1) };
    case "goNext": {
      const question = selectPostureQuestion(content, state);
      if (question && state.answers[question.id] === undefined) return state;
      return { ...state, screen: moveBy(content, state, 1) };
    }
    case "goToSection": {
      const first = listCallScreens(content, state.segment).find(
        (screen) => screen.name === action.name,
      );
      return first ? { ...state, screen: first } : state;
    }
    default:
      return reduceEdit(state, action);
  }
}

function buildDiscoveryAnswer(entry?: DiscoveryEntry): SdrDiscoveryAnswer {
  const note = entry?.note?.trim();
  if (!entry?.choice && !note) return { isNotAsked: true };
  return {
    ...(entry?.choice ? { choice: entry.choice } : {}),
    ...(note ? { note } : {}),
  };
}

/** The save's request body. Authentication is the cookie, so no token. */
export function buildCallLeadRequest(
  { config, sdr }: CallContent,
  state: CallState,
): SdrCallLeadRequest {
  const postureIds = getQuestionsForSegment(config, state.segment).map(
    ({ id }) => id,
  );
  const notes = postureIds.flatMap((id) => {
    const note = state.notes[id]?.trim();
    return note ? [[id, note] as const] : [];
  });
  const callSummary = state.callSummary.trim();

  return {
    name: state.lead.name.trim(),
    email: state.lead.email.trim(),
    company: state.lead.company.trim(),
    segment: state.segment,
    answers: Object.fromEntries(
      postureIds.map((id) => [id, state.answers[id]]),
    ),
    notes: Object.fromEntries(notes),
    discovery: Object.fromEntries(
      sdr.discovery.map(({ id }) => [
        id,
        buildDiscoveryAnswer(state.discovery[id]),
      ]),
    ),
    ...(callSummary ? { callSummary } : {}),
  };
}

function isRecordOf<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is Record<string, T> {
  return isRecord(value) && Object.values(value).every(isItem);
}

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number";
const isDiscoveryEntry = (value: unknown): value is DiscoveryEntry =>
  isRecordOf(value, isString);

/**
 * A stored call to resume, or undefined if it isn't one: storage outlives a deploy,
 * so its contents may not match this page's questions. A screen that needs a
 * score falls back to the posture questions when the answers no longer give one.
 */
export function parseStoredCall(
  content: CallContent,
  stored: unknown,
): CallState | undefined {
  if (!isRecord(stored)) return undefined;
  const {
    lead,
    segment,
    answers,
    notes,
    discovery,
    callSummary,
    screen,
    save,
  } = stored;

  if (
    !isRecordOf(lead, isString) ||
    !["name", "email", "company"].every((field) => field in lead) ||
    !QUIZ_SEGMENTS.includes(segment as QuizSegment) ||
    !isRecordOf(answers, isNumber) ||
    !isRecordOf(notes, isString) ||
    !isRecordOf(discovery, isDiscoveryEntry) ||
    !isString(callSummary)
  ) {
    return undefined;
  }

  const screens = listCallScreens(content, segment as QuizSegment);
  const storedScreen = screens.find((candidate) =>
    isSameScreen(candidate, screen as CallScreen),
  );
  if (!storedScreen) return undefined;

  const call: CallState = {
    screen: storedScreen,
    lead: lead as LeadFields,
    segment: segment as QuizSegment,
    answers,
    notes,
    discovery,
    callSummary,
    save: {
      status:
        isRecord(save) && save.status === "interrupted"
          ? "interrupted"
          : "idle",
    },
  };

  const isPastPosture =
    screens.indexOf(storedScreen) >
    screens.findLastIndex(({ name }) => name === "posture");
  return isPastPosture && !selectCallResult(content, call)
    ? { ...call, screen: { name: "posture", index: 0 } }
    : call;
}
