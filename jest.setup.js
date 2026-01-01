// jest.setup.js
import "@testing-library/jest-dom";
import React from "react";

// Mock console.error and console.warn to fail tests when they're called
// This helps catch issues that would otherwise be silent
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Mock console methods to make test output cleaner
  console.error = (...args) => {
    // Uncomment to make console.error fail tests
    // if (args[0]?.includes?.('Warning:')) {
    //   throw new Error(`Console error was called: ${args.join(', ')}`);
    // }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    // Uncomment to make console.warn fail tests
    // throw new Error(`Console warn was called: ${args.join(', ')}`);
    originalConsoleWarn(...args);
  };

  console.log = (...args) => {
    // Filter out or allow specific log messages if needed
    originalConsoleLog(...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Add global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  }),
);

// Next.js mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }) => {
    return React.createElement("a", { href }, children);
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    return React.createElement("img", {
      src: props.src,
      alt: props.alt || "",
      width: props.width,
      height: props.height,
      className: props.className,
    });
  },
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
