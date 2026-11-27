export const QUIZ_SEGMENTS = ["solo", "small_team", "growing"] as const;
export type QuizSegment = (typeof QUIZ_SEGMENTS)[number];

/** Risk tiers, ordered worst → best. */
export const RISK_TIERS = [
  "exposed",
  "reactive",
  "managed",
  "resilient",
] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export interface QuizAnswer {
  text: string;
  points: number;
  /** Marks a risk-indicating answer; drives results copy and lead tagging */
  risk?: boolean;
}

export interface QuizQuestion {
  id: string;
  category: string;
  segments: QuizSegment[];
  text: string;
  answers: QuizAnswer[];
}

export interface QuizCategory {
  section: string;
  label: string;
  /** Shown on the results page when a risk answer was picked in this category */
  weakCopy: string;
}

export interface QuizSection {
  label: string;
  blurb?: string;
}

export interface QuizCta {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export interface QuizConfig {
  landing: {
    title: string;
    intro: string;
    timeEstimate: string;
    startLabel: string;
  };
  segments: Record<QuizSegment, { label: string; description: string }>;
  sections: Record<string, QuizSection>;
  sizeQuestion: string;
  tiers: Record<RiskTier, { label: string; headline: string; body: string }>;
  thresholds: Record<
    QuizSegment,
    { reactive: number; managed: number; resilient: number }
  >;
  categories: Record<string, QuizCategory>;
  questions: QuizQuestion[];
  ctas: Record<QuizSegment, Record<RiskTier, QuizCta>>;
}

export interface QuizResult {
  score: number;
  maxScore: number;
  tier: RiskTier;
  /** Categories where a risk-indicating answer was selected */
  riskCategories: string[];
}
