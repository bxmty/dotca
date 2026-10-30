"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/app/components/Button";
import StepProgress from "@/app/components/StepProgress";
import { SDR_PRESENTER_PATH } from "@/lib/sdr-console-route";
import { useFocusHeadingOnNewScreen } from "./callHeading";
import { isCallLocked, type CallContent } from "./callState";
import { CurrentScreen, SECTIONS } from "./consoleScreens";
import {
  projectPresenterScreen,
  useBroadcastToPresenter,
} from "./presenterBroadcast";
import { useCallSession } from "./useCallSession";

// noopener is what keeps the call private: without it, a new window starts with
// a copy of this tab's sessionStorage (the whole call) and can reach this page
// through window.opener. It also makes window.open return null, on success too.
const PRESENTER_WINDOW_FEATURES = "noopener,popup,width=1280,height=900";

function ConsoleHeader({
  sdrName,
  isDraftCopy,
}: {
  sdrName: string;
  isDraftCopy: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 font-mono text-label text-muted">
      <span>Discovery call. Signed in as {sdrName}.</span>
      <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        {isDraftCopy && <span>Draft copy</span>}
        <Button
          type="button"
          variant="secondary"
          isCompact
          onClick={() =>
            window.open(SDR_PRESENTER_PATH, "_blank", PRESENTER_WINDOW_FEATURES)
          }
        >
          Open presenter
        </Button>
      </span>
    </div>
  );
}

/**
 * The private console an SDR runs a discovery call from: one reducer holds the
 * call, every screen reads from it, and it survives a reload in sessionStorage.
 */
export default function CallConsole({
  config,
  sdr,
  sdrName,
}: CallContent & { sdrName: string }) {
  const content = useMemo(() => ({ config, sdr }), [config, sdr]);
  const { state, dispatch, isRestored, handleSave } = useCallSession(content);
  const headingRef = useFocusHeadingOnNewScreen(JSON.stringify(state.screen));

  const answerFromPresenter = useCallback(
    (questionId: string, answerIndex: number) =>
      dispatch({ type: "answerFromPresenter", questionId, answerIndex }),
    [dispatch],
  );
  useBroadcastToPresenter(
    isRestored ? projectPresenterScreen(content, state) : null,
    answerFromPresenter,
  );

  const currentStep =
    SECTIONS.findIndex(({ name }) => name === state.screen.name) + 1;

  return (
    <section className="mx-auto grid w-full max-w-[1040px] content-start gap-6 px-4 py-12">
      <ConsoleHeader sdrName={sdrName} isDraftCopy={sdr.status === "draft"} />
      <StepProgress
        steps={SECTIONS.map(({ title }) => title)}
        currentStep={currentStep}
        onStepSelect={
          isCallLocked(state)
            ? undefined
            : (step) =>
                dispatch({ type: "goToSection", name: SECTIONS[step - 1].name })
        }
      />
      <CurrentScreen
        state={state}
        dispatch={dispatch}
        content={content}
        headingRef={headingRef}
        onSave={() => void handleSave()}
        onStartNewCall={() => dispatch({ type: "startNewCall" })}
      />
    </section>
  );
}
