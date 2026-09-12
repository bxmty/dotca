// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    // Handle module aliases (if you use them in your project)
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  // A Next.js standalone build copies src/ — tests included — into its output
  // directory, and testMatch is unanchored, so those stale duplicates would be
  // collected alongside the real suite. Matches .next/ and suffixed build dirs
  // (.next-local/, .next-verify/) without swallowing a real .nextra/-style dir.
  testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/\\.next(-[^/]+)?/"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!**/node_modules/**",
  ],
  // Ratchet floor, not a target. These numbers are the coverage the suite
  // actually produced (measured, then rounded down), so that `jest --coverage`
  // passes on a healthy suite and fails only on a real regression. Raise them
  // as coverage improves; never lower them to make a failing run pass.
  //
  // The repo's stated target was 65% branches/functions and 70%
  // lines/statements. All four now clear it (#570), so this floor sits above
  // the target rather than below it. Functions has the thinnest margin: an
  // untested route or layout module counts every exported component as an
  // uncovered function while contributing no branches, so a new page added
  // without a test is the most likely way to trip this gate. Cover the new
  // module rather than shaving the floor.
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 66,
      lines: 79,
      statements: 77,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
