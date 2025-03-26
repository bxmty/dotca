// tests/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Add custom render method that could include providers, etc.
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Common test data
export const mockPricingPlans = [
  {
    name: 'Basic',
    price: '$99',
    description: 'Basic plan for small businesses',
    features: ['Feature 1', 'Feature 2']
  },
  {
    name: 'Premium',
    price: '$199',
    description: 'Premium plan with additional features',
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']
  },
  {
    name: 'Enterprise',
    price: '$299',
    description: 'Enterprise plan for larger businesses',
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5', 'Feature 6']
  }
];

// Mock Next.js components
// These mocks should be moved to jest.setup.js 
// or used with jest.doMock() inside individual test files

// Example usage for individual tests
export const mockNextComponentsExample = `
  // Import the mocks at the top of your test file
  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
    }),
    useSearchParams: () => ({
      get: jest.fn(),
    }),
  }));

  jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }) => {
      return <a href={href}>{children}</a>;
    }
  }));
  
  jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
      return <img 
        src={props.src} 
        alt={props.alt || ''} 
        width={props.width} 
        height={props.height} 
        className={props.className} 
      />;
    },
  }));
`;

// Helper functions to use inside tests after mocks are set up
export const getMockRouter = () => ({
  push: function() { return () => {}; },
  back: function() { return () => {}; },
  forward: function() { return () => {}; },
});

export const getMockSearchParams = () => ({
  get: function() { return () => {}; },
});

// Reset mocks
export const resetMocks = () => {
  // No-op function for type checking to pass
  // Implementation is handled in jest.setup.js
};

// Mock fetch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockFetch = (mockResponse: Record<string, unknown> = { ok: true }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = () => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      ...mockResponse
    });
};