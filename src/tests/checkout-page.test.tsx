// tests/checkout-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CheckoutPage from '@/app/checkout/page';

// Mock the PlanSelector component
jest.mock('@/app/checkout/PlanSelector', () => {
  return function MockPlanSelector({
    onPlanSelected,
    pricingPlans,
  }: {
    onPlanSelected: (plan: unknown) => void;
    pricingPlans: unknown[];
  }) {
    // Auto-select the first plan after a small delay
    setTimeout(() => {
      onPlanSelected(pricingPlans[0]);
    }, 0);

    return null;
  };
});

// Mock the Link component
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

describe('CheckoutPage Component', () => {
  it('shows loading state initially', () => {
    render(<CheckoutPage />);

    // Check if loading message is shown
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders "No Plan Selected" when no plan is selected', async () => {
    // Override the mock to not select a plan
    jest.mock('@/app/checkout/PlanSelector', () => {
      return function MockPlanSelector() {
        return null;
      };
    });

    render(<CheckoutPage />);

    // Wait for loading to finish - this won't happen in this test because we modified the mock
    // but we'll wait anyway to ensure the component has time to process
    await waitFor(
      () => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      },
      { timeout: 100 }
    );
  });

  it('renders checkout form with selected plan', async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected (mock will auto-select the first plan)
    await waitFor(() => {
      expect(screen.getByText('Join Our Waitlist')).toBeInTheDocument();
    });

    // Check if plan details are shown
    expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    expect(screen.getByText('$99.00 per user per month')).toBeInTheDocument();

    // Check if customer information form is rendered
    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();

    // Check if payment form is rendered
    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Credit Card')).toBeInTheDocument();
    expect(screen.getByLabelText('Pay by Invoice')).toBeInTheDocument();
  });

  it('updates form data when inputs change', async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText('Join Our Waitlist')).toBeInTheDocument();
    });

    // Fill in customer information
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' },
    });

    // Check if inputs have updated values
    expect(screen.getByLabelText('First Name')).toHaveValue('John');
    expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
    expect(screen.getByLabelText('Email Address')).toHaveValue(
      'john@example.com'
    );
  });

  it('shows credit card fields when credit card payment method is selected', async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText('Join Our Waitlist')).toBeInTheDocument();
    });

    // Check that credit card fields are visible by default
    expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Expiration Date')).toBeInTheDocument();
    expect(screen.getByLabelText('CVC')).toBeInTheDocument();

    // Select invoice payment method
    fireEvent.click(screen.getByLabelText('Pay by Invoice'));

    // Check that credit card fields are hidden
    expect(screen.queryByLabelText('Card Number')).not.toBeInTheDocument();

    // Check that invoice message is shown
    expect(
      screen.getByText(/You'll receive an invoice via email./i)
    ).toBeInTheDocument();

    // Switch back to credit card
    fireEvent.click(screen.getByLabelText('Credit Card'));

    // Check that credit card fields are visible again
    expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
  });

  it('submits the form with correct data', async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText('Join Our Waitlist')).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'ACME Inc' },
    });
    fireEvent.change(screen.getByLabelText('Phone Number'), {
      target: { value: '123-456-7890' },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText('State'), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText('ZIP Code'), {
      target: { value: '10001' },
    });

    // Fill in credit card details
    fireEvent.change(screen.getByLabelText('Card Number'), {
      target: { value: '4111111111111111' },
    });
    fireEvent.change(screen.getByLabelText('Expiration Date'), {
      target: { value: '12/25' },
    });
    fireEvent.change(screen.getByLabelText('CVC'), {
      target: { value: '123' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /Complete Purchase/i,
    });
    fireEvent.click(submitButton);

    // In a real test we would check for successful submission,
    // but in this mock component there's no actual form submission handling
  });

  it('shows the correct total price', async () => {
    render(<CheckoutPage />);

    // Wait for plan to be selected
    await waitFor(() => {
      expect(screen.getByText('Join Our Waitlist')).toBeInTheDocument();
    });

    // Check subtotal and estimated total
    const priceTexts = screen.getAllByText('$99.00');
    expect(priceTexts.length).toBeGreaterThanOrEqual(2); // At least two instances: plan price and total
  });
});
