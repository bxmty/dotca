import { getStripe, getServerStripe } from '@/lib/stripe';

// Mock the Stripe constructor from the stripe package
// Must install stripe module before running these tests
const mockStripe = jest.fn();

// Mock dynamic import instead of mocking 'stripe' directly
jest.mock('@/lib/stripe', () => ({
  getStripe: jest.fn().mockReturnValue({}),
  getServerStripe: jest.fn().mockResolvedValue({
    paymentIntents: {
      create: jest
        .fn()
        .mockResolvedValue({ client_secret: 'test_client_secret' }),
    },
  }),
}));

// Mock the loadStripe function from @stripe/stripe-js
const mockLoadStripe = jest.fn();
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: mockLoadStripe,
}));

describe('stripe.ts utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getStripe', () => {
    it('initializes Stripe with the publishable key', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

      // Call getStripe
      getStripe();

      // Verify loadStripe was called with the correct key
      expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123');
    });

    it('only initializes Stripe once for multiple calls', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

      // Call getStripe multiple times
      getStripe();
      getStripe();
      getStripe();

      // loadStripe should only be called once
      expect(mockLoadStripe).toHaveBeenCalledTimes(1);
    });

    it('throws an error when publishable key is not set', () => {
      // Clear the environment variable
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      // Expect getStripe to throw an error
      expect(() => getStripe()).toThrow(
        'Stripe publishable key is not set in environment variables'
      );

      // loadStripe should not be called
      expect(mockLoadStripe).not.toHaveBeenCalled();
    });
  });

  describe('getServerStripe', () => {
    it('initializes server-side Stripe with the secret key', async () => {
      // Set up environment variables
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';

      // Call getServerStripe
      await getServerStripe();

      // Verify Stripe was constructed with the correct parameters
      expect(mockStripe).toHaveBeenCalledWith('sk_test_123', {
        apiVersion: '2023-10-16',
      });
    });

    it('throws an error when secret key is not set', async () => {
      // Clear the environment variable
      delete process.env.STRIPE_SECRET_KEY;

      // Expect getServerStripe to throw an error
      await expect(getServerStripe()).rejects.toThrow(
        'STRIPE_SECRET_KEY is not set in environment variables'
      );

      // Stripe constructor should not be called
      expect(mockStripe).not.toHaveBeenCalled();
    });
  });
});
