import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

const BOOLEAN_NAME_PREFIXES = [
  "is",
  "has",
  "can",
  "should",
  "will",
  "did",
  "wants",
];

// API response fields (ok, success), content keys in frontmatter and quiz YAML
// (published, featured, risk), HTML attributes (required, aria-invalid) and
// the SDR discovery wire format (isNotAsked: the "Not asked" answer state)
const EXTERNALLY_NAMED_BOOLEANS =
  "^(ok|success|published|featured|risk|required|aria-invalid|isNotAsked)$";

// Negated boolean names (naming-conventions.mdc: "Never use negative names").
// Tested against the name with its prefix removed, so `isNotValid` arrives as
// `NotValid`. Two shapes, each anchored on a camelCase word:
// - a whole negating word: Not, No, Non, Never, Without. The next letter must
//   start a new word, so Notice, Node, Notes and None pass.
// - a word starting with Un. English has no rule that separates Unverified
//   from Unique, so the real words are listed; add to the list when a new one
//   is flagged.
// In-/Dis- words (isInvalid, isDisabled) are left to review: they mirror HTML
// attributes, and the prefixes open far more real words than negations.
const UN_WORDS_THAT_ARE_NOT_NEGATIONS =
  "ique|it|if|ion|iver|ix|icode|ilateral|ison|der|til|animous|cle";
const NEGATED_BOOLEAN_NAME = `(Not|No|Non|Never|Without)(?=[A-Z0-9]|$)|Un(?!${UN_WORDS_THAT_ARE_NOT_NEGATIONS})[a-z]`;

export default [
  {
    // Stryker's sandbox (a copy of the project) and its report output
    ignores: [".stryker-tmp/", "reports/"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        React: "readonly",
        process: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        Request: "readonly",
        Headers: "readonly",
        Response: "readonly",
        HTMLInputElement: "readonly",
        HTMLFormElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLElement: "readonly",
        HTMLHeadingElement: "readonly",
        MediaQueryListEvent: "readonly",
        MouseEvent: "readonly",
        Node: "readonly",
        AbortController: "readonly",
        URLSearchParams: "readonly",
        alert: "readonly",
        Error: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "warn",
      "@next/next/no-img-element": "off",
    },
    settings: {
      reportUnusedDisableDirectives: false,
    },
  },
  {
    // Boolean names read as a yes/no question (naming-conventions.mdc) and
    // name the positive case. The rule needs type information, which is why this block alone turns on
    // typed linting. Names fixed by a wire format or by HTML are exempt.
    // Tests are skipped: tsconfig excludes them, so they have no type info.
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/tests/**", "**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: [
            "variable",
            "parameter",
            "typeProperty",
            "classProperty",
            "parameterProperty",
          ],
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: BOOLEAN_NAME_PREFIXES,
          custom: { regex: NEGATED_BOOLEAN_NAME, match: false },
          filter: { regex: EXTERNALLY_NAMED_BOOLEANS, match: false },
        },
      ],
    },
  },
  {
    // tsc already reports undefined names, with the real DOM and Node types;
    // typescript-eslint recommends no-undef off for TypeScript
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/tests/**/*.tsx"],
    languageOptions: {
      globals: {
        React: "readonly",
        screen: "readonly",
        global: "readonly",
        process: "readonly",
        window: "readonly",
        document: "readonly",
        HeadersInit: "readonly",
        RequestInit: "readonly",
        NodeJS: "readonly",
        Error: "readonly",
        jest: "readonly",
        browser: "readonly",
        node: "readonly",
        Headers: "readonly",
        Response: "readonly",
        ResponseType: "readonly",
        Request: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
      "no-redeclare": "off",
      "no-undef": "off",
    },
  },
];
