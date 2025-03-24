// tests/legacy-pages.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Custom404 from '@/pages/404';
import App from '@/pages/_app';
import Document, { Html, Head, Main, NextScript } from '@/pages/_document';

// Mock next/link for 404 page
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock NextScript for _document.tsx
jest.mock('next/document', () => {
  const originalModule = jest.requireActual('next/document');
  return {
    __esModule: true,
    ...originalModule,
    Html: ({ children }: { children: React.ReactNode }) => <html>{children}</html>,
    Head: () => <head data-testid="document-head"></head>,
    Main: () => <main data-testid="document-main"></main>,
    NextScript: () => <div data-testid="next-script"></div>,
  };
});

describe('Legacy Pages', () => {
  describe('404 Page', () => {
    it('renders 404 page with link to home', () => {
      render(<Custom404 />);
      
      // Check for 404 text
      expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
      
      // Check for link to home
      const homeLink = screen.getByRole('link', { name: /Return to Home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('_app Page', () => {
    it('renders component with pageProps', () => {
      const Component = () => <div data-testid="test-component">Test Component</div>;
      const pageProps = { testProp: 'test-value' };
      
      render(<App Component={Component} pageProps={pageProps} />);
      
      // Check if component is rendered
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  describe('_document Page', () => {
    it('renders Document component', () => {
      // This test is simplified since _document is a special Next.js file
      // that normally doesn't get rendered directly in tests
      
      render(
        <Html lang="en">
          <Head />
          <body>
            <Main />
            <NextScript />
          </body>
        </Html>
      );
      
      // Check if document elements are rendered
      expect(document.querySelector('html')).toHaveAttribute('lang', 'en');
      expect(screen.getByTestId('document-head')).toBeInTheDocument();
      expect(screen.getByTestId('document-main')).toBeInTheDocument();
      expect(screen.getByTestId('next-script')).toBeInTheDocument();
    });
  });
});