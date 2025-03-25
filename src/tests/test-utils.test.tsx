// tests/test-utils.test.tsx
import { render as reactRender, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  render as customRender, 
  mockFetch, 
  resetMocks, 
  mockPricingPlans,
  mockNextComponents
} from './test-utils';

// Create a test component for rendering tests
const TestComponent = () => <div data-testid="test-component">Test Content</div>;

describe('Test Utilities', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('customRender', () => {
    it('renders components correctly', () => {
      customRender(<TestComponent />);
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('passes additional options to render', () => {
      const container = document.createElement('div');
      customRender(<TestComponent />, { container });
      
      expect(container.querySelector('[data-testid="test-component"]')).not.toBeNull();
    });
  });

  describe('mockFetch', () => {
    it('mocks fetch with default response', async () => {
      mockFetch();
      
      expect(global.fetch).toBeDefined();
      expect(typeof global.fetch).toBe('function');
      
      // Test the mocked fetch
      const response = await (global.fetch as jest.Mock)();
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toEqual({ ok: true });
    });

    it('mocks fetch with custom response', async () => {
      const customResponse = { success: true, data: { id: 1, name: 'Test' } };
      mockFetch(customResponse);
      
      const response = await (global.fetch as jest.Mock)();
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toEqual(customResponse);
    });

    it('allows overriding ok status', async () => {
      mockFetch({ ok: false, status: 500 });
      
      const response = await (global.fetch as jest.Mock)();
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('resetMocks', () => {
    it('clears all mocks', () => {
      const mockFunction = jest.fn();
      mockFunction('test');
      expect(mockFunction).toHaveBeenCalled();
      
      resetMocks();
      
      expect(mockFunction.mock.calls.length).toBe(0);
    });
  });

  describe('mockPricingPlans', () => {
    it('provides pricing plan test data', () => {
      expect(mockPricingPlans).toBeDefined();
      expect(Array.isArray(mockPricingPlans)).toBe(true);
      expect(mockPricingPlans.length).toBe(3);
      
      // Check structure of the first plan
      const firstPlan = mockPricingPlans[0];
      expect(firstPlan).toHaveProperty('name', 'Basic');
      expect(firstPlan).toHaveProperty('price', '$99');
      expect(firstPlan).toHaveProperty('description', 'Basic plan for small businesses');
      expect(firstPlan).toHaveProperty('features');
      expect(Array.isArray(firstPlan.features)).toBe(true);
      expect(firstPlan.features.length).toBe(2);
      
      // Check Premium plan
      const premiumPlan = mockPricingPlans[2];
      expect(premiumPlan.name).toBe('Enterprise');
      expect(premiumPlan.features.length).toBe(6);
    });
  });

  describe('mockNextComponents', () => {
    beforeEach(() => {
      jest.resetModules();
    });
    
    it('mocks Next.js router', () => {
      // Setup the mock
      mockNextComponents();
      
      // Import the mocked module
      const { useRouter } = jest.requireActual('next/navigation');
      
      // Check if mocked functions are available
      const router = useRouter();
      expect(router.push).toBeDefined();
      expect(typeof router.push).toBe('function');
      
      // Test the mock
      router.push('/test');
      expect(router.push).toHaveBeenCalledWith('/test');
    });
    
    it('mocks Next.js searchParams', () => {
      // Setup the mock
      mockNextComponents();
      
      // Import the mocked module
      const { useSearchParams } = jest.requireActual('next/navigation');
      
      // Check if mocked functions are available
      const searchParams = useSearchParams();
      expect(searchParams.get).toBeDefined();
      expect(typeof searchParams.get).toBe('function');
      
      // Test the mock
      searchParams.get('test');
      expect(searchParams.get).toHaveBeenCalledWith('test');
    });
    
    it('mocks Next.js Link component', () => {
      // Setup the mock
      mockNextComponents();
      
      // Import the mocked component
      const Link = jest.requireActual('next/link').default;
      
      // Render the Link component
      const { container } = reactRender(
        <Link href="/test">Test Link</Link>
      );
      
      // Check if Link was properly mocked
      const link = container.querySelector('a');
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveTextContent('Test Link');
    });
    
    it('mocks Next.js Image component', () => {
      // Setup the mock
      mockNextComponents();
      
      // Import the mocked component
      const Image = jest.requireActual('next/image').default;
      
      // Render the Image component
      const { container } = reactRender(
        <Image 
          src="/test.jpg" 
          alt="Test Image"
          width={100}
          height={100}
        />
      );
      
      // Check if Image was properly mocked
      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img).toHaveAttribute('src', '/test.jpg');
      expect(img).toHaveAttribute('alt', 'Test Image');
      expect(img).toHaveAttribute('width', '100');
      expect(img).toHaveAttribute('height', '100');
    });
  });
});