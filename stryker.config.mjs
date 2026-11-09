// Stryker mutation testing (report-only). Run with `npm run test:mutation`.
// Equivalent mutants: suppress inline with
// `// Stryker disable next-line <Mutator>: <reason>`. Do not add whole-file
// exclusions to `mutate` to raise the score.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "jest",
  // Reuse the suite CI runs (next/jest transform + module mapping).
  jest: { configFile: "jest.config.cjs" },
  // perTest needs the Stryker env wrapper; files that pick their own env use
  // `@jest-environment @stryker-mutator/jest-runner/jest-env/node`.
  coverageAnalysis: "perTest",
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  // Logic and API code only. UI, OG-image rendering, font loading, the
  // colour-scheme hook, Sentry verification routes, type modules, and tests
  // are out of scope.
  mutate: [
    "src/lib/**/*.{ts,tsx}",
    "src/app/api/**/route.ts",
    "!src/lib/og.tsx",
    "!src/lib/fonts.ts",
    "!src/lib/useColorScheme.ts",
    "!src/app/api/sentry-example-api/**",
    // Type module: interfaces plus the literal tuples they derive from.
    // sdrTypes.ts stays in: it holds getDiscoveryQuestions and length limits.
    "!src/lib/security-assessment/quizTypes.ts",
    "!**/*.d.ts",
    "!**/*.{test,spec}.{ts,tsx}",
  ],
  // Keep the sandbox small: build output, worktrees, and infra aren't needed.
  ignorePatterns: [
    ".next-*",
    ".claude",
    "coverage",
    "test-results",
    "reports",
    "terraform",
    "ansible",
    "backups",
  ],
  reporters: ["html", "clear-text", "json", "progress"],
  // Report-only: no `break`, and no `high`/`low` either. Spec #735 defers the
  // colour-band and break policy until a baseline run sets them.
  thresholds: { break: null },
};

export default config;
