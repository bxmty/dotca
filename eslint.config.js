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
// (published, featured, risk) and HTML attributes (required, aria-invalid)
const EXTERNALLY_NAMED_BOOLEANS =
  "^(ok|success|published|featured|risk|required|aria-invalid)$";

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
    // Boolean names read as a yes/no question (naming-conventions.mdc). The
    // rule needs type information, which is why this block alone turns on
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
