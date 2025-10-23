// tests/PlanSelector.test.tsx
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanSelector from '@/app/checkout/PlanSelector';

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('PlanSelector Component', () => {
  const mockPricingPlans = [
    {
      name: 'Basic',
      price: '$99',
      description: 'Basic plan for small businesses',
      features: ['Feature 1', 'Feature 2'],
    },
    {
      name: 'Premium',
      price: '$199',
      description: 'Premium plan with additional features',
      features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
    },
  ];

  const mockOnPlanSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onPlanSelected with null when no plan is in URL', () => {
    const { useSearchParams } = jest.requireMock('next/navigation');

    // Mock URLSearchParams get method
    const mockSearchParams = {
      get: jest.fn().mockReturnValue(null),
    };

    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <PlanSelector
        pricingPlans={mockPricingPlans}
        onPlanSelected={mockOnPlanSelected}
      />
    );

    // Verify that onPlanSelected was called with null
    expect(mockOnPlanSelected).toHaveBeenCalledWith(null);
  });

  it('selects the correct plan when plan name is in URL', () => {
    const { useSearchParams } = jest.requireMock('next/navigation');

    // Mock URLSearchParams get method
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('basic'),
    };

    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <PlanSelector
        pricingPlans={mockPricingPlans}
        onPlanSelected={mockOnPlanSelected}
      />
    );

    // Verify that onPlanSelected was called with the correct plan
    expect(mockOnPlanSelected).toHaveBeenCalledWith(mockPricingPlans[0]);
  });

  it('calls onPlanSelected with null when plan name is not found', () => {
    const { useSearchParams } = jest.requireMock('next/navigation');

    // Mock URLSearchParams get method
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('nonexistent'),
    };

    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <PlanSelector
        pricingPlans={mockPricingPlans}
        onPlanSelected={mockOnPlanSelected}
      />
    );

    // Verify that onPlanSelected was called with null
    expect(mockOnPlanSelected).toHaveBeenCalledWith(null);
  });

  it('calls onPlanSelected with null when plan parameter is not present', () => {
    const { useSearchParams } = jest.requireMock('next/navigation');

    // Mock URLSearchParams get method
    const mockSearchParams = {
      get: jest.fn().mockReturnValue(null),
    };

    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <PlanSelector
        pricingPlans={mockPricingPlans}
        onPlanSelected={mockOnPlanSelected}
      />
    );

    // Verify that onPlanSelected was called with null
    expect(mockOnPlanSelected).toHaveBeenCalledWith(null);
  });

  it('matches case-insensitively when searching for plan', () => {
    const { useSearchParams } = jest.requireMock('next/navigation');

    // Mock URLSearchParams get method - using UPPERCASE to test case insensitivity
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('PREMIUM'),
    };

    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <PlanSelector
        pricingPlans={mockPricingPlans}
        onPlanSelected={mockOnPlanSelected}
      />
    );

    // Verify that onPlanSelected was called with the correct plan despite case difference
    expect(mockOnPlanSelected).toHaveBeenCalledWith(mockPricingPlans[1]);
  });
});
