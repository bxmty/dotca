import {
  QuizResults,
  FunctionalArea,
  FunctionalAreaScore,
  PriorityModule,
  QuizConfig,
  Question,
} from '@/types/quiz';
import { QUIZ_CONFIG, MAX_SCORES, QUIZ_QUESTIONS } from './quiz-config';

/**
 * Calculates the functional area scores from quiz answers
 */
export function calculateFunctionalAreaScores(
  answers: number[]
): FunctionalAreaScore[] {
  const scores: Record<FunctionalArea, number> = {
    [FunctionalArea.COMMUNICATION]: 0,
    [FunctionalArea.COLLABORATION]: 0,
    [FunctionalArea.PRODUCTIVITY]: 0,
    [FunctionalArea.SECURITY]: 0,
    [FunctionalArea.ANALYTICS]: 0,
    [FunctionalArea.CONTEXT]: 0,
  };

  // Calculate raw scores for each functional area
  answers.forEach((answerIndex, questionIndex) => {
    if (answerIndex >= 0 && questionIndex < QUIZ_QUESTIONS.length) {
      const question = QUIZ_QUESTIONS[questionIndex];
      const answer = question.answers[answerIndex];

      if (answer) {
        scores[question.functionalArea] += answer.score;
      }
    }
  });

  // Convert to FunctionalAreaScore objects with percentages
  return Object.entries(scores).map(([area, score]) => ({
    area: area as FunctionalArea,
    score,
    maxScore: MAX_SCORES[area as FunctionalArea],
    percentage:
      MAX_SCORES[area as FunctionalArea] > 0
        ? Math.round((score / MAX_SCORES[area as FunctionalArea]) * 100)
        : 0,
  }));
}

/**
 * Determines the overall maturity level based on average functional area scores
 */
export function calculateMaturityLevel(
  functionalAreaScores: FunctionalAreaScore[]
): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
  // Calculate average percentage across all functional areas (excluding Context)
  const scoresToAverage = functionalAreaScores.filter(
    score => score.area !== FunctionalArea.CONTEXT && score.maxScore > 0
  );

  if (scoresToAverage.length === 0) return 'Beginner';

  const averagePercentage =
    scoresToAverage.reduce((sum, score) => sum + score.percentage, 0) /
    scoresToAverage.length;

  const { maturityThresholds } = QUIZ_CONFIG;

  if (averagePercentage >= maturityThresholds.expert) return 'Expert';
  if (averagePercentage >= maturityThresholds.advanced) return 'Advanced';
  if (averagePercentage >= maturityThresholds.intermediate)
    return 'Intermediate';
  return 'Beginner';
}

/**
 * Determines the primary priority module based on the lowest scoring functional area
 */
export function determinePrimaryPriorityModule(
  functionalAreaScores: FunctionalAreaScore[]
): PriorityModule {
  // Find the functional area with the lowest percentage (excluding Context)
  const scoresToCompare = functionalAreaScores.filter(
    score => score.area !== FunctionalArea.CONTEXT && score.maxScore > 0
  );

  if (scoresToCompare.length === 0) return PriorityModule.FOUNDATIONS;

  const lowestScore = scoresToCompare.reduce((lowest, current) =>
    current.percentage < lowest.percentage ? current : lowest
  );

  // Map functional area to priority module
  return QUIZ_CONFIG.priorityMappings[lowestScore.area];
}

/**
 * Calculates the overall quiz score (0-100) based on functional area averages
 */
export function calculateOverallScore(
  functionalAreaScores: FunctionalAreaScore[]
): number {
  const scoresToAverage = functionalAreaScores.filter(
    score => score.area !== FunctionalArea.CONTEXT && score.maxScore > 0
  );

  if (scoresToAverage.length === 0) return 0;

  const averagePercentage =
    scoresToAverage.reduce((sum, score) => sum + score.percentage, 0) /
    scoresToAverage.length;

  return Math.round(averagePercentage);
}

/**
 * Extracts context data from quiz answers for personalization
 */
export function extractContextData(answers: number[]): {
  teamSize?: string;
  biggestTimeDrain?: string;
} {
  const contextData: { teamSize?: string; biggestTimeDrain?: string } = {};

  // Question 15: Team Size (index 14)
  if (answers[14] !== undefined && answers[14] >= 0) {
    const teamSizeOptions = [
      '1-5 employees',
      '6-15 employees',
      '16-25 employees',
      '26-50 employees',
      '50+ employees',
    ];
    contextData.teamSize = teamSizeOptions[answers[14]];
  }

  // Question 16: Biggest Time Drain (index 15)
  if (answers[15] !== undefined && answers[15] >= 0) {
    const timeDrainOptions = [
      'Finding files and information',
      'Switching between too many apps',
      'Manual data entry and repetitive tasks',
      'Miscommunication and unclear expectations',
      'Creating reports and analyzing data',
      'Security concerns and IT issues',
    ];
    contextData.biggestTimeDrain = timeDrainOptions[answers[15]];
  }

  return contextData;
}

/**
 * Generates personalized recommendations based on quiz results and context
 */
export function generateRecommendations(
  primaryPriorityModule: PriorityModule,
  functionalAreaScores: FunctionalAreaScore[],
  contextData: { teamSize?: string; biggestTimeDrain?: string }
): import('@/types/quiz').Recommendation[] {
  const recommendations: import('@/types/quiz').Recommendation[] = [];

  // Primary recommendation based on priority module
  const primaryRecommendation = getPrimaryRecommendation(
    primaryPriorityModule,
    contextData
  );
  if (primaryRecommendation) {
    recommendations.push(primaryRecommendation);
  }

  // Secondary recommendations for other low-scoring areas
  const lowScoringAreas = functionalAreaScores
    .filter(
      score => score.percentage < 60 && score.area !== FunctionalArea.CONTEXT
    )
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 2); // Top 2 additional areas

  lowScoringAreas.forEach(area => {
    // Find the functional area that maps to the primary priority module
    const primaryArea = Object.entries(QUIZ_CONFIG.priorityMappings).find(
      ([_, module]) => module === primaryPriorityModule
    )?.[0] as FunctionalArea;

    if (area.area !== primaryArea) {
      const secondaryRec = getSecondaryRecommendation(area.area, contextData);
      if (secondaryRec) {
        recommendations.push(secondaryRec);
      }
    }
  });

  return recommendations;
}

/**
 * Gets the primary recommendation based on priority module
 */
function getPrimaryRecommendation(
  priorityModule: PriorityModule,
  contextData: { teamSize?: string; biggestTimeDrain?: string }
): import('@/types/quiz').Recommendation | null {
  const teamSize = contextData.teamSize || 'your team';
  const timeDrain = contextData.biggestTimeDrain;

  switch (priorityModule) {
    case PriorityModule.TEAMS:
      return {
        priorityModule: PriorityModule.TEAMS,
        title: 'Transform Team Communication with Microsoft Teams',
        description: `You're losing valuable time to scattered communication. Microsoft Teams can centralize everything and save ${teamSize === '1-5 employees' ? '2-3' : teamSize === '6-15 employees' ? '3-4' : '4-6'} hours per employee per week.`,
        benefits: [
          'Persistent chat keeps conversations organized by topic',
          'One-click video calls with recording and transcription',
          'File sharing without leaving the conversation',
          '@mentions get attention without email overload',
          'Mobile access keeps everyone connected',
        ],
        actionItems: [
          'Create your first Team channel for your most active project',
          'Move one recurring meeting to Teams this week',
          'Enable presence indicators so people know availability',
          'Set up core Teams structure (General, Projects, Departments)',
        ],
        estimatedTime: '2-4 weeks',
        impact: 'High',
      };

    case PriorityModule.SHAREPOINT:
      return {
        priorityModule: PriorityModule.SHAREPOINT,
        title: 'Organize & Secure Your Files with SharePoint & OneDrive',
        description: `Your team is wasting time hunting for files. SharePoint and OneDrive can create order from chaos and save ${teamSize === '1-5 employees' ? '1-2' : teamSize === '6-15 employees' ? '2-3' : '3-4'} hours per employee per week.`,
        benefits: [
          'Single source of truth - everyone accesses current versions',
          'Real-time co-authoring eliminates version conflicts',
          'Powerful search finds any file in seconds',
          'Version history restores previous versions',
          'Secure external sharing for client collaboration',
        ],
        actionItems: [
          'Set up OneDrive sync for automatic cloud backup',
          'Create one SharePoint site for your most important project',
          'Enable file co-authoring for your team',
          'Migrate critical files from shared drives',
        ],
        estimatedTime: '2-3 weeks',
        impact: 'High',
      };

    case PriorityModule.POWER_AUTOMATE:
      return {
        priorityModule: PriorityModule.POWER_AUTOMATE,
        title: 'Eliminate Repetitive Work with Power Automate',
        description: `Your team is doing too much manual work. Power Automate can give you ${teamSize === '1-5 employees' ? '3-5' : teamSize === '6-15 employees' ? '5-8' : '8-12'} hours back every week through automation.`,
        benefits: [
          'Automated workflows trigger actions automatically',
          'Approvals route requests without email chains',
          'Forms feed directly into your systems',
          'Notifications keep you informed without checking manually',
          'Integration connects M365 apps with other tools',
        ],
        actionItems: [
          'Identify your top 3 repetitive processes',
          'Create your first simple workflow automation',
          'Set up automated approval processes',
          'Build forms that feed directly into spreadsheets/databases',
        ],
        estimatedTime: '3-4 weeks',
        impact: 'High',
      };

    case PriorityModule.SECURITY:
      return {
        priorityModule: PriorityModule.SECURITY,
        title: 'Strengthen Your Security Posture',
        description:
          'Your organization needs better protection from cyber threats. Implementing proper security measures now prevents costly breaches later.',
        benefits: [
          'Multi-factor authentication protects all accounts',
          'Advanced threat protection blocks phishing and malware',
          'Data loss prevention prevents accidental data leaks',
          'Compliance tools ensure regulatory adherence',
          'Security awareness training protects your biggest vulnerability',
        ],
        actionItems: [
          'Enable multi-factor authentication for all users',
          'Set up basic security policies and alerts',
          'Implement sensitivity labels for confidential data',
          'Schedule security awareness training for staff',
        ],
        estimatedTime: '2-3 weeks',
        impact: 'High',
      };

    case PriorityModule.POWER_BI:
      return {
        priorityModule: PriorityModule.POWER_BI,
        title: 'Unlock Business Insights with Power BI',
        description: `Transform your data into actionable insights. Power BI can save ${teamSize === '1-5 employees' ? '2-4' : teamSize === '6-15 employees' ? '4-6' : '6-10'} hours per week on reporting.`,
        benefits: [
          'Interactive dashboards replace static reports',
          'Real-time data updates keep insights current',
          'Self-service analytics empowers your team',
          'AI-powered insights surface hidden patterns',
          'Mobile access to KPIs anywhere, anytime',
        ],
        actionItems: [
          'Connect your primary data sources to Power BI',
          'Create your first interactive dashboard',
          'Set up automated data refresh schedules',
          'Share reports with relevant team members',
        ],
        estimatedTime: '3-4 weeks',
        impact: 'High',
      };

    case PriorityModule.PLANNER:
      return {
        priorityModule: PriorityModule.PLANNER,
        title: 'Streamline Task Management with Microsoft Planner',
        description: `Your team needs better task coordination. Microsoft Planner can organize work, track progress, and improve accountability, saving ${teamSize === '1-5 employees' ? '1-2' : teamSize === '6-15 employees' ? '2-3' : '3-5'} hours per employee per week.`,
        benefits: [
          'Visual task boards for easy project tracking',
          'Team assignments and due dates keep everyone accountable',
          'Integration with Teams, Outlook, and other M365 apps',
          'Progress tracking with charts and reports',
          'Mobile access for task management on the go',
        ],
        actionItems: [
          'Create your first Planner board for current projects',
          'Set up buckets and labels for task organization',
          'Assign team members and set due dates',
          'Integrate Planner with your Teams channels',
          'Establish weekly planning rituals with your team',
        ],
        estimatedTime: '1-2 weeks',
        impact: 'Medium',
      };

    case PriorityModule.ADVANCED:
      return {
        priorityModule: PriorityModule.ADVANCED,
        title: 'Maximize Your M365 Investment with Advanced Features',
        description: `You're ready for advanced M365 features. These enterprise-level capabilities can significantly boost productivity and save ${teamSize === '1-5 employees' ? '4-6' : teamSize === '6-15 employees' ? '6-9' : '9-12'} hours per employee per week.`,
        benefits: [
          'Advanced automation and AI-powered insights',
          'Enterprise-grade security and compliance',
          'Custom applications tailored to your business',
          'Full integration across all Microsoft services',
          'Scalable solutions that grow with your business',
        ],
        actionItems: [
          'Implement advanced security policies and compliance features',
          'Set up Power Platform for custom business applications',
          'Configure advanced analytics and reporting',
          'Establish governance for content and data management',
          'Train team on advanced collaboration features',
        ],
        estimatedTime: '4-6 weeks',
        impact: 'High',
      };

    default:
      return {
        priorityModule: PriorityModule.FOUNDATIONS,
        title: 'Build Strong M365 Foundations',
        description:
          'Start with the fundamentals to maximize your M365 investment and create a solid base for advanced features.',
        benefits: [
          'Proper setup ensures all features work correctly',
          'Consistent configuration across your organization',
          'User adoption increases as features become familiar',
          'Security and compliance built into your foundation',
        ],
        actionItems: [
          'Audit current M365 license usage and assignments',
          'Set up proper user groups and permissions',
          'Configure basic security policies',
          'Establish naming conventions and organizational structure',
        ],
        estimatedTime: '1-2 weeks',
        impact: 'Medium',
      };
  }
}

/**
 * Gets secondary recommendations for additional improvement areas
 */
function getSecondaryRecommendation(
  area: FunctionalArea,
  contextData: { teamSize?: string; biggestTimeDrain?: string }
): import('@/types/quiz').Recommendation | null {
  switch (area) {
    case FunctionalArea.COMMUNICATION:
      return {
        priorityModule: PriorityModule.TEAMS,
        title: 'Improve Communication Efficiency',
        description:
          'Streamline team communication to reduce misunderstandings and improve productivity.',
        benefits: [
          'Faster information sharing',
          'Better meeting coordination',
          'Reduced email overload',
        ],
        actionItems: [
          'Adopt Teams for daily communication',
          'Set up meeting templates',
          'Create communication guidelines',
        ],
        estimatedTime: '2 weeks',
        impact: 'Medium',
      };

    case FunctionalArea.COLLABORATION:
      return {
        priorityModule: PriorityModule.SHAREPOINT,
        title: 'Enhance File Collaboration',
        description:
          'Improve how your team works together on documents and files.',
        benefits: [
          'Version control eliminates conflicts',
          'Faster file access',
          'Better organization',
        ],
        actionItems: [
          'Implement co-authoring practices',
          'Set up file organization',
          'Train on sharing permissions',
        ],
        estimatedTime: '2 weeks',
        impact: 'Medium',
      };

    case FunctionalArea.PRODUCTIVITY:
      return {
        priorityModule: PriorityModule.POWER_AUTOMATE,
        title: 'Automate Routine Tasks',
        description: 'Reduce manual work through simple automation.',
        benefits: [
          'Free up time for strategic work',
          'Reduce errors',
          'Consistent processes',
        ],
        actionItems: [
          'Identify repetitive tasks',
          'Create basic workflows',
          'Set up automated notifications',
        ],
        estimatedTime: '2-3 weeks',
        impact: 'Medium',
      };

    case FunctionalArea.SECURITY:
      return {
        priorityModule: PriorityModule.SECURITY,
        title: 'Strengthen Data Protection',
        description:
          'Better protect your business data and comply with regulations.',
        benefits: [
          'Reduced risk of data breaches',
          'Regulatory compliance',
          'Peace of mind',
        ],
        actionItems: [
          'Enable MFA everywhere',
          'Set up data classification',
          'Review sharing practices',
        ],
        estimatedTime: '2 weeks',
        impact: 'Medium',
      };

    case FunctionalArea.ANALYTICS:
      return {
        priorityModule: PriorityModule.POWER_BI,
        title: 'Improve Data Analysis',
        description: 'Make better decisions with data-driven insights.',
        benefits: [
          'Better business decisions',
          'Identify trends and opportunities',
          'Reduce reporting time',
        ],
        actionItems: [
          'Connect key data sources',
          'Create basic reports',
          'Share insights with team',
        ],
        estimatedTime: '3 weeks',
        impact: 'Medium',
      };

    default:
      return null;
  }
}

/**
 * Main function to calculate complete quiz results
 */
export function calculateQuizResults(answers: number[]): QuizResults {
  // Calculate functional area scores
  const functionalAreaScores = calculateFunctionalAreaScores(answers);

  // Determine overall metrics
  const overallScore = calculateOverallScore(functionalAreaScores);
  const maturityLevel = calculateMaturityLevel(functionalAreaScores);
  const primaryPriorityModule =
    determinePrimaryPriorityModule(functionalAreaScores);

  // Extract context data
  const contextData = extractContextData(answers);

  // Generate recommendations
  const recommendations = generateRecommendations(
    primaryPriorityModule,
    functionalAreaScores,
    contextData
  );

  return {
    functionalAreaScores,
    primaryPriorityModule,
    overallScore,
    maturityLevel,
    recommendations,
    answers,
    contextData,
  };
}
