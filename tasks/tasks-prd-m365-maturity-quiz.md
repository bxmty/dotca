## Relevant Files

- `src/app/quiz/page.tsx` - Main quiz page component
- `src/app/quiz/page.test.tsx` - Unit tests for quiz page
- `src/app/api/quiz/route.ts` - API endpoint for email submission to Brevo
- `src/app/api/quiz/route.test.ts` - Unit tests for quiz API endpoint
- `src/app/components/QuizQuestion.tsx` - Component for displaying individual questions
- `src/app/components/QuizQuestion.test.tsx` - Unit tests for quiz question component
- `src/app/components/QuizProgress.tsx` - Component for progress indicator
- `src/app/components/QuizProgress.test.tsx` - Unit tests for progress component
- `src/app/components/QuizResults.tsx` - Component for displaying assessment results
- `src/app/components/QuizResults.test.tsx` - Unit tests for results component
- `src/lib/quiz-config.ts` - Quiz questions and configuration data
- `src/lib/quiz-scoring.ts` - Scoring algorithm and result generation logic
- `src/lib/quiz-scoring.test.ts` - Unit tests for scoring logic
- `src/types/quiz.ts` - TypeScript types for quiz data structures

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `QuizQuestion.tsx` and `QuizQuestion.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Create quiz data structure and configuration
  - [x] 1.1 Define TypeScript types for quiz data structures (Question, Answer, QuizState, Results, PriorityModule)
  - [x] 1.2 Create quiz questions configuration with 16 questions covering 6 M365 functional areas (Communication, Collaboration, Productivity, Security, Analytics, Context)
  - [x] 1.3 Implement detailed scoring algorithm with 6 functional area scores and priority module assignment based on lowest scoring area
  - [x] 1.4 Add validation for quiz configuration data and implement the 8 result category mappings
  - [x] 1.5 Create quiz introduction content and lead capture form copy
- [ ] 2.0 Build quiz UI components and user flow
  - [x] 2.1 Create main quiz page component with route `/quiz` (direct URL access only)
  - [x] 2.2 Build QuizQuestion component supporting multiple choice questions (single answer only, as per quiz design)
  - [x] 2.3 Implement QuizProgress component showing "Question X of 16" format
  - [x] 2.4 Create quiz introduction page with headline, subheadline, and "What You'll Discover" benefits
  - [x] 2.5 Create email collection form component with First Name, Company Name, Email, Phone (optional), and newsletter checkbox
  - [x] 2.6 Add loading states and smooth transitions between questions
  - [x] 2.7 Implement mobile-responsive design with Microsoft 365 branding (blues, grays, whites)
  - [x] 2.8 Add local storage for quiz state persistence (page refresh protection)
- [ ] 3.0 Implement API endpoint for email submission
  - [ ] 3.1 Create `/api/quiz` route following existing Brevo integration pattern
  - [ ] 3.2 Implement email validation and submission logic using existing Brevo API
  - [ ] 3.3 Add quiz completion data handling (all 16 answers, functional area scores, priority module, team size, biggest time drain)
  - [ ] 3.4 Configure appropriate Brevo list ID for quiz leads (use list ID 10 for waitlist or create new quiz-specific list)
  - [ ] 3.5 Implement error handling and user-friendly error messages
  - [ ] 3.6 Add rate limiting and spam prevention measures
- [ ] 4.0 Create results generation and display system
  - [ ] 4.1 Build QuizResults component with 8 different result categories based on priority module assignment
  - [ ] 4.2 Implement personalized result content with specific recommendations, ROI calculations, and implementation plans
  - [ ] 4.3 Create dynamic content generation based on quiz answers (team size, biggest time drain, specific scores)
  - [ ] 4.4 Add result sharing functionality via email with pre-populated assessment (integrate with email client)
  - [ ] 4.5 Implement thank you page with confirmation message and next steps
  - [ ] 4.6 Add accessibility features (WCAG compliance) and keyboard navigation
  - [ ] 4.7 Create email template for result delivery with subject line options and personalized content
