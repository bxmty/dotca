import { Question, FunctionalArea, PriorityModule } from '@/types/quiz';

/**
 * Validation utilities for quiz configuration data
 */

/**
 * Validates that all quiz questions have proper structure and data
 */
function validateQuizQuestions(): void {
  const errors: string[] = [];

  QUIZ_QUESTIONS.forEach((question, index) => {
    // Check required fields
    if (!question.id || typeof question.id !== 'string') {
      errors.push(`Question ${index}: Missing or invalid id`);
    }

    if (
      !question.text ||
      typeof question.text !== 'string' ||
      question.text.trim().length === 0
    ) {
      errors.push(
        `Question ${index} (${question.id}): Missing or invalid text`
      );
    }

    if (!question.answers || !Array.isArray(question.answers)) {
      errors.push(
        `Question ${index} (${question.id}): Missing or invalid answers array`
      );
    } else {
      // Validate each answer
      question.answers.forEach((answer, answerIndex) => {
        if (
          !answer.text ||
          typeof answer.text !== 'string' ||
          answer.text.trim().length === 0
        ) {
          errors.push(
            `Question ${index} (${question.id}), Answer ${answerIndex}: Missing or invalid text`
          );
        }

        if (typeof answer.score !== 'number' || answer.score < 0) {
          errors.push(
            `Question ${index} (${question.id}), Answer ${answerIndex}: Invalid score (must be non-negative number)`
          );
        }

        if (
          !answer.priorityModule ||
          !Object.values(PriorityModule).includes(answer.priorityModule)
        ) {
          errors.push(
            `Question ${index} (${question.id}), Answer ${answerIndex}: Invalid or missing priorityModule`
          );
        }
      });

      // Check that there are answers
      if (question.answers.length === 0) {
        errors.push(
          `Question ${index} (${question.id}): Must have at least one answer`
        );
      }
    }

    // Validate functional area
    if (
      !question.functionalArea ||
      !Object.values(FunctionalArea).includes(question.functionalArea)
    ) {
      errors.push(
        `Question ${index} (${question.id}): Invalid or missing functionalArea`
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `Quiz configuration validation failed:\n${errors.join('\n')}`
    );
  }
}

/**
 * Validates quiz configuration settings
 */
function validateQuizConfig(): void {
  const errors: string[] = [];

  // Check total questions matches actual questions
  if (QUIZ_CONFIG.totalQuestions !== QUIZ_QUESTIONS.length) {
    errors.push(
      `QUIZ_CONFIG.totalQuestions (${QUIZ_CONFIG.totalQuestions}) does not match actual questions count (${QUIZ_QUESTIONS.length})`
    );
  }

  // Check questions per area configuration
  const actualCounts: Record<FunctionalArea, number> = {
    [FunctionalArea.COMMUNICATION]: 0,
    [FunctionalArea.COLLABORATION]: 0,
    [FunctionalArea.PRODUCTIVITY]: 0,
    [FunctionalArea.SECURITY]: 0,
    [FunctionalArea.ANALYTICS]: 0,
    [FunctionalArea.CONTEXT]: 0,
  };

  QUIZ_QUESTIONS.forEach(question => {
    actualCounts[question.functionalArea]++;
  });

  Object.entries(QUIZ_CONFIG.questionsPerArea).forEach(([area, expected]) => {
    const actual = actualCounts[area as FunctionalArea] || 0;
    if (actual !== expected) {
      errors.push(
        `Functional area ${area}: Expected ${expected} questions, found ${actual}`
      );
    }
  });

  // Validate maturity thresholds
  const thresholds = QUIZ_CONFIG.maturityThresholds;
  if (
    thresholds.beginner >= thresholds.intermediate ||
    thresholds.intermediate >= thresholds.advanced ||
    thresholds.advanced >= thresholds.expert
  ) {
    errors.push(
      'Maturity thresholds must be in ascending order: beginner < intermediate < advanced < expert'
    );
  }

  if (thresholds.beginner < 0 || thresholds.expert > 100) {
    errors.push('Maturity thresholds must be between 0 and 100');
  }

  // Validate all functional areas have priority mappings
  const allAreas = Object.values(FunctionalArea);
  const mappedAreas = Object.keys(QUIZ_CONFIG.priorityMappings);

  allAreas.forEach(area => {
    if (!mappedAreas.includes(area)) {
      errors.push(`Missing priority mapping for functional area: ${area}`);
    }
  });

  mappedAreas.forEach(area => {
    if (!allAreas.includes(area as FunctionalArea)) {
      errors.push(`Invalid functional area in priority mappings: ${area}`);
    }

    const priorityModule = QUIZ_CONFIG.priorityMappings[area as FunctionalArea];
    if (
      priorityModule &&
      !Object.values(PriorityModule).includes(priorityModule)
    ) {
      errors.push(
        `Invalid priority module mapping for ${area}: ${priorityModule}`
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(`Quiz config validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Validates maximum scores configuration
 */
function validateMaxScores(): void {
  const errors: string[] = [];

  // Calculate expected max scores from questions
  const expectedMaxScores: Record<FunctionalArea, number> = {
    [FunctionalArea.COMMUNICATION]: 0,
    [FunctionalArea.COLLABORATION]: 0,
    [FunctionalArea.PRODUCTIVITY]: 0,
    [FunctionalArea.SECURITY]: 0,
    [FunctionalArea.ANALYTICS]: 0,
    [FunctionalArea.CONTEXT]: 0,
  };

  QUIZ_QUESTIONS.forEach(question => {
    const maxAnswerScore = Math.max(...question.answers.map(a => a.score));
    expectedMaxScores[question.functionalArea] += maxAnswerScore;
  });

  // Compare with configured max scores
  Object.entries(MAX_SCORES).forEach(([area, configuredMax]) => {
    const expectedMax = expectedMaxScores[area as FunctionalArea];
    if (configuredMax !== expectedMax) {
      errors.push(
        `MAX_SCORES for ${area}: Expected ${expectedMax}, configured ${configuredMax}`
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(`Max scores validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Validates that all 8 priority modules are properly implemented
 */
function validatePriorityModules(): void {
  const errors: string[] = [];

  const expectedModules = Object.values(PriorityModule);
  const usedModules = new Set<PriorityModule>();

  // Collect all priority modules used in answers
  QUIZ_QUESTIONS.forEach(question => {
    question.answers.forEach(answer => {
      usedModules.add(answer.priorityModule);
    });
  });

  // Check that all expected modules are used at least once
  expectedModules.forEach(module => {
    if (!usedModules.has(module)) {
      errors.push(`Priority module "${module}" is not used in any answer`);
    }
  });

  // Check that priority mappings cover all functional areas
  Object.values(FunctionalArea).forEach(area => {
    const mappedModule = QUIZ_CONFIG.priorityMappings[area];
    if (!expectedModules.includes(mappedModule)) {
      errors.push(
        `Functional area "${area}" maps to invalid priority module "${mappedModule}"`
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `Priority modules validation failed:\n${errors.join('\n')}`
    );
  }
}

/**
 * Validates quiz content configuration
 */
function validateQuizContent(): void {
  const errors: string[] = [];

  // Validate introduction content
  const intro = QUIZ_CONTENT.introduction;
  if (!intro.headline || intro.headline.trim().length === 0) {
    errors.push('Quiz introduction headline is missing or empty');
  }
  if (!intro.subheadline || intro.subheadline.trim().length === 0) {
    errors.push('Quiz introduction subheadline is missing or empty');
  }
  if (!intro.cta || intro.cta.trim().length === 0) {
    errors.push('Quiz introduction CTA is missing or empty');
  }
  if (!Array.isArray(intro.benefits)) {
    errors.push('Quiz introduction benefits array is missing or empty');
  } else {
    intro.benefits.forEach((benefit, index) => {
      if (!benefit || benefit.trim().length === 0) {
        errors.push(`Quiz introduction benefit ${index} is missing or empty`);
      }
    });
  }

  // Validate lead capture content
  const leadCapture = QUIZ_CONTENT.leadCapture;
  if (!leadCapture.title || leadCapture.title.trim().length === 0) {
    errors.push('Lead capture title is missing or empty');
  }

  // Validate form fields
  const requiredFields = ['firstName', 'companyName', 'email'];
  requiredFields.forEach(field => {
    const fieldConfig =
      leadCapture.fields[field as keyof typeof leadCapture.fields];
    if (!fieldConfig) {
      errors.push(
        `Required field "${field}" is missing from lead capture configuration`
      );
    } else {
      if (!fieldConfig.label || fieldConfig.label.trim().length === 0) {
        errors.push(`Field "${field}" label is missing or empty`);
      }
      // Check if field has placeholder (skip for fields that don't need it)
      if ('placeholder' in fieldConfig) {
        if (
          !fieldConfig.placeholder ||
          fieldConfig.placeholder.trim().length === 0
        ) {
          errors.push(`Field "${field}" placeholder is missing or empty`);
        }
      }
      if (fieldConfig.required !== true) {
        errors.push(`Field "${field}" should be marked as required`);
      }
    }
  });

  // Validate optional fields (phone and newsletter)
  const optionalFields = ['phone', 'newsletter'];
  optionalFields.forEach(field => {
    const fieldConfig =
      leadCapture.fields[field as keyof typeof leadCapture.fields];
    if (!fieldConfig) {
      errors.push(
        `Optional field "${field}" is missing from lead capture configuration`
      );
    } else {
      if (!fieldConfig.label || fieldConfig.label.trim().length === 0) {
        errors.push(`Field "${field}" label is missing or empty`);
      }
      // Phone field should have a placeholder, newsletter (checkbox) doesn't need one
      if (field === 'phone' && 'placeholder' in fieldConfig) {
        if (
          !fieldConfig.placeholder ||
          fieldConfig.placeholder.trim().length === 0
        ) {
          errors.push(`Field "${field}" placeholder is missing or empty`);
        }
      }
    }
  });

  // Validate submit button content
  if (
    !leadCapture.submitButton.default ||
    leadCapture.submitButton.default.trim().length === 0
  ) {
    errors.push('Submit button default text is missing or empty');
  }
  if (
    !leadCapture.submitButton.loading ||
    leadCapture.submitButton.loading.trim().length === 0
  ) {
    errors.push('Submit button loading text is missing or empty');
  }

  // Validate privacy and success messages
  if (
    !leadCapture.privacyNotice ||
    leadCapture.privacyNotice.trim().length === 0
  ) {
    errors.push('Privacy notice is missing or empty');
  }
  if (
    !leadCapture.successMessage ||
    leadCapture.successMessage.trim().length === 0
  ) {
    errors.push('Success message is missing or empty');
  }
  if (
    !leadCapture.errorMessage ||
    leadCapture.errorMessage.trim().length === 0
  ) {
    errors.push('Error message is missing or empty');
  }

  // Validate navigation content
  const nav = QUIZ_CONTENT.navigation;
  const requiredNavKeys = ['startQuiz', 'nextQuestion', 'finishQuiz'];
  requiredNavKeys.forEach(key => {
    if (
      !nav[key as keyof typeof nav] ||
      nav[key as keyof typeof nav].trim().length === 0
    ) {
      errors.push(`Navigation "${key}" text is missing or empty`);
    }
  });

  // Validate completion messages
  const completion = QUIZ_CONTENT.completion;
  const requiredCompletionKeys = [
    'congratulations',
    'resultsComing',
    'emailDelivery',
  ];
  requiredCompletionKeys.forEach(key => {
    if (
      !completion[key as keyof typeof completion] ||
      completion[key as keyof typeof completion].trim().length === 0
    ) {
      errors.push(`Completion "${key}" message is missing or empty`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Quiz content validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Main validation function that runs all validations
 */
export function validateQuizConfiguration(): void {
  try {
    validateQuizQuestions();
    validateQuizConfig();
    validateMaxScores();
    validatePriorityModules();
    validateQuizContent();

    console.log('✅ Quiz configuration validation passed');
  } catch (error) {
    console.error('❌ Quiz configuration validation failed:', error);
    throw error;
  }
}

/**
 * M365 Maturity Assessment Quiz Configuration
 * Contains all 16 questions organized by functional area
 */
export const QUIZ_QUESTIONS: Question[] = [
  // Section 1: Communication (Questions 1-3)
  {
    id: 'q1',
    text: 'How does your team currently use Outlook/Exchange Online?',
    answers: [
      {
        text: 'Just basic email—nothing fancy',
        score: 5,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: 'Email + calendar for meetings',
        score: 10,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: 'Email, calendar, and shared calendars for team coordination',
        score: 15,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Advanced features: rules, categories, shared mailboxes, scheduling assistant',
        score: 20,
        priorityModule: PriorityModule.ADVANCED,
      },
      {
        text: 'We use a different email system entirely',
        score: 0,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
    ],
    functionalArea: FunctionalArea.COMMUNICATION,
  },
  {
    id: 'q2',
    text: 'How does your team communicate throughout the day?',
    answers: [
      {
        text: 'Mostly email and phone calls',
        score: 5,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Email, phone, and text messages',
        score: 8,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'We use Microsoft Teams for some chats',
        score: 15,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Teams is our primary communication hub (chat, calls, meetings)',
        score: 25,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'We use Slack, Zoom, or other tools instead of Teams',
        score: 0,
        priorityModule: PriorityModule.TEAMS,
      },
    ],
    functionalArea: FunctionalArea.COMMUNICATION,
  },
  {
    id: 'q3',
    text: 'How do you handle video conferences?',
    answers: [
      {
        text: "We don't do video meetings",
        score: 5,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'We use Zoom, Google Meet, or other third-party tools',
        score: 8,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'We use Teams meetings but just for basic video calls',
        score: 15,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Teams meetings with recording, backgrounds, and breakout rooms',
        score: 20,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'Teams meetings + Webinars or Live Events for larger audiences',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.COMMUNICATION,
  },

  // Section 2: Collaboration (Questions 4-6)
  {
    id: 'q4',
    text: 'Where does your team store and share files?',
    answers: [
      {
        text: 'Local computers or USB drives',
        score: 0,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'Email attachments',
        score: 5,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'Dropbox, Google Drive, or other cloud storage',
        score: 8,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'OneDrive for personal files',
        score: 15,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'OneDrive + SharePoint for team collaboration',
        score: 20,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Full SharePoint document libraries with version control and permissions',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.COLLABORATION,
  },
  {
    id: 'q5',
    text: 'When multiple people need to work on the same document, what happens?',
    answers: [
      {
        text: 'We email versions back and forth',
        score: 5,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'We save to a shared drive and hope for the best',
        score: 10,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'We use real-time co-authoring in Word/Excel/PowerPoint',
        score: 18,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Co-authoring + comments and @mentions for feedback',
        score: 22,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'Full collaboration with Teams integration, version history, and approval workflows',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.COLLABORATION,
  },
  {
    id: 'q6',
    text: "How organized is your company's file structure?",
    answers: [
      {
        text: "It's chaos—files are everywhere",
        score: 5,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: "We have folders, but they're inconsistent",
        score: 10,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'We have a decent folder structure on a shared drive',
        score: 15,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'Organized SharePoint sites with metadata and search',
        score: 22,
        priorityModule: PriorityModule.ADVANCED,
      },
      {
        text: 'Advanced: content types, managed metadata, retention policies',
        score: 25,
        priorityModule: PriorityModule.SECURITY,
      },
    ],
    functionalArea: FunctionalArea.COLLABORATION,
  },

  // Section 3: Productivity (Questions 7-9)
  {
    id: 'q7',
    text: 'How does your team track tasks and projects?',
    answers: [
      {
        text: 'Sticky notes, notebooks, or memory',
        score: 5,
        priorityModule: PriorityModule.PLANNER,
      },
      {
        text: 'Spreadsheets',
        score: 8,
        priorityModule: PriorityModule.PLANNER,
      },
      {
        text: 'Third-party tools (Asana, Monday.com, Trello, etc.)',
        score: 10,
        priorityModule: PriorityModule.PLANNER,
      },
      {
        text: 'Microsoft To Do or Planner for basic task lists',
        score: 18,
        priorityModule: PriorityModule.PLANNER,
      },
      {
        text: 'Planner integrated with Teams for project management',
        score: 22,
        priorityModule: PriorityModule.ADVANCED,
      },
      {
        text: 'Microsoft Project for advanced project management',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.PRODUCTIVITY,
  },
  {
    id: 'q8',
    text: 'How do you handle repetitive business processes?',
    answers: [
      {
        text: 'Manual work—we just do it by hand every time',
        score: 5,
        priorityModule: PriorityModule.POWER_AUTOMATE,
      },
      {
        text: 'Excel spreadsheets and copy/paste',
        score: 8,
        priorityModule: PriorityModule.POWER_AUTOMATE,
      },
      {
        text: 'We have some documented procedures, but execution is manual',
        score: 12,
        priorityModule: PriorityModule.POWER_AUTOMATE,
      },
      {
        text: 'We use Power Automate for a few simple workflows',
        score: 18,
        priorityModule: PriorityModule.POWER_AUTOMATE,
      },
      {
        text: 'Multiple Power Automate flows automating various processes',
        score: 22,
        priorityModule: PriorityModule.ADVANCED,
      },
      {
        text: 'Power Platform apps (Power Automate + Power Apps) for complex workflows',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.PRODUCTIVITY,
  },
  {
    id: 'q9',
    text: 'How do you collect information from employees or clients?',
    answers: [
      {
        text: 'Paper forms or verbal communication',
        score: 5,
        priorityModule: PriorityModule.PLANNER,
      },
      {
        text: 'Email requests',
        score: 8,
        priorityModule: PriorityModule.PLANNER,
      },
      {
        text: 'Google Forms or third-party survey tools',
        score: 10,
        priorityModule: PriorityModule.PLANNER,
      },
      {
        text: 'Microsoft Forms for basic surveys',
        score: 18,
        priorityModule: PriorityModule.POWER_AUTOMATE,
      },
      {
        text: 'Forms integrated with our systems (automatic data flow)',
        score: 22,
        priorityModule: PriorityModule.ADVANCED,
      },
      {
        text: 'Power Apps for custom data entry applications',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.PRODUCTIVITY,
  },

  // Section 4: Security (Questions 10-12)
  {
    id: 'q10',
    text: 'How does your team handle passwords?',
    answers: [
      {
        text: 'Written down or saved in browsers',
        score: 0,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Reused across multiple accounts',
        score: 3,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Different passwords, but no systematic approach',
        score: 8,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Using a third-party password manager',
        score: 12,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Some use of multi-factor authentication (MFA)',
        score: 18,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'MFA enforced for all users via M365 security policies',
        score: 25,
        priorityModule: PriorityModule.SECURITY,
      },
    ],
    functionalArea: FunctionalArea.SECURITY,
  },
  {
    id: 'q11',
    text: 'How do you protect confidential business data?',
    answers: [
      {
        text: "We don't have a formal approach",
        score: 5,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'We just trust employees to be careful',
        score: 8,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Files are password-protected when needed',
        score: 12,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'We use SharePoint permissions to control access',
        score: 18,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Sensitivity labels (Confidential, Internal, Public, etc.)',
        score: 22,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Full data loss prevention (DLP) policies and encryption',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.SECURITY,
  },
  {
    id: 'q12',
    text: 'How protected is your organization from email threats?',
    answers: [
      {
        text: 'Whatever comes standard with email',
        score: 8,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Basic spam filtering',
        score: 10,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: "We've had phishing or ransomware incidents",
        score: 5,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Advanced threat protection for email',
        score: 18,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'ATP + security awareness training for staff',
        score: 22,
        priorityModule: PriorityModule.SECURITY,
      },
      {
        text: 'Full M365 Defender suite with threat detection and response',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.SECURITY,
  },

  // Section 5: Analytics (Questions 13-14)
  {
    id: 'q13',
    text: 'How do you analyze business data and create reports?',
    answers: [
      {
        text: "We don't really analyze data systematically",
        score: 5,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: 'Excel spreadsheets with manual charts',
        score: 10,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: 'More advanced Excel (pivot tables, formulas)',
        score: 15,
        priorityModule: PriorityModule.POWER_BI,
      },
      {
        text: 'Power BI for some basic dashboards',
        score: 20,
        priorityModule: PriorityModule.POWER_BI,
      },
      {
        text: 'Regular Power BI reports shared across the team',
        score: 22,
        priorityModule: PriorityModule.ADVANCED,
      },
      {
        text: 'Enterprise-wide Power BI with automated data refreshes and insights',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.ANALYTICS,
  },
  {
    id: 'q14',
    text: 'How do leaders access information to make business decisions?',
    answers: [
      {
        text: 'Gut feeling and experience',
        score: 5,
        priorityModule: PriorityModule.POWER_BI,
      },
      {
        text: 'Request reports from team members',
        score: 10,
        priorityModule: PriorityModule.POWER_BI,
      },
      {
        text: 'Review spreadsheets and email updates',
        score: 12,
        priorityModule: PriorityModule.POWER_BI,
      },
      {
        text: 'Access real-time dashboards occasionally',
        score: 18,
        priorityModule: PriorityModule.POWER_BI,
      },
      {
        text: 'Regular review of automated dashboards and KPIs',
        score: 22,
        priorityModule: PriorityModule.ADVANCED,
      },
      {
        text: 'AI-powered insights and predictive analytics',
        score: 25,
        priorityModule: PriorityModule.ADVANCED,
      },
    ],
    functionalArea: FunctionalArea.ANALYTICS,
  },

  // Section 6: Context (Questions 15-16)
  {
    id: 'q15',
    text: 'How many employees does your company have?',
    answers: [
      {
        text: '1-5 employees',
        score: 0,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: '6-15 employees',
        score: 0,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: '16-25 employees',
        score: 0,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: '26-50 employees',
        score: 0,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
      {
        text: '50+ employees',
        score: 0,
        priorityModule: PriorityModule.FOUNDATIONS,
      },
    ],
    functionalArea: FunctionalArea.CONTEXT,
  },
  {
    id: 'q16',
    text: 'What takes up the most unnecessary time for your team?',
    answers: [
      {
        text: 'Finding files and information',
        score: 0,
        priorityModule: PriorityModule.SHAREPOINT,
      },
      {
        text: 'Switching between too many apps',
        score: 0,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Manual data entry and repetitive tasks',
        score: 0,
        priorityModule: PriorityModule.POWER_AUTOMATE,
      },
      {
        text: 'Miscommunication and unclear expectations',
        score: 0,
        priorityModule: PriorityModule.TEAMS,
      },
      {
        text: 'Creating reports and analyzing data',
        score: 0,
        priorityModule: PriorityModule.POWER_BI,
      },
      {
        text: 'Security concerns and IT issues',
        score: 0,
        priorityModule: PriorityModule.SECURITY,
      },
    ],
    functionalArea: FunctionalArea.CONTEXT,
  },
];

/**
 * Quiz configuration constants
 */
export const QUIZ_CONFIG = {
  totalQuestions: QUIZ_QUESTIONS.length,
  questionsPerArea: {
    [FunctionalArea.COMMUNICATION]: 3,
    [FunctionalArea.COLLABORATION]: 3,
    [FunctionalArea.PRODUCTIVITY]: 3,
    [FunctionalArea.SECURITY]: 3,
    [FunctionalArea.ANALYTICS]: 2,
    [FunctionalArea.CONTEXT]: 2,
  },
  maturityThresholds: {
    beginner: 25,
    intermediate: 50,
    advanced: 75,
    expert: 90,
  },
  priorityMappings: {
    [FunctionalArea.COMMUNICATION]: PriorityModule.TEAMS,
    [FunctionalArea.COLLABORATION]: PriorityModule.SHAREPOINT,
    [FunctionalArea.PRODUCTIVITY]: PriorityModule.POWER_AUTOMATE,
    [FunctionalArea.SECURITY]: PriorityModule.SECURITY,
    [FunctionalArea.ANALYTICS]: PriorityModule.POWER_BI,
    [FunctionalArea.CONTEXT]: PriorityModule.FOUNDATIONS,
  },
} as const;

/**
 * Maximum scores for each functional area
 * These are calculated as the sum of maximum scores from each question in the area
 */
export const MAX_SCORES = {
  [FunctionalArea.COMMUNICATION]: 70, // Q1: 20, Q2: 25, Q3: 25 = 70 total
  [FunctionalArea.COLLABORATION]: 75, // 3 questions × 25 max points
  [FunctionalArea.PRODUCTIVITY]: 75, // 3 questions × 25 max points
  [FunctionalArea.SECURITY]: 75, // 3 questions × 25 max points
  [FunctionalArea.ANALYTICS]: 50, // 2 questions × 25 max points
  [FunctionalArea.CONTEXT]: 0, // Context questions don't contribute to scoring
} as const;

/**
 * Quiz introduction and lead capture content configuration
 */
export const QUIZ_CONTENT = {
  // Quiz Introduction Page Content
  introduction: {
    headline: 'Discover Your Microsoft 365 Maturity Level',
    subheadline:
      "Take our 16-question assessment to uncover hidden productivity opportunities and get a customized roadmap to transform your team's Microsoft 365 experience.",
    benefits: [
      'Identify your strongest and weakest M365 functional areas',
      'Get personalized recommendations based on your current usage',
      'Receive actionable implementation plans with time estimates',
      'Calculate potential time savings and ROI improvements',
      'Access expert guidance tailored to your team size and biggest challenges',
    ],
    cta: 'Start Your Free Assessment',
    estimatedTime: '5 minutes',
    totalQuestions: 16,
  },

  // Lead Capture Form Content
  leadCapture: {
    title: 'Get Your Personalized Results',
    subtitle:
      'Enter your details below to receive your comprehensive Microsoft 365 maturity assessment and implementation roadmap.',
    fields: {
      firstName: {
        label: 'First Name',
        placeholder: 'Enter your first name',
        required: true,
      },
      companyName: {
        label: 'Company Name',
        placeholder: 'Enter your company name',
        required: true,
      },
      email: {
        label: 'Email Address',
        placeholder: 'Enter your email address',
        required: true,
        helpText:
          "We'll send your personalized assessment results to this email",
      },
      phone: {
        label: 'Phone Number (Optional)',
        placeholder: '+1 (555) 123-4567',
        required: false,
        helpText: 'For follow-up consultation scheduling',
      },
      newsletter: {
        label:
          'Subscribe to our newsletter for Microsoft 365 tips and best practices',
        required: false,
      },
    },
    submitButton: {
      default: 'Get My Assessment Results',
      loading: 'Generating Your Assessment...',
    },
    privacyNotice:
      'By submitting this form, you agree to receive your assessment results and may receive occasional updates about Microsoft 365 optimization strategies. We respect your privacy and will never share your information with third parties.',
    disclaimer:
      'This assessment is for informational purposes only and does not constitute professional advice.',
    successMessage:
      'Thank you! Your personalized Microsoft 365 maturity assessment is being prepared and will be sent to your email shortly.',
    errorMessage:
      'We encountered an error processing your request. Please try again or contact support.',
  },

  // Quiz Progress and Navigation
  navigation: {
    startQuiz: 'Begin Assessment',
    nextQuestion: 'Next',
    previousQuestion: 'Previous',
    finishQuiz: 'Complete Assessment',
    retakeQuiz: 'Take Assessment Again',
  },

  // Quiz Completion Messages
  completion: {
    congratulations: 'Assessment Complete!',
    resultsComing:
      'Your personalized Microsoft 365 maturity assessment is being generated...',
    emailDelivery: 'Results will be delivered to your email within 2 minutes.',
  },
} as const;

// Validate configuration on module load
validateQuizConfiguration();
