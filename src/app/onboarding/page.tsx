'use client';

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
    <div className="bg-light">
      {/* Custom Header for Onboarding */}
      <header className="bg-white shadow-sm py-3">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Image
              src="/vercel.svg"
              alt="Company Logo"
              width={100}
              height={24}
              className="dark-invert"
            />
          </div>
          <div className="small text-secondary">
            Onboarding • Step {step} of 3
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-5">
        <div
          className="card mx-auto shadow rounded"
          style={{ maxWidth: '800px' }}
        >
          <div className="card-body p-4 p-md-5">
            <h1 className="fs-3 fw-bold mb-4">
              {step === 1 && 'Company Information'}
              {step === 2 && 'Contact Details'}
              {step === 3 && 'IT Environment'}
            </h1>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Company Information */}
              {step === 1 && (
                <div className="mb-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label htmlFor="companyName" className="form-label">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="industry" className="form-label">
                        Industry
                      </label>
                      <input
                        type="text"
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="employeeCount" className="form-label">
                      Number of Employees
                    </label>
                    <select
                      id="employeeCount"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleChange}
                      className="form-select"
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
                <div className="mb-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label htmlFor="contactName" className="form-label">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="contactEmail" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="contactPhone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="row g-4 mt-2">
                    <div className="col-md-4">
                      <label htmlFor="city" className="form-label">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="state" className="form-label">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="zipCode" className="form-label">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: IT Environment */}
              {step === 3 && (
                <div className="mb-4">
                  <div className="mb-4">
                    <label htmlFor="currentITProviders" className="form-label">
                      Current IT Providers/Services
                    </label>
                    <textarea
                      id="currentITProviders"
                      name="currentITProviders"
                      value={formData.currentITProviders}
                      onChange={handleChange}
                      rows={3}
                      className="form-control"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="softwareUsed" className="form-label">
                      Key Software/Applications Used
                    </label>
                    <textarea
                      id="softwareUsed"
                      name="softwareUsed"
                      value={formData.softwareUsed}
                      onChange={handleChange}
                      rows={3}
                      className="form-control"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="painPoints" className="form-label">
                      Current IT Pain Points
                    </label>
                    <textarea
                      id="painPoints"
                      name="painPoints"
                      value={formData.painPoints}
                      onChange={handleChange}
                      rows={3}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label htmlFor="goals" className="form-label">
                      IT Goals for Next 12 Months
                    </label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={formData.goals}
                      onChange={handleChange}
                      rows={3}
                      className="form-control"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-5 d-flex justify-content-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-secondary px-4"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-dark ms-auto px-4"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-dark ms-auto px-4"
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
