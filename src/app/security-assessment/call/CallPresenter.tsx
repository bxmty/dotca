"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import StackedAnswerList from "@/app/components/StackedAnswerList";
import StepProgress from "@/app/components/StepProgress";
import DotGridPanel from "../DotGridPanel";
import QuizResultSummary from "../QuizResultSummary";
import {
  openPresenterChannel,
  type ConsoleMessage,
  type PresenterRequest,
  type PresenterScreen,
} from "./presenterBroadcast";

const HEADING_ID = "call-presenter-heading";
const HEADING_CLASS_NAME = "m-0 text-h2 font-semibold outline-none";
const QUESTION_HEADING_CLASS_NAME =
  "m-0 text-h3 leading-snug font-semibold outline-none md:text-h2 md:leading-tight";

// Asking rather than listening for a console's heartbeat: a hidden tab's timers
// get throttled to as little as once a minute, but it still answers a message.
const PROBE_INTERVAL_MS = 2000;
const MISSED_PROBES_BEFORE_WAITING = 3;

type ConsoleLink = { consoleId: string; screen: PresenterScreen };

/** The followed console's latest screen; null while there isn't one. */
function useConsoleLink() {
  const [link, setLink] = useState<ConsoleLink | null>(null);
  const postRef = useRef<(request: PresenterRequest) => void>(() => {});

  useEffect(() => {
    let followedId: string | null = null;
    let missedProbes = 0;

    const stopFollowing = () => {
      followedId = null;
      setLink(null);
    };

    const channel = openPresenterChannel<ConsoleMessage, PresenterRequest>(
      (message) => {
        if (followedId !== null && message.consoleId !== followedId) return;
        if (message.kind === "gone") {
          stopFollowing();
          return;
        }
        followedId = message.consoleId;
        missedProbes = 0;
        setLink({ consoleId: message.consoleId, screen: message.screen });
      },
    );
    if (!channel) return;

    postRef.current = channel.post;
    channel.post({ kind: "sync" });
    const probe = window.setInterval(() => {
      missedProbes += 1;
      if (missedProbes >= MISSED_PROBES_BEFORE_WAITING) stopFollowing();
      channel.post({ kind: "sync" });
    }, PROBE_INTERVAL_MS);

    return () => {
      window.clearInterval(probe);
      postRef.current = () => {};
      channel.close();
    };
  }, []);

  return {
    link,
    post: (request: PresenterRequest) => postRef.current(request),
  };
}

function Heading({
  headingRef,
  children,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  children: string;
}) {
  return (
    <h1
      id={HEADING_ID}
      ref={headingRef}
      tabIndex={-1}
      className={HEADING_CLASS_NAME}
    >
      {children}
    </h1>
  );
}

function PostureScreen({
  screen,
  headingRef,
  onAnswer,
}: {
  screen: Extract<PresenterScreen, { view: "posture" }>;
  headingRef: Ref<HTMLHeadingElement>;
  onAnswer: (answerIndex: number) => void;
}) {
  return (
    <>
      <StepProgress
        steps={screen.sections}
        currentStep={screen.currentSection}
        currentStepFraction={screen.sectionFraction}
      />
      {/* Keyed per question, so each one rises in */}
      <div
        key={screen.questionId}
        className="grid gap-6 motion-safe:animate-rise"
      >
        <div className="grid gap-4">
          <DotGridPanel className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 px-4 pt-3.5 pb-3 font-mono text-label tracking-[.06em] text-muted uppercase">
            <span>{screen.categoryLabel}</span>
            <span className="text-ink tabular-nums">
              {`Question ${screen.position} of ${screen.total}`}
            </span>
          </DotGridPanel>
          <h1
            id={HEADING_ID}
            ref={headingRef}
            tabIndex={-1}
            className={QUESTION_HEADING_CLASS_NAME}
          >
            {screen.text}
          </h1>
        </div>
        <StackedAnswerList
          labelledBy={HEADING_ID}
          name={screen.questionId}
          options={screen.answers.map((label, index) => ({
            value: String(index),
            label,
          }))}
          value={
            screen.selectedIndex === null ? "" : String(screen.selectedIndex)
          }
          onChange={(value) => onAnswer(Number(value))}
        />
      </div>
    </>
  );
}

/**
 * What the prospect sees on a screen share: the console's broadcast and nothing
 * else. A click here is only a request; the choice shows once the console sends
 * it back, and pacing stays with the console.
 */
export default function CallPresenter() {
  const { link, post } = useConsoleLink();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasRenderedScreen = useRef(false);
  const screen = link?.screen;
  const screenKey =
    screen?.view === "posture"
      ? screen.questionId
      : (screen?.view ?? "waiting");

  // Each new screen starts at its heading, so screen readers announce it.
  useEffect(() => {
    if (!hasRenderedScreen.current) {
      hasRenderedScreen.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo?.({ top: 0 });
  }, [screenKey]);

  const renderScreen = () => {
    switch (screen?.view) {
      case undefined:
        return (
          <>
            <Heading headingRef={headingRef}>Waiting for the console</Heading>
            <p className="m-0 text-body text-muted">
              This screen follows the call once the console is open.
            </p>
          </>
        );
      case "neutral":
        return (
          <Heading headingRef={headingRef}>
            Getting to know your business
          </Heading>
        );
      case "posture":
        return (
          <PostureScreen
            screen={screen}
            headingRef={headingRef}
            onAnswer={(answerIndex) => {
              if (link) {
                post({
                  kind: "answer",
                  consoleId: link.consoleId,
                  questionId: screen.questionId,
                  answerIndex,
                });
              }
            }}
          />
        );
      case "results":
        return (
          <QuizResultSummary
            view={screen.result}
            headingId={HEADING_ID}
            headingRef={headingRef}
            headingClassName={HEADING_CLASS_NAME}
          />
        );
    }
  };

  return (
    <section className="mx-auto grid w-full max-w-[720px] content-start gap-6 px-4 py-12 md:py-16">
      {renderScreen()}
    </section>
  );
}
