// tests/ContactForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ContactForm from '@/app/components/ContactForm';

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

describe('ContactForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates input values on change', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();
    
    // Get form fields
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const phoneInput = screen.getByLabelText(/Phone/i);
    
    // Fill in the form
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(phoneInput, '123-456-7890');
    
    // Check input values
    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@example.com');
    expect(phoneInput).toHaveValue('123-456-7890');
  });

  it('submits form data and redirects on success', async () => {
    render(<ContactForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '123-456-7890' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Book Your Consult/i }));
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          phone: '123-456-7890',
        }),
      });
    });
    
    // Check if router.push was called to redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('shows error message when submission fails', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to submit' }),
      })
    );
    
    render(<ContactForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '123-456-7890' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Book Your Consult/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit request. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables the submit button while submitting', async () => {
    // Mock fetch to take some time
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }, 100);
      })
    );
    
    render(<ContactForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '123-456-7890' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Book Your Consult/i }));
    
    // Check if button is disabled and shows loading text
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });
});