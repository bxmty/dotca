import fs from "fs";
import os from "os";
import path from "path";
import { dump, load } from "js-yaml";
import {
  QUIZ_SEGMENTS,
  RISK_TIERS,
  clearQuizConfigCache,
  getQuizConfigPath,
  loadQuizConfig,
  loadSdrContent,
} from "@/lib/security-assessment";

type AssessmentYaml = Record<string, unknown> & {
  sdr: {
    status: unknown;
    talkTracks: Record<string, unknown>;
    nextSteps: Record<string, Record<string, unknown>>;
    discovery: Record<string, unknown>[];
  };
};

const realYaml = fs.readFileSync(getQuizConfigPath(), "utf8");
const tempDirs: string[] = [];

/** Parse a fresh copy of the real YAML for a test to break. */
function readRealYaml(): AssessmentYaml {
  return load(realYaml) as AssessmentYaml;
}

/** Point the loader at a fixture dir holding this content. */
function useFixture(content: AssessmentYaml): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdr-fixture-"));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, "security-assessment.yaml"), dump(content));
  process.env.QUIZ_CONTENT_DIR = dir;
  clearQuizConfigCache();
}

/** Write a fixture with one change and load it. */
function loadBroken(mutate: (content: AssessmentYaml) => void): () => void {
  const content = readRealYaml();
  mutate(content);
  useFixture(content);
  return () => loadSdrContent();
}

afterEach(() => {
  delete process.env.QUIZ_CONTENT_DIR;
  clearQuizConfigCache();
});

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("loadSdrContent (real YAML)", () => {
  it("gives every posture question a talk track", () => {
    const { questions } = loadQuizConfig();
    const { talkTracks } = loadSdrContent();
    for (const question of questions) {
      expect(talkTracks[question.id]?.whyItMatters).toBeTruthy();
      expect(talkTracks[question.id]?.probe).toBeTruthy();
    }
  });

  it("gives every segment and tier a next step", () => {
    const { nextSteps } = loadSdrContent();
    for (const segment of QUIZ_SEGMENTS) {
      for (const tier of RISK_TIERS) {
        expect(nextSteps[segment][tier].propose).toBeTruthy();
        expect(nextSteps[segment][tier].service).toBeTruthy();
      }
    }
  });

  it("asks a light BANT set of discovery questions in both groups", () => {
    const { discovery } = loadSdrContent();
    expect(discovery.length).toBeGreaterThanOrEqual(8);
    expect(discovery.length).toBeLessThanOrEqual(10);
    expect(discovery.map((question) => question.id)).toEqual([
      "why_now",
      "current_it",
      "user_count",
      "email_platform",
      "recent_incidents",
      "decision_maker",
      "timeline",
      "budget",
      "agreed_next_step",
    ]);
    expect(
      discovery.filter((question) => question.group === "opening"),
    ).toHaveLength(5);
  });

  it("asks why now as free text only", () => {
    const whyNow = loadSdrContent().discovery.find(
      (question) => question.id === "why_now",
    );
    expect(whyNow).toMatchObject({ group: "opening", kind: "text" });
    expect(whyNow).not.toHaveProperty("choices");
  });

  it("is marked as draft pending sales sign-off", () => {
    expect(loadSdrContent().status).toBe("draft");
  });
});

describe("loadSdrContent (malformed fixtures)", () => {
  it("loads an unchanged copy of the real YAML from the override dir", () => {
    useFixture(readRealYaml());
    expect(loadSdrContent().status).toBe("draft");
  });

  it("rejects a posture question without a talk track", () => {
    expect(
      loadBroken((content) => {
        delete content.sdr.talkTracks.backups;
      }),
    ).toThrow(/incomplete sdr\.talkTracks\.backups/);
  });

  it("rejects a talk track without a probe", () => {
    expect(
      loadBroken((content) => {
        content.sdr.talkTracks.phishing = { whyItMatters: "Because" };
      }),
    ).toThrow(/incomplete sdr\.talkTracks\.phishing/);
  });

  it("rejects a segment and tier without a next step", () => {
    expect(
      loadBroken((content) => {
        delete content.sdr.nextSteps.growing.managed;
      }),
    ).toThrow(/incomplete sdr\.nextSteps\.growing\.managed/);
  });

  it("rejects a next step without a service", () => {
    expect(
      loadBroken((content) => {
        content.sdr.nextSteps.solo.exposed = { propose: "Book a call" };
      }),
    ).toThrow(/incomplete sdr\.nextSteps\.solo\.exposed/);
  });

  it("rejects a file without an sdr block", () => {
    expect(
      loadBroken((content) => {
        delete (content as Partial<AssessmentYaml>).sdr;
      }),
    ).toThrow(/Invalid SDR content/);
  });

  it("rejects a copy status other than draft or approved", () => {
    expect(
      loadBroken((content) => {
        content.sdr.status = "final";
      }),
    ).toThrow(/sdr\.status must be draft or approved/);
  });

  it("rejects a talk track for a question that doesn't exist", () => {
    expect(
      loadBroken((content) => {
        content.sdr.talkTracks.retired_question = {
          whyItMatters: "Old",
          probe: "Old",
        };
      }),
    ).toThrow(/talk track for unknown question "retired_question"/);
  });

  it("rejects a discovery question outside opening and closing", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery[0].group = "middle";
      }),
    ).toThrow(/discovery question "why_now" needs group opening or closing/);
  });

  it("rejects a discovery question with an unknown kind", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery[0].kind = "scale";
      }),
    ).toThrow(/discovery question "why_now" needs kind choice or text/);
  });

  it("rejects a choice question with fewer than two choices", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery[1].choices = ["Only one"];
      }),
    ).toThrow(/discovery question "current_it" needs at least 2 choices/);
  });

  it("rejects a choice question with a blank choice", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery[1].choices = ["In-house", ""];
      }),
    ).toThrow(/discovery question "current_it" needs at least 2 choices/);
  });

  it("rejects a free-text question that also lists choices", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery[0].choices = ["Yes", "No"];
      }),
    ).toThrow(/discovery question "why_now" is free text but has choices/);
  });

  it("rejects a discovery question without text", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery[0].text = "";
      }),
    ).toThrow(/discovery question "why_now" has no text/);
  });

  it("rejects a discovery question without an id", () => {
    expect(
      loadBroken((content) => {
        delete content.sdr.discovery[0].id;
      }),
    ).toThrow(/discovery question at position 1 has no id/);
  });

  it("rejects a duplicate discovery question id", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery.push({ ...content.sdr.discovery[0] });
      }),
    ).toThrow(/duplicate discovery question id "why_now"/);
  });

  it("rejects a discovery id that clashes with a posture question", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery[0].id = "backups";
      }),
    ).toThrow(/discovery question "backups" clashes with a posture question/);
  });

  it("rejects a file with no questions in a discovery group", () => {
    expect(
      loadBroken((content) => {
        content.sdr.discovery = content.sdr.discovery.filter(
          (question) => question.group !== "closing",
        );
      }),
    ).toThrow(/no closing discovery questions/);
  });

  it("rejects the public config too when SDR content is broken", () => {
    loadBroken((content) => {
      delete content.sdr.talkTracks.backups;
    });
    expect(() => loadQuizConfig()).toThrow(/Invalid SDR content/);
  });
});
