"use client"

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FormData {
  companyName: string;
  industry: string;
  employeeCount: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  currentITProviders: string;
  softwareUsed: string;
  painPoints: string;
  goals: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    employeeCount: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    currentITProviders: '',
    softwareUsed: '',
    painPoints: '',
    goals: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send form data to API
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Redirect to dashboard or success page
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/vercel.svg" 
              alt="Company Logo" 
              width={100} 
              height={24} 
              className="dark:invert"
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Onboarding • Step {step} of 3
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {step === 1 && "Company Information"}
              {step === 2 && "Contact Details"}
              {step === 3 && "IT Environment"}
            </h1>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Company Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="companyName" className="block mb-2 text-gray-700 dark:text-gray-300">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="industry" className="block mb-2 text-gray-700 dark:text-gray-300">
                        Industry
                      </label>
                      <input
                        type="text"
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="employeeCount" className="block mb-2 text-gray-700 dark:text-gray-300">
                      Number of Employees
                    </label>
                    <select
                      id="employeeCount"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleChange}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                      required
                    >
                      <option value="">Select</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="501+">501+</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contactName" className="block mb-2 text-gray-700 dark:text-gray-300">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contactEmail" className="block mb-2 text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block mb-2 text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="address" className="block mb-2 text-gray-700 dark:text-gray-300">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <label htmlFor="city" className="block mb-2 text-gray-700 dark:text-gray-300">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block mb-2 text-gray-700 dark:text-gray-300">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block mb-2 text-gray-700 dark:text-gray-300">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: IT Environment */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="currentITProviders" className="block mb-2 text-gray-700 dark:text-gray-300">
                      Current IT Providers/Services
                    </label>
                    <textarea
                      id="currentITProviders"
                      name="currentITProviders"
                      value={formData.currentITProviders}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="softwareUsed" className="block mb-2 text-gray-700 dark:text-gray-300">
                      Key Software/Applications Used
                    </label>
                    <textarea
                      id="softwareUsed"
                      name="softwareUsed"
                      value={formData.softwareUsed}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="painPoints" className="block mb-2 text-gray-700 dark:text-gray-300">
                      Current IT Pain Points
                    </label>
                    <textarea
                      id="painPoints"
                      name="painPoints"
                      value={formData.painPoints}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="goals" className="block mb-2 text-gray-700 dark:text-gray-300">
                      IT Goals for Next 12 Months
                    </label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={formData.goals}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors rounded"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-colors rounded"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-colors rounded disabled:opacity-70"
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Boximity MSP. All rights reserved.
        </div>
      </footer>
    </div>
  );
}