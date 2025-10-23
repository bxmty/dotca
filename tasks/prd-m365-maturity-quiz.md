# PRD: M365 Maturity Assessment Quiz Lead Magnet

## Introduction/Overview

This feature implements a lead magnet quiz designed to assess how well companies are leveraging Microsoft 365 (M365). The quiz will be a self-contained assessment tool that evaluates organizational M365 adoption and maturity levels. Users will access it through a direct URL only (no homepage link), complete 10-15 questions, and provide their email address to receive personalized results. All captured email addresses will be sent to the existing Brevo API for marketing follow-up.

The primary goal is to generate qualified leads by offering value through personalized M365 maturity insights while collecting contact information for sales and marketing purposes.

## Goals

- Create an engaging, educational quiz that provides genuine value to users assessing their M365 maturity
- Capture email addresses from qualified prospects interested in M365 optimization
- Achieve a 50% quiz completion rate among visitors
- Seamlessly integrate with existing Brevo API infrastructure
- Provide mobile-responsive experience for all users
- Generate personalized assessment results based on user responses

## User Stories

### Primary User Flow

**As a** IT decision-maker or business leader  
**I want to** take a quick assessment of my company's M365 adoption  
**So that** I can understand areas for improvement and receive personalized recommendations

**As a** marketing professional  
**I want to** capture leads through valuable content  
**So that** I can nurture prospects with relevant M365 solutions

### Secondary Flows

**As a** user completing the quiz  
**I want to** receive my personalized results via email  
**So that** I can review them at my convenience and share with colleagues

**As a** mobile user  
**I want to** complete the quiz on my phone  
**So that** I can assess M365 maturity anytime, anywhere

## Functional Requirements

1. **Quiz Access**: The quiz must be accessible only through a direct URL (no navigation links from homepage)
2. **Question Types**: Support multiple choice questions with single answer selection
3. **Question Count**: Display exactly 16 questions covering 6 functional areas of M365
4. **Email Collection**: Collect email address after quiz completion, before showing results
5. **Personalized Results**: Generate and display customized M365 maturity assessment based on answers
6. **Brevo Integration**: Send captured email addresses to existing Brevo API with same configuration as current implementation
7. **Mobile Responsiveness**: Quiz must work seamlessly on mobile devices
8. **Progress Indicator**: Show current question number and overall progress (e.g., "Question 3 of 16")
9. **Result Categories**: Provide 8 priority module categories (Teams, SharePoint, Power Automate, Planner, Security, Power BI, Foundations, Advanced) with detailed implementation plans and ROI calculations
10. **Email Validation**: Validate email format before submission
11. **Error Handling**: Display clear error messages for API failures or validation issues
12. **Loading States**: Show loading indicators during question transitions and email submission
13. **Privacy Notice**: Include clear privacy statement about email usage
14. **Thank You Page**: Display confirmation message after successful email submission
15. **Result Sharing**: Allow users to share results via email (pre-populated with their assessment)

## Non-Goals (Out of Scope)

- Integration with homepage navigation or menus
- User account creation or login system
- Social media sharing beyond email
- Integration with Microsoft 365 APIs
- Advanced analytics beyond basic completion tracking
- Multi-language support (English only)
- Quiz customization per user type
- Historical result storage or comparison
- Integration with CRM systems beyond Brevo
- Automated follow-up sequences (handled by existing marketing automation)

## Design Considerations

### UI/UX Requirements

- Clean, professional design that reflects Microsoft 365 branding colors
- Single-column layout optimized for mobile devices
- Clear typography with readable fonts (minimum 16px on mobile)
- Consistent spacing and visual hierarchy
- Progress bar showing completion percentage
- Smooth transitions between questions
- Accessible design following WCAG guidelines
- Touch-friendly buttons and form elements

### Visual Elements

- Microsoft 365 themed color scheme (blues, grays, whites)
- Professional imagery related to productivity and collaboration
- Clear icons for different question types
- Visual progress indicators
- Result visualization (charts or progress bars showing maturity levels)

## Technical Considerations

### Existing Integration

- Use existing Brevo API integration patterns and configuration
- Follow current error handling and logging practices
- Maintain consistency with existing email capture forms
- Use same email validation and sanitization logic

### Frontend Requirements

- Responsive design using existing CSS framework
- Form validation using existing validation library
- API calls using existing HTTP client configuration
- State management for quiz progress and answers
- Local storage for quiz state (in case of page refresh)

### Backend Requirements

- Quiz questions stored in configuration/database
- Scoring algorithm for maturity calculation
- Result generation logic
- Email template for assessment delivery
- API endpoint for email submission to Brevo

### Performance Considerations

- Fast loading times (<2 seconds initial load)
- Efficient question transitions
- Minimal bundle size impact
- Optimized for mobile networks

## Success Metrics

- **Primary Metric**: 50% of visitors complete the entire quiz
- **Secondary Metrics**:
  - Email capture rate: >80% of completers provide email
  - Mobile usage: >60% of sessions from mobile devices
  - Bounce rate: <30% (users leaving before question 3)
  - Average completion time: 8-12 minutes
  - Brevo API success rate: >95% email submissions successful

## Open Questions

1. What specific maturity levels should be used (Beginner/Intermediate/Advanced/Expert seems appropriate, but confirm)?
2. Should we include company size questions to personalize results further?
3. What should the email subject line and content structure be for result delivery?
4. Do we need to track quiz analytics beyond completion rates?
5. Should there be a time limit per question or for the entire quiz?
6. What fallback should occur if Brevo API is temporarily unavailable?
7. Should we include a reCAPTCHA or other spam prevention measures?
