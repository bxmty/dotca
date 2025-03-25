// tests/page.test.tsx
import { render, screen } from '@testing-library/react';
// userEvent not used in this file
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Home from '@/app/page';

// Mock the Next.js components and hooks
jest.mock('next/link', () => {
  return function NextLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href} data-testid="next-link">{children}</a>;
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt?: string; width?: number; height?: number; className?: string }) => {
    return <img data-testid="next-image" {...props} alt={props.alt || ''} />;
  },
}));

// Mock the ContactForm component
jest.mock('@/app/components/ContactForm', () => {
  return function MockContactForm({ className }: { className?: string }) {
    return <div data-testid="contact-form" className={className}>Contact Form Mock</div>;
  };
});

describe('Boximity Landing Page', () => {
  // Test 1: Verify that the page renders critical elements
  it('renders essential landing page components', () => {
    render(<Home />);
    
    // Check for company name in header
    expect(screen.getByText('boximity inc.')).toBeInTheDocument();
    
    // Check for navigation
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Solutions')).toBeInTheDocument();
    expect(screen.getByText('Benefits')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    
    // Check for main heading
    const heading = screen.getByRole('heading', { 
      name: /Make Your Whole Team Tech-Savvy Without the Headache/i 
    });
    expect(heading).toBeInTheDocument();
    
    // Check for call-to-action buttons
    const pricingButton = screen.getByRole('link', { name: /See Pricing Options/i });
    expect(pricingButton).toBeInTheDocument();
    
    const assessmentButton = screen.getByRole('button', { name: /Get Your IT Assessment/i });
    expect(assessmentButton).toBeInTheDocument();
    
    // Check for footer
    expect(screen.getByText('© 2025 boximity msp. All rights reserved.')).toBeInTheDocument();
  });

  // Test 2: Test navigation to pricing page
  it('has pricing link with correct href', () => {
    render(<Home />);
    
    // Find the pricing link
    const pricingLinks = screen.getAllByText('Pricing');
    const navPricingLink = pricingLinks.find(link => 
      link.closest('nav') !== null
    );
    
    // Verify the href without clicking
    expect(navPricingLink?.closest('a')).toHaveAttribute('href', '/pricing');
  });

  // Test 3: Test key component presence
  it('displays contact form and key sections', () => {
    render(<Home />);
    
    // Check for contact form
    expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    
    // Check for section headings
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(5); // Should have multiple headings
    
    // Check for call-to-action buttons
    const ctaButtons = screen.getAllByRole('button');
    expect(ctaButtons.length).toBeGreaterThan(1);
    
    // Check for next/link components
    expect(screen.getAllByTestId('next-link').length).toBeGreaterThan(0);
    
    // Check for next/image components
    expect(screen.getAllByTestId('next-image').length).toBeGreaterThan(0);
  });
});