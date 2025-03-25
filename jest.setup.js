// jest.setup.js
import '@testing-library/jest-dom';

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
  })
);

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});