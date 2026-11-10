// Stryker mutation testing (report-only). Run with `just mutation` (tmux,
// report archived per commit) or `npm run test:mutation`.
//
// Suppressions. This header is the single source for the rules;
// src/tests/stryker-suppressions.test.ts enforces the format.
// - Format: `// Stryker disable next-line <Mutator>[,<Mutator>]: <reason>`.
//   No block-level `disable`/`restore`, no `disable all`.
// - Equivalent mutants only: the reason says why no test could tell the
//   mutant from the original. Kill a mutant a test can catch; delete dead
//   code rather than annotate it.
// - One mutant per suppression. `next-line <Mutator>` silences every mutant
//   of that mutator on the line, so when the reason covers only one of them,
//   split the expression across lines (or hoist a constant) until the
//   suppressed line holds just that mutant.
// - Do not add whole-file exclusions to `mutate` to raise the score.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "jest",
  // Reuse the suite CI runs (next/jest transform + module mapping).
  jest: { configFile: "jest.config.cjs" },
  // perTest needs the Stryker env wrapper; files that pick their own env use
  // `@jest-environment @stryker-mutator/jest-runner/jest-env/node`.
  coverageAnalysis: "perTest",
  checkers: ["typescript"],
  // Split between test runners and type-checkers (2 + 2). Stryker's default
  // (cores - 1 runners plus as many checkers) exhausted a 15 GiB machine; 4
  // also matches ubuntu-latest's 4 vCPU. 3 leaves a single test runner.
  concurrency: 4,
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
    // UI/copy modules, out of scope per spec #735 story 3 (not excluded to
    // raise the score): Stripe Elements colour tokens, hero SVG contour
    // geometry, and a lead-magnet label string.
    "!src/lib/stripeAppearance.ts",
    "!src/lib/contours.ts",
    "!src/lib/lead-magnet-labels.ts",
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
