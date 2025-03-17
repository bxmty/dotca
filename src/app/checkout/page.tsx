'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export default function Checkout() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    paymentMethod: 'credit',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  // Pricing plans data
  const pricingPlans = [
    {
      name: "Basic",
      price: "$99.00",
      description: "Perfect for small teams needing essential IT security and communication tools",
      features: [
        "Password Manager",
        "Business Email Solution",
        "Email Support (Business Hours)",
        "Basic Security Monitoring",
        "Setup & Onboarding Assistance"
      ]
    },
    {
      name: "Standard",
      price: "$249.00",
      description: "Our most popular option for growing businesses needing comprehensive IT support",
      features: [
        "Everything in Basic",
        "Professional Web Hosting",
        "Microsoft Collaboration Tools",
        "Quarterly IT Assessment",
        "Extended Technical Support",
        "Cloud Backup Solutions",
        "30-day email & phone support"
      ]
    },
    {
      name: "Premium",
      price: "$449.00",
      description: "Complete IT management solution for businesses requiring enterprise-grade technology",
      features: [
        "Everything in Standard",
        "24/7 Priority Support",
        "Server Monitoring & Management",
        "Reduced Web Design Rates",
        "Advanced Security Suite",
        "Dedicated Account Manager",
        "On-site Consultations",
        "Unlimited Device Support"
      ]
    }
  ];

  useEffect(() => {
    const planName = searchParams.get('plan');
    if (planName) {
      const plan = pricingPlans.find(p => p.name.toLowerCase() === planName.toLowerCase());
      if (plan) {
        setSelectedPlan(plan);
      }
    }
    setLoading(false);
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would process the payment and submit the form data
    console.log('Form submitted', { selectedPlan, formData });
    // Redirect to a confirmation page or show a success message
    alert('Thank you for your order! We will contact you shortly to complete the setup process.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
        {/* Header */}
        <header className="py-6 px-8 md:px-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">YOUR COMPANY</Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/#solutions" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Solutions</Link>
            <Link href="/#benefits" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Benefits</Link>
            <Link href="/#process" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Process</Link>
            <Link href="/#contact" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact</Link>
            <Link href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Pricing</Link>
          </nav>
          <button className="md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <section className="py-16 px-8 md:px-16 flex-grow">
          <div className="container mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-light mb-8 border-b pb-4">No Plan Selected</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Please select a plan from our pricing page to proceed with checkout.
            </p>
            <Link href="/pricing" className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity">
              View Pricing Options
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-8 md:px-16 border-t mt-auto">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-xl font-semibold tracking-tight mb-2">YOUR COMPANY</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 Your Company. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="py-6 px-8 md:px-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">YOUR COMPANY</Link>
        <nav className="hidden md:flex space-x-8">
          <Link href="/#solutions" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Solutions</Link>
          <Link href="/#benefits" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Benefits</Link>
          <Link href="/#process" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Process</Link>
          <Link href="/#contact" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact</Link>
          <Link href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Pricing</Link>
        </nav>
        <button className="md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <main className="flex-grow">
        {/* Checkout Section */}
        <section className="py-16 px-8 md:px-16">
          <div className="container mx-auto">
            <h1 className="text-3xl font-light mb-8 border-b pb-4">Complete Your Purchase</h1>
            
            {/* Plan Summary */}
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-medium mb-4">Your Selected Plan</h2>
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="text-2xl font-medium mb-1">{selectedPlan.name} Plan</div>
                  <div className="text-xl text-gray-600 dark:text-gray-400">{selectedPlan.price} per user per month</div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedPlan.description}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:underline">
                    Change Plan
                  </Link>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                <h3 className="font-medium mb-2">Includes:</h3>
                <ul className="space-y-1">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-medium mb-6">Customer Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-medium mb-6">Payment Information</h2>
                <div className="space-y-4">
                  <div className="flex space-x-4 mb-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="creditCard"
                        name="paymentMethod"
                        value="credit"
                        checked={formData.paymentMethod === 'credit'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="creditCard" className="text-sm font-medium text-gray-700 dark:text-gray-300">Credit Card</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="invoice"
                        name="paymentMethod"
                        value="invoice"
                        checked={formData.paymentMethod === 'invoice'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="invoice" className="text-sm font-medium text-gray-700 dark:text-gray-300">Pay by Invoice</label>
                    </div>
                  </div>
                  
                  {formData.paymentMethod === 'credit' && (
                    <>
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date</label>
                          <input
                            type="text"
                            id="cardExpiry"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                          <input
                            type="text"
                            id="cardCvc"
                            name="cardCvc"
                            value={formData.cardCvc}
                            onChange={handleInputChange}
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {formData.paymentMethod === 'invoice' && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        You'll receive an invoice via email. Payment is due within 30 days of receipt.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span>{selectedPlan.price}</span>
                    </div>
                    <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Tax</span>
                      <span>Calculated at next step</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                      <span>Estimated Total</span>
                      <span>{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 mt-8">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    By completing this purchase, you agree to our <a href="#" className="text-gray-900 dark:text-gray-100 underline">Terms of Service</a> and <a href="#" className="text-gray-900 dark:text-gray-100 underline">Privacy Policy</a>.
                  </p>
                </div>
                <button type="submit" className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity text-lg font-medium rounded-md">
                  Complete Purchase
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 md:px-16 border-t mt-auto">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="text-xl font-semibold tracking-tight mb-2">YOUR COMPANY</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 Your Company. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
              </svg>
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}