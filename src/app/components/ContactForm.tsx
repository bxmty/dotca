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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit request. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form className={`md:w-1/2 md:pl-16 ${className}`} onSubmit={handleSubmit}>
      {submitStatus.type && (
        <div className={`mb-4 p-3 rounded ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {submitStatus.message}
        </div>
      )}
      <div className="mb-6">
        <label htmlFor="name" className="block mb-2 text-gray-700 dark:text-gray-300">Name</label>
        <input 
          type="text" 
          id="name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="email" className="block mb-2 text-gray-700 dark:text-gray-300">Email</label>
        <input 
          type="email" 
          id="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="phone" className="block mb-2 text-gray-700 dark:text-gray-300">Phone</label>
        <input 
          type="tel" 
          id="phone" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)} 
          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      <button 
        type="submit"
        disabled={isSubmitting}
        className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-colors disabled:opacity-70"
      >
        {isSubmitting ? 'Submitting...' : 'Book Your Consult'}
      </button>
    </form>
  );
};

export default ContactForm;