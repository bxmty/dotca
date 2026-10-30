import type { QuizSegment, RiskTier } from "./quizTypes";

/**
 * SDR-only content for the discovery-call console (#710). None of it is
 * part of QuizConfig, so the public quiz page cannot receive it. Load it
 * with loadSdrContent() on the server, behind the SDR token.
 */

/** Sign-off state of the SDR copy, shown to the SDR in the console. */
export const SDR_COPY_STATUSES = ["draft", "approved"] as const;
export type SdrCopyStatus = (typeof SDR_COPY_STATUSES)[number];

/** What the SDR says around one posture question. */
export interface TalkTrack {
  whyItMatters: string;
  /** Follow-up question to dig past the picked answer */
  probe: string;
}

/** The console's results-screen proposal; replaces the public CTA. */
export interface NextStep {
  propose: string;
  /** The service to pitch */
  service: string;
}

export const DISCOVERY_GROUPS = ["opening", "closing"] as const;
/** opening = context before the posture questions; closing = buying, after results */
export type DiscoveryGroup = (typeof DISCOVERY_GROUPS)[number];

export const DISCOVERY_KINDS = ["choice", "text"] as const;
export type DiscoveryKind = (typeof DISCOVERY_KINDS)[number];

interface DiscoveryQuestionBase {
  id: string;
  group: DiscoveryGroup;
  /** Asked aloud, conversationally */
  text: string;
}

/** Structured choices, plus a free-text note the console always offers. */
export interface DiscoveryChoiceQuestion extends DiscoveryQuestionBase {
  kind: "choice";
  choices: string[];
}

/** Free text only (e.g. "why now"). */
export interface DiscoveryTextQuestion extends DiscoveryQuestionBase {
  kind: "text";
}

/** Unscored; never passed to scoreQuizAnswers. */
export type DiscoveryQuestion = DiscoveryChoiceQuestion | DiscoveryTextQuestion;

export interface SdrContent {
  status: SdrCopyStatus;
  /** Keyed by posture question id */
  talkTracks: Record<string, TalkTrack>;
  nextSteps: Record<QuizSegment, Record<RiskTier, NextStep>>;
  /** In call order within each group */
  discovery: DiscoveryQuestion[];
}

/** Longest note on one posture or discovery question, in characters. */
export const SDR_NOTE_MAX_LENGTH = 2000;
/** Longest call summary, in characters. */
export const SDR_CALL_SUMMARY_MAX_LENGTH = 5000;

/**
 * One discovery question's outcome. A question that is left out, marked
 * `isNotAsked`, or sent with no choice and a blank note is recorded as "Not
 * asked". `choice` must be one of the question's `choices` (so never on a
 * `"text"` question).
 */
export type SdrDiscoveryAnswer =
  { isNotAsked: true } | { choice?: string; note?: string };

/**
 * The body of POST /api/security-assessment/call. Authentication is the
 * session cookie alone (SDR_SESSION_COOKIE), so no token goes here, and the
 * SDR's name comes from that token.
 */
export interface SdrCallLeadRequest {
  name: string;
  email: string;
  company: string;
  segment: QuizSegment;
  /** Posture question id to answer index; must be complete for the segment */
  answers: Record<string, number>;
  /** Posture question id to note; ids must belong to the segment */
  notes?: Record<string, string>;
  /** Discovery question id to outcome */
  discovery?: Record<string, SdrDiscoveryAnswer>;
  callSummary?: string;
}

/** 200 gives `success`; 400, 401, 503 and 500 give `error`. */
export type SdrCallLeadResponse = { success: true } | { error: string };
