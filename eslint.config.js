import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
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
        MediaQueryListEvent: "readonly",
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
