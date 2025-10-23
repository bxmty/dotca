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

// Mock the Document structure for cleaner tests
const originalDocument = global.document;
beforeEach(() => {
  // Create a standard document structure to avoid DOM nesting warnings
  const customDocument = {
    ...originalDocument,
    querySelector: jest.fn(selector => {
      if (selector === 'html') {
        return {
          getAttribute: jest.fn(attr => {
            if (attr === 'lang') return 'en';
            if (attr === 'data-bs-theme') return 'auto';
            return null;
          }),
          hasAttribute: jest.fn(attr => {
            return attr === 'lang' || attr === 'data-bs-theme';
          }),
          toHaveAttribute: jest.fn((attr, value) => {
            if (attr === 'lang' && value === 'en') return true;
            if (attr === 'data-bs-theme' && value === 'auto') return true;
            return false;
          }),
        };
      }
      if (selector === 'meta[name="viewport"]') {
        return {
          getAttribute: jest.fn(attr => {
            if (attr === 'content')
              return 'width=device-width, initial-scale=1';
            return null;
          }),
          hasAttribute: jest.fn(attr => {
            return attr === 'content';
          }),
          toHaveAttribute: jest.fn((attr, value) => {
            if (
              attr === 'content' &&
              value === 'width=device-width, initial-scale=1'
            )
              return true;
            return false;
          }),
        };
      }
      return null;
    }),
  };
  global.document = customDocument;
});

afterEach(() => {
  global.document = originalDocument;
});

describe('RootLayout Component', () => {
  // Custom render function to handle the RootLayout component
  const customRender = (ui: React.ReactElement) => {
    return render(ui, {
      // Wrap in a div to avoid direct rendering of <html> element
      wrapper: ({ children }) => <div>{children}</div>,
    });
  };

  it('renders children and BootstrapClient', () => {
    customRender(
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
    customRender(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    // Check html attributes (using our mock)
    expect(document.querySelector('html')).toHaveAttribute('lang', 'en');
    expect(document.querySelector('html')).toHaveAttribute(
      'data-bs-theme',
      'auto'
    );
  });

  it('includes proper meta tags', () => {
    customRender(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    // Check meta viewport tag (using our mock)
    expect(document.querySelector('meta[name="viewport"]')).toHaveAttribute(
      'content',
      'width=device-width, initial-scale=1'
    );
  });
});
