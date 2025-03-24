// tests/api-contact.test.ts
import { POST } from '@/app/api/contact/route';
import { NextResponse } from 'next/server';

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options }))
  }
}));

// Mock environment variable
const originalEnv = process.env;

describe('Contact API Route', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ) as jest.Mock;
    
    // Setup process.env
    process.env = { ...originalEnv, BREVO_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it('returns 400 if email is missing', async () => {
    // Create a mock request with missing email
    const request = {
      json: jest.fn().mockResolvedValue({
        name: 'Test User',
        phone: '123-456-7890'
        // email is intentionally missing
      })
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 400
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Email is required' },
      { status: 400 }
    );
  });

  it('returns 500 if API key is missing', async () => {
    // Remove API key from environment
    delete process.env.BREVO_API_KEY;

    // Create a mock request
    const request = {
      json: jest.fn().mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        phone: '123-456-7890'
      })
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 500
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  });

  it('successfully submits contact and returns success response', async () => {
    // Create a mock request with all required fields
    const request = {
      json: jest.fn().mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        phone: '123-456-7890'
      })
    };

    await POST(request as unknown as Request);

    // Check if fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/contacts',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': 'test-api-key'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          attributes: {
            FIRSTNAME: 'Test User',
            PHONE: '123-456-7890'
          },
          updateEnabled: false
        })
      }
    );

    // Check if NextResponse.json was called with success message
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
  });

  it('handles API errors properly', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'API error' })
      })
    );

    // Create a mock request
    const request = {
      json: jest.fn().mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        phone: '123-456-7890'
      })
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 500
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  });

  it('handles exceptions during processing', async () => {
    // Mock request.json to throw an error
    const request = {
      json: jest.fn().mockImplementationOnce(() => {
        throw new Error('JSON parsing error');
      })
    };

    await POST(request as unknown as Request);

    // Check if NextResponse.json was called with error message and status 500
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  });
});