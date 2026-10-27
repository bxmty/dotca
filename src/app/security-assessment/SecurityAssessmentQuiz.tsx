"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/app/components/Button";
import PageHero from "@/app/components/PageHero";
import RuledGrid from "@/app/components/RuledGrid";
import Section from "@/app/components/Section";
import SegmentedChoice from "@/app/components/SegmentedChoice";
import StackedAnswerList from "@/app/components/StackedAnswerList";
import StepProgress from "@/app/components/StepProgress";
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
    setScreen("questions");
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
