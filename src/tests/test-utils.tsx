// tests/test-utils.tsx
import React, { ReactElement } from 'react';
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
export const mockNextComponents = () => {
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
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    }
  }));

  jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <img {...props} />;
    },
  }));
};

// Reset mocks
export const resetMocks = () => {
  jest.clearAllMocks();
};

// Mock fetch
export const mockFetch = (mockResponse: any = { ok: true }) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      ...mockResponse
    })
  ) as jest.Mock;
};