import { POST } from '@/app/api/analytics/web-vitals/route';
import { NextRequest } from 'next/server';

// Mock console.log and console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Web Vitals API', () => {
  it('should process valid web vitals data', async () => {
    // Mock data
    const mockWebVitalsData = {
      name: 'LCP',
      id: 'test-id',
      value: 2500,
      rating: 'needs-improvement',
      delta: 2500,
      navigationType: 'navigate',
    };

    // Create a mock request
    const request = new NextRequest(
      'https://example.com/api/analytics/web-vitals',
      {
        method: 'POST',
        body: JSON.stringify(mockWebVitalsData),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Call the API route handler
    const response = await POST(request);
    const responseData = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(responseData).toEqual({ success: true });
  });

  it('should handle invalid data properly', async () => {
    // Create a mock request with invalid JSON
    const request = new NextRequest(
      'https://example.com/api/analytics/web-vitals',
      {
        method: 'POST',
        body: '{invalid: json',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Call the API route handler
    const response = await POST(request);
    const responseData = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(responseData).toHaveProperty('error');
    expect(console.error).toHaveBeenCalled();
  });
});
