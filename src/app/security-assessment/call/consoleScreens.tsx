import {
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
import { omitFieldErrors } from "@/lib/formValidation";
import {
  QUIZ_SEGMENTS,
  type QuizQuestion,
} from "@/lib/security-assessment/quizTypes";
import {
  SDR_CALL_SUMMARY_MAX_LENGTH,
  SDR_NOTE_MAX_LENGTH,
  getDiscoveryQuestions,
  type DiscoveryChoiceQuestion,
  type DiscoveryQuestion,
  type TalkTrack,
} from "@/lib/security-assessment/sdrTypes";
import { getQuestionsForSegment } from "@/lib/security-assessment/validateQuizConfig";
import DotGridPanel from "../DotGridPanel";
import {
  LEAD_FIELD_NAMES,
  PROSPECT_BLANK_FIELD_MESSAGES,
  validateLeadFields,
  type LeadFieldErrors,
  type LeadFieldName,
} from "../leadFields";
import { QuestionProgressPanel } from "../QuestionHeader";
import QuizResultSummary from "../QuizResultSummary";
import { buildQuizResultView } from "../quizResultView";
import { CALL_HEADING_ID, CallHeading } from "./callHeading";
import {
  isCallLocked,
  selectCallResult,
  selectPostureQuestion,
  type CallAction,
  type CallContent,
  type CallSave,
  type CallScreenName,
  type CallState,
} from "./callState";

const HEADING_CLASS_NAME =
  "m-0 text-h3 leading-snug font-semibold outline-none";
const INTERRUPTED_SAVE_MESSAGE =
  "The page reloaded during the save, so this call may already have reached Syncro. Check Syncro first: saving again could create a duplicate lead.";

const SAVE_LABEL_BY_STATUS: Record<CallSave["status"], string> = {
  idle: "Save to Syncro",
  sending: "Save to Syncro",
  saved: "Save to Syncro",
  error: "Try again",
  interrupted: "Save again anyway",
};

export const SECTIONS: readonly { name: CallScreenName; title: string }[] = [
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
}: Pick<ScreenProps, "headingRef"> & { children: ReactNode }) {
  return (
    <CallHeading headingRef={headingRef} className={HEADING_CLASS_NAME}>
      {children}
    </CallHeading>
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

function ProspectField({
  field,
  label,
  type = "text",
  value,
  error,
  onChange,
}: {
  field: LeadFieldName;
  label: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (field: LeadFieldName, value: string) => void;
}) {
  return (
    <TextField
      id={getLeadFieldId(field)}
      label={label}
      type={type}
      name={field}
      autoComplete="off"
      value={value}
      onChange={(changeEvent) => onChange(field, changeEvent.target.value)}
      required
      error={error}
    />
  );
}

function DetailsScreen({ state, dispatch, headingRef }: ScreenProps) {
  const [errors, setErrors] = useState<LeadFieldErrors>({});

  const handleDetailsSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const nextErrors = validateLeadFields(
      state.lead,
      PROSPECT_BLANK_FIELD_MESSAGES,
    );
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

  const handleFieldChange = (field: LeadFieldName, value: string) => {
    dispatch({ type: "updateLead", field, value });
    setErrors((current) => omitFieldErrors(current, [field]));
  };
  const fieldProps = (field: LeadFieldName) => ({
    field,
    value: state.lead[field],
    error: errors[field],
    onChange: handleFieldChange,
  });

  return (
    <>
      <Heading headingRef={headingRef}>Who are you speaking with?</Heading>
      <form
        className="grid max-w-[720px] content-start gap-4.5"
        onSubmit={handleDetailsSubmit}
        noValidate
        aria-label="Prospect details"
      >
        <ProspectField label="Name" {...fieldProps("name")} />
        <ProspectField label="Email" type="email" {...fieldProps("email")} />
        <ProspectField label="Company" {...fieldProps("company")} />
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
          labelledBy={CALL_HEADING_ID}
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

function DiscoveryChoices({
  question,
  selectedChoice,
  dispatch,
}: {
  question: DiscoveryChoiceQuestion;
  selectedChoice?: string;
  dispatch: Dispatch<CallAction>;
}) {
  return (
    <div className="grid justify-items-start gap-3">
      <div className="w-full">
        <StackedAnswerList
          labelledBy={CALL_HEADING_ID}
          name={question.id}
          options={question.choices.map((choice) => ({
            value: choice,
            label: choice,
          }))}
          value={selectedChoice ?? ""}
          onChange={(choice) =>
            dispatch({
              type: "chooseDiscovery",
              questionId: question.id,
              choice,
            })
          }
        />
      </div>
      {selectedChoice && (
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
          <DiscoveryChoices
            question={question}
            selectedChoice={entry.choice}
            dispatch={dispatch}
          />
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

function TalkTrackPanel({ talkTrack }: { talkTrack: TalkTrack }) {
  return (
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
  );
}

function PostureActions({
  isAnswered,
  dispatch,
}: {
  isAnswered: boolean;
  dispatch: Dispatch<CallAction>;
}) {
  return (
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
        <p className="m-0 text-small text-muted">Pick an answer to continue.</p>
      )}
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
      <QuestionProgressPanel
        categoryLabel={config.categories[question.category].label}
        position={position}
        total={total}
      />
      <Heading headingRef={headingRef}>{question.text}</Heading>
      <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <StackedAnswerList
          labelledBy={CALL_HEADING_ID}
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
          {talkTrack && <TalkTrackPanel talkTrack={talkTrack} />}
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
      <PostureActions isAnswered={isAnswered} dispatch={dispatch} />
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
        headingId={CALL_HEADING_ID}
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

function SaveStatusNotes({ save }: { save: CallSave }) {
  return (
    <div className="grid gap-4" aria-live="polite">
      {save.status === "sending" && (
        <p className="m-0 text-body text-muted">Saving to Syncro…</p>
      )}
      {save.status === "error" && (
        <StatusNote tone="error" label="Error">
          {save.message}
        </StatusNote>
      )}
      {save.status === "interrupted" && (
        <StatusNote tone="error" label="Check Syncro">
          {INTERRUPTED_SAVE_MESSAGE}
        </StatusNote>
      )}
      {save.status === "saved" && (
        <StatusNote tone="ok" label="Saved">
          <p className="m-0">
            The call is in Syncro. Any later changes go there by hand.
          </p>
        </StatusNote>
      )}
    </div>
  );
}

function SaveActions({
  save,
  dispatch,
  onSave,
  onStartNewCall,
}: {
  save: CallSave;
  dispatch: Dispatch<CallAction>;
  onSave: () => void;
  onStartNewCall: () => void;
}) {
  if (save.status === "saved") {
    return (
      <div>
        <Button type="button" variant="primary" onClick={onStartNewCall}>
          Start a new call
        </Button>
      </div>
    );
  }
  const isInterrupted = save.status === "interrupted";
  return (
    <div className="flex flex-wrap gap-3">
      <BackButton dispatch={dispatch} />
      <Button
        type="button"
        variant={isInterrupted ? "secondary" : "primary"}
        disabled={save.status === "sending"}
        onClick={onSave}
      >
        {SAVE_LABEL_BY_STATUS[save.status]}
      </Button>
      {isInterrupted && (
        <Button type="button" variant="primary" onClick={onStartNewCall}>
          Start a new call
        </Button>
      )}
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
      <SaveStatusNotes save={state.save} />
      <SaveActions
        save={state.save}
        dispatch={dispatch}
        onSave={onSave}
        onStartNewCall={onStartNewCall}
      />
    </div>
  );
}

export function CurrentScreen(
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
      const sectionTitle = SECTIONS.find(
        ({ name }) => name === screen.name,
      )?.title;
      return (
        <DiscoveryScreen
          {...props}
          question={questions[screen.index]}
          label={`${sectionTitle} discovery ${screen.index + 1} of ${questions.length}`}
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
