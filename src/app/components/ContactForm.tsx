"use client"

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface ContactFormProps {
  className?: string;
}

const ContactForm = ({ className = '' }: ContactFormProps) => {
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
      // Send form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Redirect to full onboarding form after successful submission
      router.push('/onboarding');
    } catch (error) {
      // Log error submitting form
      console.error('Contact form submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit request. Please try again.'
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
      <div className="mb-3">
        <label htmlFor="name" className="form-label">Name</label>
        <input 
          type="text" 
          id="name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-control"
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email</label>
        <input 
          type="email" 
          id="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control"
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="phone" className="form-label">Phone</label>
        <input 
          type="tel" 
          id="phone" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)} 
          className="form-control"
          required
        />
      </div>
      <button 
        type="submit"
        disabled={isSubmitting}
        className="btn btn-secondary btn-block"
      >
        {isSubmitting ? 'Submitting...' : 'Book Your Consult'}
      </button>
    </form>
  );
};

export default ContactForm;