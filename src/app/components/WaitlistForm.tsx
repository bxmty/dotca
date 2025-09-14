'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WaitlistFormProps {
  className?: string;
  planName: string;
  billingCycle: string;
  employeeCount: number;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
}

const WaitlistForm = ({ 
  className = '', 
  planName, 
  billingCycle, 
  employeeCount, 
  customerInfo 
}: WaitlistFormProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{type: 'success' | 'error' | null, message: string}>({
    type: null,
    message: ''
  });

  const submitForm = async (): Promise<void> => {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });
    
    // Validate required fields
    if (!customerInfo.firstName || !customerInfo.lastName) {
      setSubmitStatus({
        type: 'error',
        message: 'Name is required. Please provide both first and last name.'
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!customerInfo.email) {
      setSubmitStatus({
        type: 'error',
        message: 'Email address is required.'
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!customerInfo.phone) {
      setSubmitStatus({
        type: 'error',
        message: 'Phone number is required.'
      });
      setIsSubmitting(false);
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter a valid email address.'
      });
      setIsSubmitting(false);
      return;
    }
    
    // Basic phone validation - allow different formats but ensure it has enough digits
    const phoneDigits = customerInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter a valid phone number with at least 10 digits.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Send form data to API - using the same endpoint as contact form
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          phone: customerInfo.phone,
          // Add additional waitlist info as attributes
          company: customerInfo.company,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zip: customerInfo.zip,
          planName: planName,
          billingCycle: billingCycle,
          employeeCount: employeeCount,
          isWaitlist: true
        }),
      });

      const responseData = await response.json().catch(() => null);
      
      if (!response.ok) {
        // Handle error case
        if (responseData && responseData.error) {
          throw new Error(`Error: ${responseData.error}`);
        } else {
          throw new Error(`Failed to join waitlist (Status: ${response.status})`);
        }
      }

      // Handle custom success message if provided by the API
      if (responseData && responseData.message) {
        setSubmitStatus({
          type: 'success',
          message: responseData.message
        });
        setIsSubmitting(false);
        return;
      }

      // Display success message
      setSubmitStatus({
        type: 'success',
        message: 'Thank you! You have been added to our waitlist. We\'ll contact you when services are available in your area.'
      });
      
      setIsSubmitting(false);
    } catch (error) {
      console.error('Waitlist form submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error 
          ? `${error.message}. Please try again.` 
          : 'Failed to join waitlist. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {submitStatus.type && (
        <div className={`mb-4 alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {submitStatus.message}
        </div>
      )}
      
      <div className="bg-dark text-white p-4 rounded mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary p-2 rounded-circle me-3">
            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 className="fs-5 mb-0 text-white">Join Our Waitlist</h3>
            <p className="text-light mb-0 small">Be the first to know when our services are available</p>
          </div>
        </div>
        
        <div className="mb-4 bg-secondary bg-opacity-25 p-3 rounded border border-secondary">
          <p className="mb-2 text-light"><strong>Selected plan:</strong> {planName}</p>
          <p className="mb-2 text-light"><strong>Billing cycle:</strong> {billingCycle === 'annual' ? 'Annual' : 'Monthly'}</p>
          <p className="mb-0 text-light"><strong>Team size:</strong> {employeeCount} employees</p>
        </div>
        
        <button 
          type="button"
          onClick={submitForm}
          disabled={isSubmitting}
          className="btn btn-primary w-100 py-3 fs-5"
          data-waitlist-button
        >
          {isSubmitting ? 'Processing...' : 'Join Waitlist'}
        </button>
        
        <p className="small text-light mt-3 text-center">
          We&apos;ll notify you when our services become available in your area.
        </p>
      </div>
    </div>
  );
};

export default WaitlistForm;