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
  omitFieldErrors,
} from "@/lib/formValidation";
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

type QuizScreen = "landing" | "size" | "details" | "questions" | "results";

type LeadFields = { name: string; email: string; company: string };
type LeadFieldName = keyof LeadFields;
type LeadFieldErrors = Partial<Record<LeadFieldName, string>>;
type DeliveryStatus = "idle" | "sending" | "sent" | "error";

const AUTO_ADVANCE_MS = 250;
// Field order, for moving focus to the first invalid one
const LEAD_FIELD_NAMES: readonly LeadFieldName[] = ["name", "email", "company"];
const CAPTURE_BRIEF_FIELD_ID = "security-assessment-brief";
const DELIVERY_ERROR_MESSAGE =
  "Something went wrong. Please try again in a moment.";

const getLeadFieldId = (field: LeadFieldName) => `security-assessment-${field}`;

/** Errors worded as the fix (Component Spec, forms). */
function validateLeadFields({
  name,
  email,
  company,
}: LeadFields): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  if (!name.trim()) {
    errors.name = "enter your name";
  }
  if (!email.trim()) {
    errors.email = "enter your email address";
  } else if (!isEmailAddress(email)) {
    errors.email = INCOMPLETE_EMAIL_MESSAGE;
  }
  if (!company.trim()) {
    errors.company = "enter your company name";
  }
  return errors;
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
          <Button
            type="button"
            variant="primary"
            onClick={() => setScreen("details")}
          >
            Continue
          </Button>
        </div>
      </Section>
    );
  }

  if (screen === "details") {
    return (
      <Section>
        <h1 className="m-0 mb-3 text-h2 font-semibold">
          First, a little about you
        </h1>
        <p className="m-0 mb-8 text-body text-muted">
          Your score shows on screen as soon as you finish, and our team uses
          these details to follow up on it.
        </p>
        <form
          className="grid max-w-[560px] content-start gap-4.5"
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

        <div
          className="mb-10 grid max-w-[560px] content-start gap-4.5 border-t border-rule pt-8"
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
