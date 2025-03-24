// tests/layout.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RootLayout from '@/app/layout';

// Mock the BootstrapClient component
jest.mock('@/app/components/BootstrapClient', () => {
  return function MockBootstrapClient() {
    return <div data-testid="bootstrap-client"></div>;
  };
});

describe('RootLayout Component', () => {
  it('renders children and BootstrapClient', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>
    );
    
    // Check if BootstrapClient is rendered
    expect(screen.getByTestId('bootstrap-client')).toBeInTheDocument();
    
    // Check if children are rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('sets correct HTML attributes', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    
    // Check html attributes
    const html = document.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');
    expect(html).toHaveAttribute('data-bs-theme', 'auto');
  });

  it('includes proper meta tags', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    
    // Check meta viewport tag
    const metaViewport = document.querySelector('meta[name="viewport"]');
    expect(metaViewport).toHaveAttribute('content', 'width=device-width, initial-scale=1');
  });
});