import { useEffect, useRef } from "react";
import {
  getQuestionsForSegment,
  getSectionFraction,
  getSectionKeysForSegment,
} from "@/lib/security-assessment/validateQuizConfig";
import { buildQuizResultView, type QuizResultView } from "../quizResultView";
import {
  selectCallResult,
  selectPostureQuestion,
  type CallContent,
  type CallState,
} from "./callState";

/**
 * The console-to-presenter link. The presenter tab is on a shared screen and
 * shares this origin with anyone's dev tools, so everything it gets is built
 * field by field in projectPresenterScreen: never a CallState with parts removed.
 */

export const PRESENTER_CHANNEL_NAME = "sdr-call-presenter";

export type PresenterScreen =
  | { view: "neutral" }
  | {
      view: "posture";
      questionId: string;
      text: string;
      answers: string[];
      selectedIndex: number | null;
      categoryLabel: string;
      position: number;
      total: number;
      sections: string[];
      /** 1-based */
      currentSection: number;
      sectionFraction: number;
    }
  | { view: "results"; result: QuizResultView };

export type ConsoleMessage =
  | { kind: "screen"; consoleId: string; screen: PresenterScreen }
  | { kind: "gone"; consoleId: string };

/** Only requests: the console decides, and a locked one ignores them. */
export type PresenterRequest =
  | { kind: "sync" }
  | {
      kind: "answer";
      consoleId: string;
      questionId: string;
      answerIndex: number;
    };

type DeepKeys<T> = T extends (infer Item)[]
  ? DeepKeys<Item>
  : T extends object
    ? { [Key in keyof T]: Key | DeepKeys<T[Key]> }[keyof T]
    : never;

type PrivateCallField =
  | "token"
  | "sdr"
  | "sdrName"
  | "name"
  | "email"
  | "company"
  | "lead"
  | "note"
  | "notes"
  | "callSummary"
  | "talkTrack"
  | "talkTracks"
  | "whyItMatters"
  | "probe"
  | "nextStep"
  | "nextSteps"
  | "propose"
  | "service"
  | "discovery"
  | "choice"
  | "choices"
  | "cta"
  | "ctas"
  | "points"
  | "risk";

type MustBeEmpty<T extends never> = T;

/** Fails to compile if a broadcast type gains a private field's name. */
export type BroadcastPrivateFields = MustBeEmpty<
  Extract<DeepKeys<ConsoleMessage | PresenterRequest>, PrivateCallField>
>;

/** What the presenter may see of the call right now. */
export function projectPresenterScreen(
  content: CallContent,
  state: CallState,
): PresenterScreen {
  const { config } = content;
  const { screen, segment, save } = state;

  const question = selectPostureQuestion(content, state);
  if (question && screen.name === "posture") {
    const questions = getQuestionsForSegment(config, segment);
    const sectionKeys = getSectionKeysForSegment(config, segment);
    const section = config.categories[question.category].section;
    return {
      view: "posture",
      questionId: question.id,
      text: question.text,
      answers: question.answers.map((answer) => answer.text),
      selectedIndex: state.answers[question.id] ?? null,
      categoryLabel: config.categories[question.category].label,
      position: screen.index + 1,
      total: questions.length,
      sections: sectionKeys.map((key) => config.sections[key].label),
      currentSection: sectionKeys.indexOf(section) + 1,
      sectionFraction: getSectionFraction(config, segment, question),
    };
  }

  const isShowingResults =
    screen.name === "results" ||
    (screen.name === "summary" && save.status === "saved");
  const result = isShowingResults
    ? selectCallResult(content, state)
    : undefined;
  return result
    ? {
        view: "results",
        result: buildQuizResultView(config, segment, result),
      }
    : { view: "neutral" };
}

/** Undefined where there's no BroadcastChannel; the tabs just stay unlinked. */
export function openPresenterChannel<Incoming, Outgoing>(
  onMessage: (message: Incoming) => void,
): { post: (message: Outgoing) => void; close: () => void } | undefined {
  if (typeof BroadcastChannel === "undefined") return undefined;
  const channel = new window.BroadcastChannel(PRESENTER_CHANNEL_NAME);
  channel.onmessage = (event: { data: Incoming }) => onMessage(event.data);
  return {
    post: (message) => channel.postMessage(message),
    close: () => channel.close(),
  };
}

// Base 36 for a short id; the first two characters of the string are "0."
const CONSOLE_ID_RADIX = 36;
const RANDOM_FRACTION_PREFIX_LENGTH = 2;

function createConsoleId(): string {
  return Math.random()
    .toString(CONSOLE_ID_RADIX)
    .slice(RANDOM_FRACTION_PREFIX_LENGTH);
}

/**
 * Keeps any open presenter on `screen`. Null holds off (the console hasn't
 * restored its call yet), so a reload doesn't flash the first screen.
 *
 * A console tab has its own id per load, and a presenter follows only one, so
 * a second console tab can't overwrite its screen or receive its answers.
 */
export function useBroadcastToPresenter(
  screen: PresenterScreen | null,
  onAnswer: (questionId: string, answerIndex: number) => void,
) {
  const latestScreen = useRef(screen);
  const sendScreen = useRef<() => void>(() => {});
  const isReady = screen !== null;
  const screenKey = JSON.stringify(screen);

  useEffect(() => {
    latestScreen.current = JSON.parse(screenKey);
    sendScreen.current();
  }, [screenKey]);

  useEffect(() => {
    if (!isReady) return;
    const consoleId = createConsoleId();
    const channel = openPresenterChannel<PresenterRequest, ConsoleMessage>(
      (request) => {
        if (request.kind === "sync") sendScreen.current();
        if (request.kind === "answer" && request.consoleId === consoleId) {
          onAnswer(request.questionId, request.answerIndex);
        }
      },
    );
    if (!channel) return;

    sendScreen.current = () => {
      if (latestScreen.current) {
        channel.post({
          kind: "screen",
          consoleId,
          screen: latestScreen.current,
        });
      }
    };
    const announceGone = () => channel.post({ kind: "gone", consoleId });
    const announceBack = () => sendScreen.current();

    sendScreen.current();
    window.addEventListener("pagehide", announceGone);
    window.addEventListener("pageshow", announceBack);
    return () => {
      window.removeEventListener("pagehide", announceGone);
      window.removeEventListener("pageshow", announceBack);
      announceGone();
      sendScreen.current = () => {};
      channel.close();
    };
  }, [isReady, onAnswer]);
}
