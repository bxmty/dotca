"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Button, ButtonLink } from "@/app/components/Button";
import BriefOptInCheckbox from "@/app/components/BriefOptInCheckbox";
import { TextField } from "@/app/components/Field";
import PageHero from "@/app/components/PageHero";
import StackedAnswerList from "@/app/components/StackedAnswerList";
import StatusNote from "@/app/components/StatusNote";
import StepProgress from "@/app/components/StepProgress";
import { omitFieldErrors } from "@/lib/formValidation";
import { event as trackGaEvent } from "@/lib/gtag";
import {
  QUIZ_SEGMENTS,
  type QuizConfig,
  type QuizResult,
  type QuizSegment,
} from "@/lib/security-assessment/quizTypes";
import {
  getQuestionsForSegment,
  getSectionKeysForSegment,
} from "@/lib/security-assessment/validateQuizConfig";
import { scoreQuizAnswers } from "@/lib/security-assessment/scoreQuizAnswers";
import DotGridPanel from "./DotGridPanel";
import {
  LEAD_FIELD_NAMES,
  validateLeadFields,
  type LeadFieldErrors,
  type LeadFieldName,
  type LeadFields,
} from "./leadFields";
import PerimeterRings from "./PerimeterRings";
import QuizResultSummary from "./QuizResultSummary";

type QuizScreen = "landing" | "size" | "details" | "questions" | "results";

type DeliveryStatus = "idle" | "sending" | "sent" | "error";

// Long enough for the selected ring to draw in and be seen before moving on
const AUTO_ADVANCE_MS = 400;
const SCREEN_HEADING_ID = "security-assessment-heading";
const SCREEN_HEADING_CLASS_NAME = "m-0 text-h2 font-semibold outline-none";
// Questions run to two or three lines; a step down on phones keeps the
// answers in the first screen
const QUESTION_HEADING_CLASS_NAME =
  "m-0 text-h3 leading-snug font-semibold outline-none md:text-h2 md:leading-tight";
const CAPTURE_BRIEF_FIELD_ID = "security-assessment-brief";
const DELIVERY_ERROR_MESSAGE =
  "Something went wrong. Please try again in a moment.";

const getLeadFieldId = (field: LeadFieldName) => `security-assessment-${field}`;

/**
 * One centred column for every screen after the landing, the same width as
 * onboarding, so the quiz doesn't jump between layouts as it advances. Key
 * it by screen so each new screen rises in.
 */
function QuizColumn({
  columnRef,
  children,
}: {
  columnRef: Ref<HTMLElement>;
  children: ReactNode;
}) {
  return (
    <section
      ref={columnRef}
      className="mx-auto grid w-full max-w-[720px] content-start gap-6 px-4 py-12 motion-safe:animate-rise md:py-16"
    >
      {children}
    </section>
  );
}

export default function SecurityAssessmentQuiz({
  config,
}: {
  config: QuizConfig;
}) {
  const [screen, setScreen] = useState<QuizScreen>("landing");
  const [segment, setSegment] = useState<QuizSegment>("solo");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [leadFields, setLeadFields] = useState<LeadFields>({
    name: "",
    email: "",
    company: "",
  });
  const [leadFieldErrors, setLeadFieldErrors] = useState<LeadFieldErrors>({});
  // Never pre-checked: brief consent must be express (CASL)
  const [wantsBrief, setWantsBrief] = useState(false);
  // Honeypot: humans never see this field; bots that fill it are dropped
  const [website, setWebsite] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("idle");
  const [deliveryErrorMessage, setDeliveryErrorMessage] = useState("");
  const hasTrackedAssessmentComplete = useRef(false);
  // One lead per completed assessment: revisiting answers re-scores on
  // screen but does not open a second Syncro ticket
  const hasRequestedDelivery = useRef(false);
  const columnRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasLeftLanding = useRef(false);

  const questions = useMemo(
    () => (segment ? getQuestionsForSegment(config, segment) : []),
    [config, segment],
  );

  const sectionKeys = useMemo(
    () => (segment ? getSectionKeysForSegment(config, segment) : []),
    [config, segment],
  );

  const sectionStepTitles = sectionKeys.map(
    (sectionKey) => config.sections[sectionKey].label,
  );

  const currentQuestion = questions[questionIndex];
  const currentSectionKey = currentQuestion
    ? config.categories[currentQuestion.category].section
    : sectionKeys[0];
  const currentSectionStep = sectionKeys.indexOf(currentSectionKey) + 1 || 1;

  const segmentOptions = QUIZ_SEGMENTS.map((segmentKey) => ({
    value: segmentKey,
    label: config.segments[segmentKey].label,
    detail: config.segments[segmentKey].description,
  }));

  const goToSectionStep = (step: number) => {
    const sectionKey = sectionKeys[step - 1];
    const targetIndex = questions.findIndex(
      (question) => config.categories[question.category].section === sectionKey,
    );
    if (targetIndex >= 0) {
      setQuestionIndex(targetIndex);
    }
  };

  const goBack = () => {
    if (screen === "results") {
      setScreen("questions");
      setQuestionIndex(questions.length - 1);
      setResult(null);
      return;
    }
    if (screen === "questions" && questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      return;
    }
    if (screen === "questions") {
      setScreen("details");
      return;
    }
    if (screen === "details") {
      setScreen("size");
      return;
    }
    if (screen === "size") {
      setScreen("landing");
    }
  };

  const finishOrAdvance = (nextAnswers: Record<string, number>) => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      return;
    }
    const scored = scoreQuizAnswers({
      config,
      segment,
      answers: nextAnswers,
    });
    setResult(scored);
    setScreen("results");
  };

  const selectAnswer = (answerIndex: number) => {
    if (!currentQuestion) {
      return;
    }
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: answerIndex,
    };
    setAnswers(nextAnswers);
    window.setTimeout(() => finishOrAdvance(nextAnswers), AUTO_ADVANCE_MS);
  };

  const startQuestions = () => {
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setDeliveryStatus("idle");
    setDeliveryErrorMessage("");
    hasTrackedAssessmentComplete.current = false;
    hasRequestedDelivery.current = false;
    setScreen("questions");
  };

  const updateLeadField = (field: LeadFieldName, value: string) => {
    setLeadFields((fields) => ({ ...fields, [field]: value }));
    setLeadFieldErrors((errors) => omitFieldErrors(errors, [field]));
  };

  const submitLeadDetails = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    const errors = validateLeadFields(leadFields);
    setLeadFieldErrors(errors);
    const firstInvalidField = LEAD_FIELD_NAMES.find((field) => errors[field]);
    if (firstInvalidField) {
      document.getElementById(getLeadFieldId(firstInvalidField))?.focus();
      return;
    }
    startQuestions();
  };

  // Each new screen or question starts at its heading: scroll back up when
  // the visitor has scrolled past it (phones) and move focus there, so
  // screen readers announce the change. The landing on first load is left
  // alone rather than stealing focus from the page.
  useEffect(() => {
    if (screen === "landing" && !hasLeftLanding.current) {
      return;
    }
    hasLeftLanding.current = true;
    const column = columnRef.current;
    if (column && column.getBoundingClientRect().top < 0) {
      column.scrollIntoView?.({ block: "start" });
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [screen, questionIndex]);

  useEffect(() => {
    if (
      screen !== "results" ||
      !result ||
      hasTrackedAssessmentComplete.current
    ) {
      return;
    }
    hasTrackedAssessmentComplete.current = true;
    trackGaEvent({
      action: "assessment_complete",
      category: "security_assessment",
      label: `${segment}_${result.tier}`,
      params: { segment, tier: result.tier },
    });
  }, [screen, result, segment]);

  const deliverAssessmentLead = async (): Promise<void> => {
    setDeliveryStatus("sending");
    setDeliveryErrorMessage("");

    try {
      const response = await fetch("/api/security-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadFields.name.trim(),
          email: leadFields.email.trim(),
          company: leadFields.company.trim(),
          website,
          wantsBrief,
          segment,
          answers,
        }),
      });
      const responseData = await response.json().catch(() => null);

      if (!response.ok || !responseData?.success) {
        throw new Error(responseData?.error ?? DELIVERY_ERROR_MESSAGE);
      }

      setDeliveryStatus("sent");
    } catch (error) {
      console.error("Security assessment delivery error:", error);
      setDeliveryErrorMessage(
        error instanceof Error ? error.message : DELIVERY_ERROR_MESSAGE,
      );
      setDeliveryStatus("error");
    }
  };

  useEffect(() => {
    if (screen !== "results" || !result || hasRequestedDelivery.current) {
      return;
    }
    hasRequestedDelivery.current = true;
    void deliverAssessmentLead();
    // deliverAssessmentLead reads the latest render's state; the ref keeps
    // this to one request per completed assessment
  }, [screen, result]);

  if (screen === "landing") {
    return (
      <PageHero
        heading={config.landing.title}
        lead={config.landing.intro}
        facts={
          <>
            <span>{config.landing.timeEstimate}</span>
            <span>Free, no obligation</span>
          </>
        }
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => setScreen("size")}
          >
            {config.landing.startLabel}
          </Button>
        }
        aside={<PerimeterRings />}
      />
    );
  }

  if (screen === "size") {
    return (
      <QuizColumn key={screen} columnRef={columnRef}>
        <h1
          id={SCREEN_HEADING_ID}
          ref={headingRef}
          tabIndex={-1}
          className={SCREEN_HEADING_CLASS_NAME}
        >
          {config.sizeQuestion}
        </h1>
        <StackedAnswerList
          labelledBy={SCREEN_HEADING_ID}
          name="businessSize"
          options={segmentOptions}
          value={segment}
          onChange={(nextSegment) => setSegment(nextSegment)}
        />
        <div className="mt-2 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setScreen("details")}
          >
            Continue
          </Button>
        </div>
      </QuizColumn>
    );
  }

  if (screen === "details") {
    return (
      <QuizColumn key={screen} columnRef={columnRef}>
        <div className="grid gap-3">
          <h1
            id={SCREEN_HEADING_ID}
            ref={headingRef}
            tabIndex={-1}
            className={SCREEN_HEADING_CLASS_NAME}
          >
            First, a little about you
          </h1>
          <p className="m-0 text-body text-muted">
            Your score shows on screen as soon as you finish, and our team uses
            these details to follow up on it.
          </p>
        </div>
        <form
          className="grid content-start gap-4.5"
          onSubmit={submitLeadDetails}
          noValidate
          aria-label="Your details"
        >
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          >
            <label htmlFor="security-assessment-website">Website</label>
            <input
              type="text"
              id="security-assessment-website"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <TextField
            id={getLeadFieldId("name")}
            label="Name"
            name="name"
            autoComplete="name"
            value={leadFields.name}
            onChange={(e) => updateLeadField("name", e.target.value)}
            required
            error={leadFieldErrors.name}
          />
          <TextField
            id={getLeadFieldId("email")}
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={leadFields.email}
            onChange={(e) => updateLeadField("email", e.target.value)}
            required
            error={leadFieldErrors.email}
          />
          <TextField
            id={getLeadFieldId("company")}
            label="Company"
            name="company"
            autoComplete="organization"
            value={leadFields.company}
            onChange={(e) => updateLeadField("company", e.target.value)}
            required
            error={leadFieldErrors.company}
          />
          <BriefOptInCheckbox
            id={CAPTURE_BRIEF_FIELD_ID}
            isChecked={wantsBrief}
            onChange={setWantsBrief}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={goBack}>
              Back
            </Button>
            <Button type="submit" variant="primary">
              Start the questions
            </Button>
          </div>
        </form>
      </QuizColumn>
    );
  }

  if (screen === "results" && result && segment) {
    const cta = config.ctas[segment][result.tier];

    return (
      <QuizColumn key={screen} columnRef={columnRef}>
        <QuizResultSummary
          config={config}
          segment={segment}
          result={result}
          headingId={SCREEN_HEADING_ID}
          headingRef={headingRef}
          headingClassName={SCREEN_HEADING_CLASS_NAME}
        />

        <div className="mt-4 grid gap-3 border-t border-rule pt-8">
          <h2 className="m-0 text-h3 font-semibold">{cta.heading}</h2>
          <p className="m-0 text-body text-muted">{cta.body}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink variant="primary" href={cta.buttonHref}>
              {cta.buttonLabel}
            </ButtonLink>
            {cta.secondaryLabel && cta.secondaryHref && (
              <ButtonLink variant="secondary" href={cta.secondaryHref}>
                {cta.secondaryLabel}
              </ButtonLink>
            )}
          </div>
        </div>

        <div
          className="grid content-start gap-4.5 border-t border-rule pt-8"
          aria-live="polite"
        >
          {deliveryStatus === "sending" && (
            <p className="m-0 text-body text-muted">Saving your results…</p>
          )}
          {deliveryStatus === "sent" && (
            <StatusNote tone="ok" label="Saved">
              <p className="m-0">
                Your results are with our team. We&apos;ll follow up at{" "}
                {leadFields.email.trim()}.
              </p>
            </StatusNote>
          )}
          {deliveryStatus === "error" && (
            <>
              <StatusNote tone="error" label="Error">
                {deliveryErrorMessage}
              </StatusNote>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void deliverAssessmentLead()}
                >
                  Try again
                </Button>
              </div>
            </>
          )}
        </div>

        <div>
          <Button type="button" variant="secondary" onClick={goBack}>
            Review answers
          </Button>
        </div>
      </QuizColumn>
    );
  }

  if (screen === "questions" && currentQuestion) {
    const answerOptions = currentQuestion.answers.map((answer, index) => ({
      value: String(index),
      label: answer.text,
    }));
    const selectedIndex = answers[currentQuestion.id];
    const selectedValue =
      typeof selectedIndex === "number" ? String(selectedIndex) : "";

    const sectionQuestions = questions.filter(
      (question) =>
        config.categories[question.category].section === currentSectionKey,
    );
    const sectionFraction =
      (sectionQuestions.indexOf(currentQuestion) + 1) / sectionQuestions.length;

    return (
      <QuizColumn key={screen} columnRef={columnRef}>
        <StepProgress
          steps={sectionStepTitles}
          currentStep={currentSectionStep}
          onStepSelect={goToSectionStep}
          currentStepFraction={sectionFraction}
        />
        {/* Keyed per question, so each one rises in */}
        <div
          key={currentQuestion.id}
          className="grid gap-6 motion-safe:animate-rise"
        >
          <div className="grid gap-4">
            <DotGridPanel className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 px-4 pt-3.5 pb-3 font-mono text-label tracking-[.06em] text-muted uppercase">
              <span>{config.categories[currentQuestion.category].label}</span>
              <span className="text-ink tabular-nums">
                {`Question ${questionIndex + 1} of ${questions.length}`}
              </span>
            </DotGridPanel>
            <h1
              id={SCREEN_HEADING_ID}
              ref={headingRef}
              tabIndex={-1}
              className={QUESTION_HEADING_CLASS_NAME}
            >
              {currentQuestion.text}
            </h1>
          </div>
          <StackedAnswerList
            labelledBy={SCREEN_HEADING_ID}
            name={currentQuestion.id}
            options={answerOptions}
            value={selectedValue}
            onChange={(value) => selectAnswer(Number(value))}
          />
        </div>
        <div className="mt-2">
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
        </div>
      </QuizColumn>
    );
  }

  return null;
}
