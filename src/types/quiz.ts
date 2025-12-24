/**
 * TypeScript types for M365 Maturity Assessment Quiz
 */

/**
 * Represents a priority module that users can focus on for improvement
 */
export enum PriorityModule {
  TEAMS = 'Teams',
  SHAREPOINT = 'SharePoint',
  POWER_AUTOMATE = 'Power Automate',
  PLANNER = 'Planner',
  SECURITY = 'Security',
  POWER_BI = 'Power BI',
  FOUNDATIONS = 'Foundations',
  ADVANCED = 'Advanced',
}

/**
 * Represents the six functional areas of M365 that the quiz assesses
 */
export enum FunctionalArea {
  COMMUNICATION = 'Communication',
  COLLABORATION = 'Collaboration',
  PRODUCTIVITY = 'Productivity',
  SECURITY = 'Security',
  ANALYTICS = 'Analytics',
  CONTEXT = 'Context',
}

/**
 * Represents a single answer option for a quiz question
 */
export interface Answer {
  /** The text displayed for this answer option */
  text: string;
  /** The score assigned when this answer is selected */
  score: number;
  /** The priority module this answer maps to for improvement recommendations */
  priorityModule: PriorityModule;
}

/**
 * Represents a single quiz question
 */
export interface Question {
  /** Unique identifier for the question */
  id: string;
  /** The question text displayed to the user */
  text: string;
  /** Array of possible answer options */
  answers: Answer[];
  /** The functional area this question assesses */
  functionalArea: FunctionalArea;
  /** Optional help text or additional context */
  helpText?: string;
}

/**
 * Represents the current state of a user's quiz session
 */
export interface QuizState {
  /** Current question index (0-based) */
  currentQuestionIndex: number;
  /** Array of selected answer indices for each question */
  answers: (number | null)[];
  /** Whether the quiz has been completed */
  isCompleted: boolean;
  /** Timestamp when the quiz was started */
  startedAt: Date;
  /** Timestamp when the quiz was completed (if applicable) */
  completedAt?: Date;
}

/**
 * Represents the scoring results for each functional area
 */
export interface FunctionalAreaScore {
  /** The functional area being scored */
  area: FunctionalArea;
  /** The total score achieved in this area */
  score: number;
  /** The maximum possible score for this area */
  maxScore: number;
  /** Percentage score (0-100) */
  percentage: number;
}

/**
 * Represents personalized recommendations based on quiz results
 */
export interface Recommendation {
  /** The priority module this recommendation focuses on */
  priorityModule: PriorityModule;
  /** Brief title for the recommendation */
  title: string;
  /** Detailed description of the recommendation */
  description: string;
  /** Expected benefits or ROI information */
  benefits: string[];
  /** Implementation steps or action items */
  actionItems: string[];
  /** Estimated time to implement */
  estimatedTime: string;
  /** Expected impact level (High/Medium/Low) */
  impact: 'High' | 'Medium' | 'Low';
}

/**
 * Represents the complete results of a quiz assessment
 */
export interface QuizResults {
  /** Scores for each functional area */
  functionalAreaScores: FunctionalAreaScore[];
  /** The primary priority module for improvement (lowest scoring area) */
  primaryPriorityModule: PriorityModule;
  /** Overall maturity score (0-100) */
  overallScore: number;
  /** Maturity level classification */
  maturityLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  /** Personalized recommendations based on answers */
  recommendations: Recommendation[];
  /** User's answers for reference */
  answers: number[];
  /** Additional context questions (team size, biggest time drain, etc.) */
  contextData?: {
    teamSize?: string;
    biggestTimeDrain?: string;
    industry?: string;
  };
}

/**
 * Configuration for quiz display and behavior
 */
export interface QuizConfig {
  /** Total number of questions in the quiz */
  totalQuestions: number;
  /** Questions per functional area */
  questionsPerArea: Record<FunctionalArea, number>;
  /** Scoring thresholds for maturity levels */
  maturityThresholds: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  /** Priority module mappings based on functional area performance */
  priorityMappings: Record<FunctionalArea, PriorityModule>;
}
