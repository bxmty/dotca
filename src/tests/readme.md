# Test Coverage Overview

The project currently has an overall test coverage of 91.8% for statements, 86.36% for branches, 86.79% for functions, and 91.66% for lines. Most components and pages have excellent coverage (100% in many cases), with a few notable exceptions. The main areas that need improvement are in the `app/components` directory (particularly BootstrapClient.tsx at only 13.33% statement coverage) and parts of the legacy pages in the `pages` directory.

The test suite includes 71 total tests across 15 test suites, with 61 passing tests and 10 failing tests. Most failures are related to rendering issues with the BootstrapClient component, issues with testing Next.js components like Link, and DOM-related errors in test utilities and error handling components.

## Test Failures Prioritized

- [ ] **BootstrapClient.test.tsx** - Critical: All tests failing with "baseElement.appendChild is not a function" errors. Component has only 13.33% coverage.

- [ ] **mock-bootstrap-client.test.tsx** - High: Invalid hook call error, unable to test the mocked implementation.

- [ ] **error.test.tsx** - High: Cannot add property 'digest' to error object, breaking error handling tests.

- [ ] **test-utils.test.tsx** - Medium: Issue with mocking Next.js Link component, preventing proper testing of navigation.

- [ ] **legacy-pages.test.tsx** - Medium: Rendering issues with Document component and invalid component types.

- [ ] **API Console Errors** - Low: Multiple console errors in api-contact.test.ts and api-onboarding.test.ts related to error handling, but tests are passing.

- [ ] **SVG Attribute Warnings** - Low: Non-boolean attributes in page.test.tsx causing console errors but tests are passing.

- [ ] **Layout Hydration Warning** - Low: HTML cannot be a child of div causing potential hydration issues in layout.test.tsx, but tests are passing.