"use client"

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface ContactFormProps {
  className?: string;
}

const ContactForm = ({ className = '' }: ContactFormProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{type: 'success' | 'error' | null, message: string}>({
    type: null,
    message: ''
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // The phone number already contains country code from the PhoneInput component
      
      // Send form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
      });

      const responseData = await response.json().catch(() => null);
      
      if (!response.ok) {
        // Handle error case
        if (responseData && responseData.error) {
          throw new Error(`Error: ${responseData.error}`);
        } else {
          throw new Error(`Failed to submit form (Status: ${response.status})`);
        }
      }

      // Handle custom success message if provided by the API
      if (responseData && responseData.message) {
        setSubmitStatus({
          type: 'success',
          message: responseData.message
        });
        setIsSubmitting(false);
        return; // Don't redirect if we have a custom message
      }

      // Display success message
      setSubmitStatus({
        type: 'success',
        message: 'Thank you! Your consultation request has been submitted successfully.'
      });
      
      // Reset form fields
      setName('');
      setEmail('');
      setPhone('');
      setIsSubmitting(false);
    } catch (error) {
      // Log error submitting form
      console.error('Contact form submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error 
          ? `${error.message}. Please try again.` 
          : 'Failed to submit request. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form className={`col-md-6 ps-md-5 ${className}`} onSubmit={handleSubmit}>
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
            <h3 className="fs-5 mb-0 text-white">Book Your Consultation</h3>
            <p className="text-light mb-0 small">We&apos;ll contact you to schedule your session</p>
          </div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="name" className="form-label text-light">Name*</label>
          <input 
            type="text" 
            id="name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control bg-secondary bg-opacity-25 text-white border-secondary"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label text-light">Email*</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control bg-secondary bg-opacity-25 text-white border-secondary"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="phone" className="form-label text-light">Phone*</label>
          <PhoneInput
            country={'ca'} // Default country
            value={phone}
            onChange={(phone) => setPhone(`+${phone}`)} // Add + prefix for E.164 format
            inputClass="form-control bg-secondary bg-opacity-25 text-white border-secondary"
            containerClass="phone-input-container"
            buttonClass="phone-input-dropdown bg-secondary border-secondary"
            inputProps={{
              id: 'phone',
              name: 'phone',
              required: true,
              autoFocus: false
            }}
          />
        </div>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-100 py-3 fs-5"
        >
          {isSubmitting ? 'Submitting...' : 'Book Your Consult'}
        </button>
        
        <p className="small text-light mt-3 text-center">
          We&apos;ll reach out within 24 hours to schedule your consultation.
        </p>
      </div>
    </form>
  );
};

export default ContactForm;