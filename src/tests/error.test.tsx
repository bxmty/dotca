// tests/error.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Error from '@/app/error';

// Mock the useEffect hook to capture the callback
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useEffect: jest.fn(callback => callback()),
  };
});

describe('Error Component', () => {
  // Mock console.error to prevent test output pollution
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  it('renders error message and reset button', () => {
    const resetMock = jest.fn();
    const testError = new Error('Test error');

    render(<Error error={testError} reset={resetMock} />);

    // Check if error message is displayed
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();

    // Check if reset button is displayed
    const resetButton = screen.getByRole('button', { name: /Try again/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('logs error to console', () => {
    const resetMock = jest.fn();
    const testError = new Error('Test error');

    render(<Error error={testError} reset={resetMock} />);

    // Check if console.error was called with the error
    expect(console.error).toHaveBeenCalledWith(testError);
  });

  it('calls reset function when button is clicked', () => {
    const resetMock = jest.fn();
    const testError = new Error('Test error');

    render(<Error error={testError} reset={resetMock} />);

    // Click the reset button
    const resetButton = screen.getByRole('button', { name: /Try again/i });
    fireEvent.click(resetButton);

    // Check if reset function was called
    expect(resetMock).toHaveBeenCalled();
  });

  it('handles errors with digest property', () => {
    const resetMock = jest.fn();

    // Use a plain object that satisfies the Error interface with digest property
    const testError = {
      name: 'Error',
      message: 'Test error',
      stack: 'Error: Test error\n    at Object.<anonymous>',
      digest: 'error-digest-123',
      toString: () => 'Error: Test error',
    };

    render(<Error error={testError as Error} reset={resetMock} />);

    // Check if console.error was called with the error including digest
    expect(console.error).toHaveBeenCalledWith(testError);
  });
});
