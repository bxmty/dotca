// tests/BootstrapClient.test.tsx
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import BootstrapClient from '@/app/components/BootstrapClient';

// Mock the bootstrap import
jest.mock('bootstrap/dist/js/bootstrap.bundle.min.js', () => ({}));

describe('BootstrapClient Component', () => {
  // Create mocks for DOM methods
  const mockAddClass = jest.fn();
  const mockSetAttribute = jest.fn();
  const mockAddEventListener = jest.fn();
  const mockRemoveEventListener = jest.fn();
  
  // Store original methods to restore later
  let originalMatchMedia;
  
  beforeAll(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia;
    
    // Setup DOM mocks safely - maintain the original object structure
    // but override specific methods
    document.body.classList.add = mockAddClass;
    document.documentElement.setAttribute = mockSetAttribute;
    
    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation((query) => {
      return {
        matches: false, // Default to light mode
        media: query,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      };
    });
  });
  
  afterAll(() => {
    // Restore original matchMedia only
    window.matchMedia = originalMatchMedia;
    
    // We don't need to restore document.body or document.documentElement
    // since we only mocked their methods, not replaced the objects themselves
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders nothing to the DOM', () => {
    const { container } = render(<BootstrapClient />);
    expect(container.firstChild).toBeNull();
  });
  
  it('adds bootstrap-loaded class to body', () => {
    render(<BootstrapClient />);
    expect(mockAddClass).toHaveBeenCalledWith('bootstrap-loaded');
  });
  
  it('sets light theme when user prefers light mode', () => {
    render(<BootstrapClient />);
    expect(mockSetAttribute).toHaveBeenCalledWith('data-bs-theme', 'light');
  });
  
  it('sets dark theme when user prefers dark mode', () => {
    // Override matchMedia to return dark mode preference
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    }));
    
    render(<BootstrapClient />);
    expect(mockSetAttribute).toHaveBeenCalledWith('data-bs-theme', 'dark');
  });
  
  it('adds event listener for theme changes', () => {
    render(<BootstrapClient />);
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
  
  it('removes event listener on unmount', () => {
    // Get the cleanup function returned by useEffect
    const { unmount } = render(<BootstrapClient />);
    unmount();
    
    // Cleanup function should call removeEventListener
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});