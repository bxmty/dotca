import { render } from "@testing-library/react";
import SecurityAssessmentPage from "@/app/security-assessment/page";
import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  loadSdrContent,
  type QuizConfig,
} from "@/lib/security-assessment";

const quizProps: { config: QuizConfig }[] = [];

jest.mock("@/app/security-assessment/SecurityAssessmentQuiz", () => ({
  __esModule: true,
  default: (props: { config: QuizConfig }) => {
    quizProps.push(props);
    return null;
  },
}));

/** Every distinctive string in the SDR-only content. */
function collectSdrStrings(): string[] {
  const sdr = loadSdrContent();
  const strings = [
    ...Object.values(sdr.talkTracks).flatMap((track) => [
      track.whyItMatters,
      track.probe,
    ]),
    ...QUIZ_SEGMENTS.flatMap((segment) =>
      RISK_TIERS.flatMap((tier) => [
        sdr.nextSteps[segment][tier].propose,
        sdr.nextSteps[segment][tier].service,
      ]),
    ),
    ...sdr.discovery.flatMap((question) => [
      question.text,
      ...(question.kind === "choice" ? question.choices : []),
    ]),
  ];
  // Short choices like "Both" or "Just me" can appear in public copy too.
  return [...new Set(strings)].filter((text) => text.length > 20);
}

describe("SecurityAssessmentPage props", () => {
  it("passes the quiz no SDR-only content", () => {
    const { container } = render(<SecurityAssessmentPage />);

    expect(quizProps).toHaveLength(1);
    const { config } = quizProps[0];
    expect(config).not.toHaveProperty("sdr");

    const serializedProps = JSON.stringify(quizProps[0]);
    const pageHtml = container.innerHTML;
    const sdrStrings = collectSdrStrings();
    expect(sdrStrings.length).toBeGreaterThan(40);
    for (const text of sdrStrings) {
      expect(serializedProps).not.toContain(text);
      expect(pageHtml).not.toContain(text);
    }
  });
});
