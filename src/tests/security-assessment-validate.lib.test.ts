import fs from "fs";
import os from "os";
import path from "path";
import { dump, load } from "js-yaml";
import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  clearQuizConfigCache,
  getQuestionsWithFieldLabels,
  getQuizConfigPath,
  loadQuizConfig,
  validateQuizConfig,
  type QuizConfig,
  type QuizQuestion,
} from "@/lib/security-assessment";

const originalEnv = process.env;

function buildQuestion(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id: "q1",
    category: "access",
    segments: ["solo", "small_team", "growing"],
    text: "Do you use MFA?",
    answers: [
      { text: "Yes", points: 3 },
      { text: "No", points: 0, risk: true },
    ],
    ...overrides,
  };
}

/** The smallest config that passes validation; each test breaks one thing. */
function buildConfig(): QuizConfig {
  const cta = {
    heading: "Next step",
    body: "Talk to us",
    buttonLabel: "Book a call",
    buttonHref: "/contact",
  };
  return {
    landing: {
      title: "Assessment",
      intro: "Intro",
      timeEstimate: "5 minutes",
      startLabel: "Start",
    },
    sizeQuestion: "How big is your team?",
    segments: {
      solo: { label: "Solo", description: "1 person" },
      small_team: { label: "Small team", description: "2–20" },
      growing: { label: "Growing", description: "21–50+" },
    },
    sections: { basics: { label: "Basics" } },
    tiers: {
      exposed: { label: "Exposed", headline: "Exposed", body: "Body" },
      reactive: { label: "Reactive", headline: "Reactive", body: "Body" },
      managed: { label: "Managed", headline: "Managed", body: "Body" },
      resilient: { label: "Resilient", headline: "Resilient", body: "Body" },
    },
    thresholds: {
      solo: { reactive: 1, managed: 2, resilient: 3 },
      small_team: { reactive: 1, managed: 2, resilient: 3 },
      growing: { reactive: 1, managed: 2, resilient: 3 },
    },
    categories: {
      access: { section: "basics", label: "Access", weakCopy: "Turn on MFA" },
    },
    questions: [buildQuestion()],
    ctas: {
      solo: {
        exposed: { ...cta },
        reactive: { ...cta },
        managed: { ...cta },
        resilient: { ...cta },
      },
      small_team: {
        exposed: { ...cta },
        reactive: { ...cta },
        managed: { ...cta },
        resilient: { ...cta },
      },
      growing: {
        exposed: { ...cta },
        reactive: { ...cta },
        managed: { ...cta },
        resilient: { ...cta },
      },
    },
  };
}

/** A config with one change, typed loosely so a test can break its shape. */
function breakConfig(
  mutate: (config: Record<string, any>) => void,
): QuizConfig {
  const config = buildConfig() as Record<string, any>;
  mutate(config);
  return config as QuizConfig;
}

/** The problem list validation reports, or [] when the config is valid. */
function problemsOf(config: QuizConfig): string[] {
  try {
    validateQuizConfig(config);
    return [];
  } catch (error) {
    const [header, ...problems] = (error as Error).message.split("\n- ");
    expect(header).toBe(`Invalid quiz config (${getQuizConfigPath()}):`);
    return problems;
  }
}

describe("validateQuizConfig", () => {
  it("accepts a minimal complete config", () => {
    expect(problemsOf(buildConfig())).toEqual([]);
  });

  it.each([
    ["missing", undefined],
    ["empty", {}],
  ])("reports a %s sections map", (_label, sections) => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.sections = sections;
        }),
      ),
    ).toEqual([
      "missing sections map",
      'category "access" points at unknown section "basics"',
      'question "q1" category "access" points at unknown section "basics"',
    ]);
  });

  it("reports every segment when the segments map is missing", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.segments;
        }),
      ),
    ).toEqual([
      "missing segments.solo",
      "missing segments.small_team",
      "missing segments.growing",
    ]);
  });

  it("reports one missing segment", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.segments.small_team;
        }),
      ),
    ).toEqual(["missing segments.small_team"]);
  });

  it("reports every segment when the thresholds map is missing", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.thresholds;
        }),
      ),
    ).toEqual([
      "missing thresholds.solo",
      "missing thresholds.small_team",
      "missing thresholds.growing",
    ]);
  });

  it.each([
    ["reactive equal to managed", { reactive: 2, managed: 2, resilient: 3 }],
    ["managed equal to resilient", { reactive: 1, managed: 3, resilient: 3 }],
    ["reactive above managed", { reactive: 3, managed: 2, resilient: 4 }],
    ["managed above resilient", { reactive: 1, managed: 5, resilient: 4 }],
  ])("rejects thresholds with %s", (_label, thresholds) => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.thresholds.growing = thresholds;
        }),
      ),
    ).toEqual([
      "thresholds.growing must increase: reactive < managed < resilient",
    ]);
  });

  it("reports every cell when the ctas map is missing", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.ctas;
        }),
      ),
    ).toEqual(
      QUIZ_SEGMENTS.flatMap((segment) =>
        RISK_TIERS.map((tier) => `incomplete ctas.${segment}.${tier}`),
      ),
    );
  });

  it("reports every tier of a segment with no ctas", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.ctas.small_team;
        }),
      ),
    ).toEqual([
      "incomplete ctas.small_team.exposed",
      "incomplete ctas.small_team.reactive",
      "incomplete ctas.small_team.managed",
      "incomplete ctas.small_team.resilient",
    ]);
  });

  it("reports a missing cta cell", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.ctas.solo.managed;
        }),
      ),
    ).toEqual(["incomplete ctas.solo.managed"]);
  });

  it.each(["heading", "buttonLabel", "buttonHref"])(
    "reports a cta without its %s",
    (field) => {
      expect(
        problemsOf(
          breakConfig((config) => {
            config.ctas.solo.managed[field] = "";
          }),
        ),
      ).toEqual(["incomplete ctas.solo.managed"]);
    },
  );

  it("reports every tier when the tiers map is missing", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.tiers;
        }),
      ),
    ).toEqual([
      "incomplete tiers.exposed",
      "incomplete tiers.reactive",
      "incomplete tiers.managed",
      "incomplete tiers.resilient",
    ]);
  });

  it("reports a missing tier", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.tiers.reactive;
        }),
      ),
    ).toEqual(["incomplete tiers.reactive"]);
  });

  it.each(["headline", "body"])("reports a tier without its %s", (field) => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.tiers.managed[field] = "";
        }),
      ),
    ).toEqual(["incomplete tiers.managed"]);
  });

  it("reports a category without weakCopy, and the question using it", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.categories.access.weakCopy = "";
        }),
      ),
    ).toEqual([
      'category "access" has no weakCopy',
      'question "q1" references unknown category "access"',
    ]);
  });

  it("reports a null category", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.categories.spare = null;
        }),
      ),
    ).toEqual(['category "spare" has no weakCopy']);
  });

  it("reports questions whose categories map is missing", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.categories;
        }),
      ),
    ).toEqual([
      'segment "solo" resolves to no sections',
      'segment "small_team" resolves to no sections',
      'segment "growing" resolves to no sections',
      'question "q1" references unknown category "access"',
    ]);
  });

  it("reports a category with no section", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          delete config.categories.access.section;
        }),
      ),
    ).toEqual([
      'segment "solo" resolves to no sections',
      'segment "small_team" resolves to no sections',
      'segment "growing" resolves to no sections',
      'question "q1" category "access" has no section',
    ]);
  });

  it("reports a category pointing at an unknown section", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.categories.access.section = "nowhere";
        }),
      ),
    ).toEqual([
      'category "access" points at unknown section "nowhere"',
      'question "q1" category "access" points at unknown section "nowhere"',
    ]);
  });

  it.each([
    ["one answer", [{ text: "Yes", points: 3 }]],
    ["answers that aren't a list", "Yes"],
    ["no answers", undefined],
  ])("reports a question with %s", (_label, answers) => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.questions[0].answers = answers;
        }),
      ),
    ).toEqual(['question "q1" needs at least 2 answers']);
  });

  it.each([
    ["an unknown segment", ["solo", "enterprise"]],
    ["an empty segment list", []],
    ["no segment list", undefined],
  ])("reports a question with %s", (_label, segments) => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.questions.push(buildQuestion({ id: "q2" }));
          config.questions[1].segments = segments;
        }),
      ),
    ).toEqual(['question "q2" has invalid segments']);
  });

  it("reports a segment that no question covers", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.questions[0].segments = ["solo", "small_team"];
        }),
      ),
    ).toEqual(['segment "growing" resolves to no questions']);
  });

  it.each([
    ["empty", []],
    ["missing", undefined],
  ])("reports a %s question list", (_label, questions) => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.questions = questions;
        }),
      ),
    ).toEqual([
      'segment "solo" resolves to no questions',
      'segment "small_team" resolves to no questions',
      'segment "growing" resolves to no questions',
      "no questions defined",
    ]);
  });

  it("reports a duplicate question id once per repeat", () => {
    expect(
      problemsOf(
        breakConfig((config) => {
          config.questions.push(buildQuestion());
        }),
      ),
    ).toEqual(['duplicate question id "q1"']);
  });
});

describe("getQuestionsWithFieldLabels", () => {
  it("numbers repeated categories within a segment from the second on", () => {
    const config = breakConfig((draft) => {
      draft.categories.backups = {
        section: "basics",
        label: "Backups",
        weakCopy: "Back up",
      };
      draft.questions = [
        buildQuestion({ id: "a" }),
        buildQuestion({ id: "b", category: "backups" }),
        buildQuestion({ id: "c" }),
        buildQuestion({ id: "d", segments: ["growing"] }),
        buildQuestion({ id: "e" }),
      ];
    });

    expect(
      getQuestionsWithFieldLabels(config, "solo").map(
        ({ question, fieldLabel }) => [question.id, fieldLabel],
      ),
    ).toEqual([
      ["a", "Access"],
      ["b", "Backups"],
      ["c", "Access (2)"],
      ["e", "Access (3)"],
    ]);
  });
});

describe("quiz config loading", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    process.env = originalEnv;
    clearQuizConfigCache();
  });

  afterAll(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects a file whose quiz config is invalid", () => {
    const content = load(fs.readFileSync(getQuizConfigPath(), "utf8")) as {
      tiers: Record<string, unknown>;
    };
    delete content.tiers.managed;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-fixture-"));
    tempDirs.push(dir);
    fs.writeFileSync(path.join(dir, "security-assessment.yaml"), dump(content));
    process.env = { ...originalEnv, QUIZ_CONTENT_DIR: dir };
    clearQuizConfigCache();

    expect(() => loadQuizConfig()).toThrow(/incomplete tiers\.managed/);
  });

  it("reads from QUIZ_CONTENT_DIR in the test environment", () => {
    process.env = { ...originalEnv, QUIZ_CONTENT_DIR: "/fixtures/quiz" };

    expect(getQuizConfigPath()).toBe(
      path.join("/fixtures/quiz", "security-assessment.yaml"),
    );
  });

  it("ignores QUIZ_CONTENT_DIR outside the test environment", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      QUIZ_CONTENT_DIR: "/fixtures/quiz",
    };

    expect(getQuizConfigPath()).toBe(
      path.join(process.cwd(), "content", "quiz", "security-assessment.yaml"),
    );
  });
});
