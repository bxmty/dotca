"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/app/components/Button";
import BriefOptInCheckbox from "@/app/components/BriefOptInCheckbox";
import { TextField } from "@/app/components/Field";
import PageHero from "@/app/components/PageHero";
import RuledGrid from "@/app/components/RuledGrid";
import Section from "@/app/components/Section";
import SegmentedChoice from "@/app/components/SegmentedChoice";
import StackedAnswerList from "@/app/components/StackedAnswerList";
import StatusNote from "@/app/components/StatusNote";
import StepProgress from "@/app/components/StepProgress";
import {
  INCOMPLETE_EMAIL_MESSAGE,
  isEmailAddress,
} from "@/lib/formValidation";
import { event as trackGaEvent } from "@/lib/gtag";
import {
  QUIZ_SEGMENTS,
  getQuestionsForSegment,
  getSectionKeysForSegment,
  scoreQuizAnswers,
  type QuizConfig,
  type QuizResult,
  type QuizSegment,
} from "@/lib/security-assessment";

type QuizScreen = "landing" | "size" | "questions" | "results";

const AUTO_ADVANCE_MS = 250;
const CAPTURE_EMAIL_FIELD_ID = "security-assessment-email";
const CAPTURE_BRIEF_FIELD_ID = "security-assessment-brief";

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
  const [captureEmail, setCaptureEmail] = useState("");
  const [wantsBrief, setWantsBrief] = useState(false);
  const [website, setWebsite] = useState("");
  const [captureEmailError, setCaptureEmailError] = useState<
    string | undefined
  >();
  const [captureErrorMessage, setCaptureErrorMessage] = useState("");
  const [isCaptureSubmitting, setIsCaptureSubmitting] = useState(false);
  const [isCaptureSent, setIsCaptureSent] = useState(false);
  const hasTrackedAssessmentComplete = useRef(false);

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
  const currentSectionStep =
    sectionKeys.indexOf(currentSectionKey) + 1 || 1;

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
    setIsCaptureSent(false);
    setCaptureEmail("");
    setCaptureErrorMessage("");
    setCaptureEmailError(undefined);
    hasTrackedAssessmentComplete.current = false;
    setScreen("questions");
  };

  useEffect(() => {
    if (screen !== "results" || !result || hasTrackedAssessmentComplete.current) {
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

  const submitCapture = async (
    submitEvent: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    submitEvent.preventDefault();

    const fieldError = !captureEmail.trim()
      ? "enter your email address"
      : !isEmailAddress(captureEmail)
        ? INCOMPLETE_EMAIL_MESSAGE
        : undefined;
    setCaptureEmailError(fieldError);
    if (fieldError) {
      setCaptureErrorMessage("");
      document.getElementById(CAPTURE_EMAIL_FIELD_ID)?.focus();
      return;
    }

    setIsCaptureSubmitting(true);
    setCaptureErrorMessage("");

    try {
      const response = await fetch("/api/security-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: captureEmail.trim(),
          website,
          wantsBrief,
          segment,
          answers,
        }),
      });
      const responseData = await response.json().catch(() => null);

      if (!response.ok || !responseData?.success) {
        throw new Error(
          responseData?.error ??
            "Something went wrong. Please try again in a moment.",
        );
      }

      setIsCaptureSent(true);
    } catch (error) {
      console.error("Security assessment capture error:", error);
      setCaptureErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again in a moment.",
      );
    } finally {
      setIsCaptureSubmitting(false);
    }
  };

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
      />
    );
  }

  if (screen === "size") {
    return (
      <Section>
        <SegmentedChoice
          legend={config.sizeQuestion}
          name="businessSize"
          options={segmentOptions}
          value={segment}
          onChange={(nextSegment) => setSegment(nextSegment)}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
          <Button type="button" variant="primary" onClick={startQuestions}>
            Continue
          </Button>
        </div>
      </Section>
    );
  }

  if (screen === "results" && result && segment) {
    const tierCopy = config.tiers[result.tier];
    const cta = config.ctas[segment][result.tier];
    const weakAreaItems = result.riskCategories.map((categoryKey) => ({
      title: config.categories[categoryKey].label,
      body: config.categories[categoryKey].weakCopy,
    }));

    return (
      <Section>
        <p className="m-0 mb-2 font-mono text-label text-muted">
          {tierCopy.label}
        </p>
        <h1 className="m-0 mb-3 text-h2 font-semibold">{tierCopy.headline}</h1>
        <p className="m-0 mb-6 font-mono text-label text-muted">
          Score {result.score} / {result.maxScore}
        </p>
        <p className="m-0 mb-8 text-body text-muted">{tierCopy.body}</p>

        {weakAreaItems.length > 0 && (
          <div className="mb-10">
            <h2 className="m-0 mb-4 text-h3 font-semibold">Where to focus</h2>
            <RuledGrid items={weakAreaItems} />
          </div>
        )}

        <div className="mb-10 grid gap-3 border-t border-rule pt-8">
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

        <div className="mb-10 grid max-w-[560px] content-start gap-4.5 border-t border-rule pt-8">
          <h2 className="m-0 text-h3 font-semibold">Email me these results</h2>
          <p className="m-0 text-body text-muted">
            Optional — we&apos;ll send a copy of this summary to your inbox.
          </p>
          {isCaptureSent ? (
            <StatusNote tone="ok" label="Sent">
              <p className="m-0">Check your inbox for a copy of your results.</p>
            </StatusNote>
          ) : (
            <form
              className="grid content-start gap-4.5"
              onSubmit={submitCapture}
              noValidate
              aria-label="Email assessment results"
            >
              {captureErrorMessage && (
                <StatusNote tone="error" label="Error">
                  {captureErrorMessage}
                </StatusNote>
              )}
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
                id={CAPTURE_EMAIL_FIELD_ID}
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={captureEmail}
                onChange={(e) => {
                  setCaptureEmail(e.target.value);
                  setCaptureEmailError(undefined);
                }}
                required
                error={captureEmailError}
              />
              <BriefOptInCheckbox
                id={CAPTURE_BRIEF_FIELD_ID}
                isChecked={wantsBrief}
                onChange={setWantsBrief}
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={isCaptureSubmitting}
              >
                {isCaptureSubmitting ? "Sending…" : "Send my results"}
              </Button>
            </form>
          )}
        </div>

        <Button type="button" variant="secondary" onClick={goBack}>
          Review answers
        </Button>
      </Section>
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

    return (
      <Section>
        <StepProgress
          steps={sectionStepTitles}
          currentStep={currentSectionStep}
          onStepSelect={goToSectionStep}
        />
        <p className="mt-4 mb-1 font-mono text-label text-muted">
          Question {questionIndex + 1} of {questions.length}
        </p>
        <h1 className="m-0 mb-6 text-h2 font-semibold">
          {currentQuestion.text}
        </h1>
        <StackedAnswerList
          legend={currentQuestion.text}
          name={currentQuestion.id}
          options={answerOptions}
          value={selectedValue}
          onChange={(value) => selectAnswer(Number(value))}
        />
        <div className="mt-8">
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
        </div>
      </Section>
    );
  }

  return null;
}
