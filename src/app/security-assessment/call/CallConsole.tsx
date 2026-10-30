"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Button } from "@/app/components/Button";
import { Field, INPUT_CLASS_NAME, TextField } from "@/app/components/Field";
import StackedAnswerList from "@/app/components/StackedAnswerList";
import StatusNote from "@/app/components/StatusNote";
import StepProgress from "@/app/components/StepProgress";
import { omitFieldErrors } from "@/lib/formValidation";
import {
  QUIZ_SEGMENTS,
  type QuizQuestion,
} from "@/lib/security-assessment/quizTypes";
import {
  SDR_CALL_SUMMARY_MAX_LENGTH,
  SDR_NOTE_MAX_LENGTH,
  type DiscoveryQuestion,
  type SdrCallLeadResponse,
} from "@/lib/security-assessment/sdrTypes";
import { getQuestionsForSegment } from "@/lib/security-assessment/validateQuizConfig";
import DotGridPanel from "../DotGridPanel";
import {
  LEAD_FIELD_NAMES,
  validateLeadFields,
  type LeadFieldErrors,
  type LeadFieldName,
} from "../leadFields";
import QuizResultSummary from "../QuizResultSummary";
import { buildQuizResultView } from "../quizResultView";
import {
  buildCallLeadRequest,
  getDiscoveryQuestions,
  INITIAL_CALL,
  isCallLocked,
  parseStoredCall,
  reduceCall,
  selectCallResult,
  selectPostureQuestion,
  type CallAction,
  type CallContent,
  type CallScreenName,
  type CallState,
} from "./callState";
import { clearStoredCall, readStoredCall, storeCall } from "./callStorage";
import { useSdrCallSession } from "./SdrCallSession";

const HEADING_ID = "call-console-heading";
const HEADING_CLASS_NAME =
  "m-0 text-h3 leading-snug font-semibold outline-none";
const SAVE_ERROR_MESSAGE = "The call didn't save. Please try again.";
const SESSION_ENDED_MESSAGE =
  "Your session has ended, so the call didn't save. Open your SDR link again in this tab: everything you've entered will come back.";

const SECTIONS: readonly { name: CallScreenName; title: string }[] = [
  { name: "details", title: "Contact" },
  { name: "size", title: "Size" },
  { name: "opening", title: "Opening" },
  { name: "posture", title: "Posture" },
  { name: "results", title: "Results" },
  { name: "closing", title: "Closing" },
  { name: "summary", title: "Summary" },
];

const getLeadFieldId = (field: LeadFieldName) => `call-lead-${field}`;

type ScreenProps = {
  state: CallState;
  dispatch: Dispatch<CallAction>;
  content: CallContent;
  headingRef: Ref<HTMLHeadingElement>;
};

function Heading({
  headingRef,
  children,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  children: ReactNode;
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

function BackButton({ dispatch }: { dispatch: Dispatch<CallAction> }) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => dispatch({ type: "goBack" })}
    >
      Back
    </Button>
  );
}

function NoteField({
  id,
  label = "Note",
  value,
  maxLength = SDR_NOTE_MAX_LENGTH,
  isReadOnly = false,
  rows = 4,
  onChange,
}: {
  id: string;
  label?: string;
  value: string;
  maxLength?: number;
  isReadOnly?: boolean;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label} isOptional>
      <textarea
        id={id}
        className={INPUT_CLASS_NAME}
        rows={rows}
        maxLength={maxLength}
        readOnly={isReadOnly}
        value={value}
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
      />
    </Field>
  );
}

function DetailsScreen({ state, dispatch, headingRef }: ScreenProps) {
  const [errors, setErrors] = useState<LeadFieldErrors>({});

  const submit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const nextErrors = validateLeadFields(state.lead);
    setErrors(nextErrors);
    const firstInvalidField = LEAD_FIELD_NAMES.find(
      (field) => nextErrors[field],
    );
    if (firstInvalidField) {
      document.getElementById(getLeadFieldId(firstInvalidField))?.focus();
      return;
    }
    dispatch({ type: "goNext" });
  };

  const renderField = (
    field: LeadFieldName,
    label: string,
    type: string,
    autoComplete: string,
  ) => (
    <TextField
      id={getLeadFieldId(field)}
      label={label}
      type={type}
      name={field}
      autoComplete={autoComplete}
      value={state.lead[field]}
      onChange={(changeEvent) => {
        dispatch({
          type: "updateLead",
          field,
          value: changeEvent.target.value,
        });
        setErrors((current) => omitFieldErrors(current, [field]));
      }}
      required
      error={errors[field]}
    />
  );

  return (
    <>
      <Heading headingRef={headingRef}>Who are you speaking with?</Heading>
      <form
        className="grid max-w-[720px] content-start gap-4.5"
        onSubmit={submit}
        noValidate
        aria-label="Prospect details"
      >
        {renderField("name", "Name", "text", "off")}
        {renderField("email", "Email", "email", "off")}
        {renderField("company", "Company", "text", "off")}
        <div className="mt-4">
          <Button type="submit" variant="primary">
            Continue
          </Button>
        </div>
      </form>
    </>
  );
}

function SizeScreen({ state, dispatch, content, headingRef }: ScreenProps) {
  const { config } = content;
  return (
    <>
      <Heading headingRef={headingRef}>{config.sizeQuestion}</Heading>
      <div className="max-w-[720px]">
        <StackedAnswerList
          labelledBy={HEADING_ID}
          name="businessSize"
          options={QUIZ_SEGMENTS.map((segment) => ({
            value: segment,
            label: config.segments[segment].label,
            detail: config.segments[segment].description,
          }))}
          value={state.segment}
          onChange={(segment) => dispatch({ type: "selectSegment", segment })}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        <BackButton dispatch={dispatch} />
        <Button
          type="button"
          variant="primary"
          onClick={() => dispatch({ type: "goNext" })}
        >
          Continue
        </Button>
      </div>
    </>
  );
}

function DiscoveryScreen({
  state,
  dispatch,
  headingRef,
  question,
  label,
}: ScreenProps & { question: DiscoveryQuestion; label: string }) {
  const entry = state.discovery[question.id] ?? {};
  const isBlank = !entry.choice && !entry.note?.trim();

  return (
    <div key={question.id} className="grid gap-6 motion-safe:animate-rise">
      <DotGridPanel className="px-4 pt-3.5 pb-3 font-mono text-label tracking-[.06em] text-muted uppercase">
        {label}
      </DotGridPanel>
      <Heading headingRef={headingRef}>{question.text}</Heading>
      <div className="grid max-w-[720px] gap-4">
        {question.kind === "choice" && (
          <div className="grid justify-items-start gap-3">
            <div className="w-full">
              <StackedAnswerList
                labelledBy={HEADING_ID}
                name={question.id}
                options={question.choices.map((choice) => ({
                  value: choice,
                  label: choice,
                }))}
                value={entry.choice ?? ""}
                onChange={(choice) =>
                  dispatch({
                    type: "chooseDiscovery",
                    questionId: question.id,
                    choice,
                  })
                }
              />
            </div>
            {entry.choice && (
              <Button
                type="button"
                variant="secondary"
                isCompact
                onClick={() =>
                  dispatch({
                    type: "clearDiscoveryChoice",
                    questionId: question.id,
                  })
                }
              >
                Clear choice
              </Button>
            )}
          </div>
        )}
        <NoteField
          id={`call-note-${question.id}`}
          value={entry.note ?? ""}
          onChange={(note) =>
            dispatch({ type: "noteDiscovery", questionId: question.id, note })
          }
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <BackButton dispatch={dispatch} />
        <Button
          type="button"
          variant={isBlank ? "secondary" : "primary"}
          onClick={() => dispatch({ type: "goNext" })}
        >
          {isBlank ? "Skip" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function PostureScreen({
  state,
  dispatch,
  content,
  headingRef,
  question,
  position,
  total,
}: ScreenProps & {
  question: QuizQuestion;
  position: number;
  total: number;
}) {
  const { config, sdr } = content;
  const selectedIndex = state.answers[question.id];
  const isAnswered = selectedIndex !== undefined;
  const talkTrack = sdr.talkTracks[question.id];

  return (
    <div key={question.id} className="grid gap-6 motion-safe:animate-rise">
      <DotGridPanel className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 px-4 pt-3.5 pb-3 font-mono text-label tracking-[.06em] text-muted uppercase">
        <span>{config.categories[question.category].label}</span>
        <span className="text-ink tabular-nums">
          {`Question ${position} of ${total}`}
        </span>
      </DotGridPanel>
      <Heading headingRef={headingRef}>{question.text}</Heading>
      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <StackedAnswerList
          labelledBy={HEADING_ID}
          name={question.id}
          options={question.answers.map((answer, index) => ({
            value: String(index),
            label: answer.text,
          }))}
          value={isAnswered ? String(selectedIndex) : ""}
          onChange={(value) =>
            dispatch({
              type: "answerPosture",
              questionId: question.id,
              answerIndex: Number(value),
            })
          }
        />
        <div className="grid content-start gap-4">
          {talkTrack && (
            <div className="grid gap-3 border-l-3 border-rule pl-4 text-small">
              <div className="grid gap-1">
                <h2 className="m-0 font-mono text-label font-medium text-muted">
                  Why it matters
                </h2>
                <p className="m-0">{talkTrack.whyItMatters}</p>
              </div>
              <div className="grid gap-1">
                <h2 className="m-0 font-mono text-label font-medium text-muted">
                  Probe
                </h2>
                <p className="m-0">{talkTrack.probe}</p>
              </div>
            </div>
          )}
          <NoteField
            id={`call-note-${question.id}`}
            value={state.notes[question.id] ?? ""}
            rows={6}
            onChange={(note) =>
              dispatch({ type: "notePosture", questionId: question.id, note })
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <BackButton dispatch={dispatch} />
        <Button
          type="button"
          variant="primary"
          disabled={!isAnswered}
          onClick={() => dispatch({ type: "goNext" })}
        >
          Next
        </Button>
        {!isAnswered && (
          <p className="m-0 text-small text-muted">
            Pick an answer to continue.
          </p>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ state, dispatch, content, headingRef }: ScreenProps) {
  const { config, sdr } = content;
  const result = selectCallResult(content, state);
  if (!result) return null;
  const nextStep = sdr.nextSteps[state.segment][result.tier];

  return (
    <div className="grid max-w-[720px] gap-6">
      <QuizResultSummary
        view={buildQuizResultView(config, state.segment, result)}
        headingId={HEADING_ID}
        headingRef={headingRef}
        headingClassName={HEADING_CLASS_NAME}
      />
      <div className="grid gap-3 border-t border-rule pt-8">
        <h2 className="m-0 text-h3 font-semibold">Next step</h2>
        <p className="m-0 text-body">{nextStep.propose}</p>
        <p className="m-0 font-mono text-label text-muted">
          Service: {nextStep.service}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <BackButton dispatch={dispatch} />
        <Button
          type="button"
          variant="primary"
          onClick={() => dispatch({ type: "goNext" })}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function SummaryScreen({
  state,
  dispatch,
  headingRef,
  onSave,
  onStartNewCall,
}: ScreenProps & { onSave: () => void; onStartNewCall: () => void }) {
  const { save } = state;
  const isSaved = save.status === "saved";

  return (
    <div className="grid max-w-[720px] gap-6">
      <Heading headingRef={headingRef}>Call summary</Heading>
      <NoteField
        id="call-summary"
        label="Summary"
        rows={8}
        maxLength={SDR_CALL_SUMMARY_MAX_LENGTH}
        isReadOnly={isCallLocked(state)}
        value={state.callSummary}
        onChange={(callSummary) =>
          dispatch({ type: "setCallSummary", callSummary })
        }
      />
      <div className="grid gap-4" aria-live="polite">
        {save.status === "sending" && (
          <p className="m-0 text-body text-muted">Saving to Syncro…</p>
        )}
        {save.status === "error" && (
          <StatusNote tone="error" label="Error">
            {save.message}
          </StatusNote>
        )}
        {isSaved && (
          <StatusNote tone="ok" label="Saved">
            <p className="m-0">
              The call is in Syncro. Any later changes go there by hand.
            </p>
          </StatusNote>
        )}
      </div>
      {isSaved ? (
        <div>
          <Button type="button" variant="primary" onClick={onStartNewCall}>
            Start a new call
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <BackButton dispatch={dispatch} />
          <Button
            type="button"
            variant="primary"
            disabled={save.status === "sending"}
            onClick={onSave}
          >
            {save.status === "error" ? "Try again" : "Save to Syncro"}
          </Button>
        </div>
      )}
    </div>
  );
}

function CurrentScreen(
  props: ScreenProps & { onSave: () => void; onStartNewCall: () => void },
) {
  const { state, content } = props;
  const { screen } = state;

  switch (screen.name) {
    case "details":
      return <DetailsScreen {...props} />;
    case "size":
      return <SizeScreen {...props} />;
    case "opening":
    case "closing": {
      const questions = getDiscoveryQuestions(content.sdr, screen.name);
      const group = screen.name === "opening" ? "Opening" : "Closing";
      return (
        <DiscoveryScreen
          {...props}
          question={questions[screen.index]}
          label={`${group} discovery ${screen.index + 1} of ${questions.length}`}
        />
      );
    }
    case "posture": {
      const question = selectPostureQuestion(content, state);
      return question ? (
        <PostureScreen
          {...props}
          question={question}
          position={screen.index + 1}
          total={getQuestionsForSegment(content.config, state.segment).length}
        />
      ) : null;
    }
    case "results":
      return <ResultsScreen {...props} />;
    case "summary":
      return <SummaryScreen {...props} />;
  }
}

async function postCall(body: unknown): Promise<string | null> {
  try {
    const response = await fetch("/api/security-assessment/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.status === 401) return SESSION_ENDED_MESSAGE;
    const data: SdrCallLeadResponse = await response
      .json()
      .catch(() => ({ error: SAVE_ERROR_MESSAGE }));
    if (response.ok && "success" in data) return null;
    return "error" in data ? data.error : SAVE_ERROR_MESSAGE;
  } catch {
    return SAVE_ERROR_MESSAGE;
  }
}

/**
 * The private console an SDR runs a discovery call from: one reducer holds the
 * call, every screen reads from it, and it survives a reload in sessionStorage.
 */
export default function CallConsole(content: CallContent) {
  const { sdrName } = useSdrCallSession();
  const [state, dispatch] = useReducer(
    (current: CallState, action: CallAction) =>
      reduceCall(content, current, action),
    INITIAL_CALL,
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasRestored = useRef(false);
  const hasRenderedScreen = useRef(false);
  const screenKey = JSON.stringify(state.screen);

  // After mount, so the server's and the first client render agree
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    const call = parseStoredCall(content, readStoredCall());
    if (call) dispatch({ type: "restore", call });
  }, [content]);

  useEffect(() => {
    if (state === INITIAL_CALL || state.save.status === "saved") {
      clearStoredCall();
    } else {
      storeCall(state);
    }
  }, [state]);

  // Each new screen starts at its heading, so screen readers announce it. The
  // first load is left alone rather than stealing focus from the page.
  useEffect(() => {
    if (!hasRenderedScreen.current) {
      hasRenderedScreen.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo?.({ top: 0 });
  }, [screenKey]);

  const save = async () => {
    if (isCallLocked(state)) return;
    dispatch({ type: "saveStarted" });
    const failure = await postCall(buildCallLeadRequest(content, state));
    dispatch(
      failure === null
        ? { type: "saveSucceeded" }
        : { type: "saveFailed", message: failure },
    );
  };

  const currentStep =
    SECTIONS.findIndex(({ name }) => name === state.screen.name) + 1;

  return (
    <section className="mx-auto grid w-full max-w-[1040px] content-start gap-6 px-4 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 font-mono text-label text-muted">
        <span>Discovery call. Signed in as {sdrName}.</span>
        {content.sdr.status === "draft" && <span>Draft copy</span>}
      </div>
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
        onSave={() => void save()}
        onStartNewCall={() => dispatch({ type: "startNewCall" })}
      />
    </section>
  );
}
