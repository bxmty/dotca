// tests/not-found.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFound from '@/app/not-found';

// Mock the Link component from next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe('NotFound Component', () => {
  it('renders 404 message', () => {
    render(<NotFound />);

    // Check if 404 message is displayed
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText('The page you are looking for does not exist.')
    ).toBeInTheDocument();
  });

  it('renders a link to the home page', () => {
    render(<NotFound />);

    // Check if link to home is displayed
    const homeLink = screen.getByRole('link', { name: /Return to Home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('btn btn-primary');
  });
});
