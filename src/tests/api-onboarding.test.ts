// tests/api-onboarding.test.ts
import { POST } from '@/app/api/onboarding/route';
import { NextResponse } from 'next/server';

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe('Onboarding API Route', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('successfully processes onboarding data and returns success response', async () => {
    // Create a mock request with onboarding data
    const mockOnboardingData = {
      companyName: 'Test Company',
      industry: 'Technology',
      employeeCount: '11-50',
      contactName: 'Test User',
      contactEmail: 'test@example.com',
      contactPhone: '123-456-7890',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      currentITProviders: 'Current provider',
      softwareUsed: 'Software 1, Software 2',
      painPoints: 'Some pain points',
      goals: 'Some goals',
    };

    const request = {
      json: jest.fn().mockResolvedValue(mockOnboardingData),
    };

    await POST(request as unknown as Request);

    // Check if request.json was called
    expect(request.json).toHaveBeenCalled();

    // Check if NextResponse.json was called with success message
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Onboarding data received successfully',
    });
  });

  it('handles exceptions during processing', async () => {
    // Mock request.json to throw an error
    const request = {
      json: jest.fn().mockRejectedValueOnce(new Error('JSON parsing error')),
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 500
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        message: 'Failed to process onboarding data',
      },
      { status: 500 }
    );
  });
});
