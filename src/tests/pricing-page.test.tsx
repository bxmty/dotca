// tests/pricing-page.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingPage from '@/app/pricing/page';

// Mock the Link component from next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

describe('PricingPage Component', () => {
  it('renders the pricing page title', () => {
    render(<PricingPage />);
    
    // Check if the page title is rendered
    expect(screen.getByText('Technology Solutions That Fit Your Budget')).toBeInTheDocument();
  });

  it('renders all pricing plans correctly', () => {
    render(<PricingPage />);
    
    // Check if all plan names are rendered
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    
    // Check if plan prices are rendered
    expect(screen.getByText('$99.00')).toBeInTheDocument();
    expect(screen.getByText('$249.00')).toBeInTheDocument();
    expect(screen.getByText('$449.00')).toBeInTheDocument();
    
    // Check if "Most Popular" badge is displayed for the Standard plan
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('renders plan descriptions correctly', () => {
    render(<PricingPage />);
    
    expect(screen.getByText('Perfect for small teams needing essential IT security and communication tools')).toBeInTheDocument();
    expect(screen.getByText('Our most popular option for growing businesses needing comprehensive IT support')).toBeInTheDocument();
    expect(screen.getByText('Complete IT management solution for businesses requiring enterprise-grade technology')).toBeInTheDocument();
  });

  it('renders CTA buttons with correct links', () => {
    render(<PricingPage />);
    
    // Get CTA buttons
    const basicCta = screen.getByRole('link', { name: 'Choose Basic' });
    const standardCta = screen.getByRole('link', { name: 'Choose Standard' });
    const premiumCta = screen.getByRole('link', { name: 'Choose Premium' });
    
    // Check href attributes
    expect(basicCta).toHaveAttribute('href', '/checkout?plan=Basic');
    expect(standardCta).toHaveAttribute('href', '/checkout?plan=Standard');
    expect(premiumCta).toHaveAttribute('href', '/checkout?plan=Premium');
    
    // Check button styling
    expect(standardCta).toHaveClass('btn-primary');
    expect(basicCta).not.toHaveClass('btn-primary');
    expect(basicCta).toHaveClass('btn-outline-primary');
  });

  it('renders the features for each plan', () => {
    render(<PricingPage />);
    
    // Check for Basic plan features
    expect(screen.getByText('Password Manager')).toBeInTheDocument();
    expect(screen.getByText('Business Email Solution')).toBeInTheDocument();
    
    // Check for Standard plan features
    expect(screen.getByText('Everything in Basic')).toBeInTheDocument();
    expect(screen.getByText('Professional Web Hosting')).toBeInTheDocument();
    
    // Check for Premium plan features
    expect(screen.getByText('Everything in Standard')).toBeInTheDocument();
    expect(screen.getByText('24/7 Priority Support')).toBeInTheDocument();
  });

  it('renders the FAQ section', () => {
    render(<PricingPage />);
    
    // Check if FAQ title is rendered
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    
    // Check if FAQ questions are rendered
    expect(screen.getByText('What\'s included in the Password Manager?')).toBeInTheDocument();
    expect(screen.getByText('How long does implementation typically take?')).toBeInTheDocument();
    expect(screen.getByText('Do these prices include all necessary software licenses?')).toBeInTheDocument();
    expect(screen.getByText('What if my business needs change and I need to upgrade?')).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    render(<PricingPage />);
    
    // Check if CTA title and link are rendered
    expect(screen.getByText('Ready to Transform Your Business Technology?')).toBeInTheDocument();
    
    const ctaLink = screen.getByRole('link', { name: 'Get Your IT Assessment' });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/#contact');
  });

  it('renders the footer with copyright notice', () => {
    render(<PricingPage />);
    
    // Check if footer is rendered
    expect(screen.getByText(/© 2025 boximity msp. All rights reserved./i)).toBeInTheDocument();
  });
});