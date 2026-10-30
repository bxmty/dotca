// tests/quiz.lib.test.ts
import {
  QUIZ_SEGMENTS,
  clearQuizConfigCache,
  getQuestionsForSegment,
  isQuizSegment,
  loadQuizConfig,
  scoreQuizAnswers,
  validateQuizConfig,
  type QuizConfig,
  type QuizSegment,
} from "@/lib/security-assessment";

/** Answer every question for a segment with the given answer picker. */
function buildAnswers(
  config: QuizConfig,
  segment: QuizSegment,
  pickIndex: (answerCount: number) => number,
): Record<string, number> {
  return Object.fromEntries(
    getQuestionsForSegment(config, segment).map((question) => [
      question.id,
      pickIndex(question.answers.length),
    ]),
  );
}

describe("quiz config", () => {
  beforeEach(() => {
    clearQuizConfigCache();
  });

  it("loads and passes validation", () => {
    expect(() => loadQuizConfig()).not.toThrow();
  });

  it("caches the parsed config between loads", () => {
    expect(loadQuizConfig()).toBe(loadQuizConfig());
  });

  it("keeps the designed question count per segment", () => {
    const config = loadQuizConfig();
    const counts = Object.fromEntries(
      QUIZ_SEGMENTS.map((segment) => [
        segment,
        getQuestionsForSegment(config, segment).length,
      ]),
    );
    expect(counts).toEqual({ solo: 6, small_team: 11, growing: 18 });
  });

  it("includes the core hygiene categories in every segment", () => {
    const config = loadQuizConfig();
    const coreCategories = [
      "password_mfa",
      "phishing",
      "backups",
      "patching",
      "device_security",
      "invoice_fraud",
    ];
    for (const segment of QUIZ_SEGMENTS) {
      const categories = getQuestionsForSegment(config, segment).map(
        (question) => question.category,
      );
      for (const category of coreCategories) {
        expect(categories).toContain(category);
      }
    }
  });

  it("keeps tier thresholds reachable within each segment's max score", () => {
    const config = loadQuizConfig();
    for (const segment of QUIZ_SEGMENTS) {
      const maxScore = getQuestionsForSegment(config, segment).reduce(
        (sum, question) =>
          sum + Math.max(...question.answers.map((answer) => answer.points)),
        0,
      );
      expect(config.thresholds[segment].resilient).toBeLessThanOrEqual(
        maxScore,
      );
    }
  });

  it("rejects a config with a duplicate question id", () => {
    const config = loadQuizConfig();
    const broken = {
      ...config,
      questions: [...config.questions, config.questions[0]],
    };
    expect(() => validateQuizConfig(broken)).toThrow(/duplicate question id/);
  });

  it("rejects a config with an unknown question category", () => {
    const config = loadQuizConfig();
    const broken = {
      ...config,
      questions: [
        { ...config.questions[0], id: "rogue", category: "nonexistent" },
      ],
    };
    expect(() => validateQuizConfig(broken)).toThrow(/unknown category/);
  });

  it("rejects a config with non-increasing thresholds", () => {
    const config = loadQuizConfig();
    const broken = {
      ...config,
      thresholds: {
        ...config.thresholds,
        solo: { reactive: 10, managed: 5, resilient: 16 },
      },
    };
    expect(() => validateQuizConfig(broken)).toThrow(/must increase/);
  });

  it("rejects a config missing a CTA cell", () => {
    const config = loadQuizConfig();
    const broken = {
      ...config,
      ctas: {
        ...config.ctas,
        solo: { ...config.ctas.solo, exposed: { heading: "" } },
      },
    } as QuizConfig;
    expect(() => validateQuizConfig(broken)).toThrow(
      /incomplete ctas.solo.exposed/,
    );
  });

  it("rejects a category pointing at an unknown section", () => {
    const config = loadQuizConfig();
    const broken = {
      ...config,
      categories: {
        ...config.categories,
        password_mfa: {
          ...config.categories.password_mfa,
          section: "nonexistent",
        },
      },
    };
    expect(() => validateQuizConfig(broken)).toThrow(/unknown section/);
  });

  it("names contiguous segment boundaries in descriptions", () => {
    const config = loadQuizConfig();
    expect(config.segments.solo.description).toMatch(/1 person/i);
    expect(config.segments.small_team.description).toMatch(/2–20/);
    expect(config.segments.growing.description).toMatch(/21–50\+/);
  });
});

describe("isQuizSegment", () => {
  it("accepts the three known segments and rejects everything else", () => {
    expect(isQuizSegment("solo")).toBe(true);
    expect(isQuizSegment("small_team")).toBe(true);
    expect(isQuizSegment("growing")).toBe(true);
    expect(isQuizSegment("enterprise")).toBe(false);
    expect(isQuizSegment(undefined)).toBe(false);
  });
});

describe("scoreQuizAnswers", () => {
  const config = loadQuizConfig();

  it.each(QUIZ_SEGMENTS)(
    "scores all-best answers as resilient for %s",
    (segment) => {
      const result = scoreQuizAnswers({
        config,
        segment,
        answers: buildAnswers(config, segment, () => 0),
      });
      expect(result.tier).toBe("resilient");
      expect(result.score).toBe(result.maxScore);
      expect(result.riskCategories).toEqual([]);
    },
  );

  it.each(QUIZ_SEGMENTS)(
    "scores all-worst answers as exposed for %s with every category flagged",
    (segment) => {
      const result = scoreQuizAnswers({
        config,
        segment,
        answers: buildAnswers(config, segment, (count) => count - 1),
      });
      expect(result.tier).toBe("exposed");
      expect(result.score).toBe(0);
      expect(result.riskCategories.length).toBe(
        getQuestionsForSegment(config, segment).length,
      );
    },
  );

  it("places middling answers between exposed and resilient", () => {
    const result = scoreQuizAnswers({
      config,
      segment: "solo",
      answers: buildAnswers(config, "solo", () => 1),
    });
    expect(["reactive", "managed"]).toContain(result.tier);
    expect(result.riskCategories).toEqual([]);
  });

  it("flags only the categories where a risk answer was picked", () => {
    const questions = getQuestionsForSegment(config, "solo");
    const answers = buildAnswers(config, "solo", () => 0);
    answers[questions[0].id] = questions[0].answers.length - 1;
    const result = scoreQuizAnswers({ config, segment: "solo", answers });
    expect(result.riskCategories).toEqual([questions[0].category]);
  });

  it("throws when an answer is missing", () => {
    const answers = buildAnswers(config, "solo", () => 0);
    delete answers[getQuestionsForSegment(config, "solo")[0].id];
    expect(() =>
      scoreQuizAnswers({ config, segment: "solo", answers }),
    ).toThrow(/Missing or invalid answer/);
  });

  it("throws when an answer index is out of range", () => {
    const answers = buildAnswers(config, "solo", () => 0);
    answers[getQuestionsForSegment(config, "solo")[0].id] = 99;
    expect(() =>
      scoreQuizAnswers({ config, segment: "solo", answers }),
    ).toThrow(/Missing or invalid answer/);
  });

  it.each([
    ["solo", 12, 18, "managed"],
    ["small_team", 22, 33, "managed"],
    ["growing", 36, 54, "managed"],
  ] as const)(
    "keeps the second-best answers at a known score for %s",
    (segment, score, maxScore, tier) => {
      const result = scoreQuizAnswers({
        config,
        segment,
        answers: buildAnswers(config, segment, () => 1),
      });
      expect(result).toEqual({ score, maxScore, tier, riskCategories: [] });
    },
  );

  it("ignores discovery answers mixed into the answer map", () => {
    const answers = {
      ...buildAnswers(config, "solo", () => 1),
      why_now: 0,
      timeline: 3,
    };
    const result = scoreQuizAnswers({ config, segment: "solo", answers });
    expect(result).toEqual({
      score: 12,
      maxScore: 18,
      tier: "managed",
      riskCategories: [],
    });
  });

  it("ignores answers to questions outside the segment", () => {
    const answers = buildAnswers(config, "solo", () => 0);
    answers.incident_response = 3; // growing-only question, worst answer
    const result = scoreQuizAnswers({ config, segment: "solo", answers });
    expect(result.tier).toBe("resilient");
    expect(result.riskCategories).toEqual([]);
  });
});
