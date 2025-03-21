'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import PlanSelector from './PlanSelector';

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export default function Checkout() {
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
  const pricingPlans = useMemo(() => [
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
  ], []);

  const handlePlanSelected = (plan: PricingPlan | null) => {
    setSelectedPlan(plan);
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    // In a real application, you would process the payment and submit the form data
    // Form submitted
    // Redirect to a confirmation page or show a success message
    // Show confirmation message to user
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div>
          <Suspense fallback={<p>Loading plans...</p>}>
            <PlanSelector 
              pricingPlans={pricingPlans}
              onPlanSelected={handlePlanSelected}
            />
          </Suspense>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-vh-100 d-flex flex-column">
        {/* Invisible component to handle URL params with suspense */}
        <Suspense fallback={null}>
          <PlanSelector 
            pricingPlans={pricingPlans}
            onPlanSelected={handlePlanSelected}
          />
        </Suspense>
        
        {/* Header */}
        <header className="py-4 px-3 px-md-5 d-flex align-items-center justify-content-between">
          <Link href="/" className="fs-4 fw-semibold text-decoration-none text-body">YOUR COMPANY</Link>
          <nav className="d-none d-md-flex gap-4">
            <Link href="/#solutions" className="text-decoration-none text-body">Solutions</Link>
            <Link href="/#benefits" className="text-decoration-none text-body">Benefits</Link>
            <Link href="/#process" className="text-decoration-none text-body">Process</Link>
            <Link href="/#contact" className="text-decoration-none text-body">Contact</Link>
            <Link href="/pricing" className="text-decoration-none text-body">Pricing</Link>
          </nav>
          <button className="btn d-md-none border-0 p-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <section className="py-5 py-md-7 flex-grow-1">
          <div className="container text-center">
            <h1 className="fs-1 fw-light mb-4 border-bottom pb-3">No Plan Selected</h1>
            <p className="lead text-secondary mb-4">
              Please select a plan from our pricing page to proceed with checkout.
            </p>
            <Link href="/pricing" className="btn btn-dark px-4 py-2">
              View Pricing Options
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-4 py-md-5 border-top mt-auto">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6 mb-4 mb-md-0 text-center text-md-start">
                <div className="fs-4 fw-semibold mb-2">YOUR COMPANY</div>
                <p className="small text-secondary mb-0">© 2025 Your Company. All rights reserved.</p>
              </div>
              <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
                <div className="d-flex gap-4">
                  <a href="#" className="text-secondary">
                    <span className="visually-hidden">LinkedIn</span>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-secondary">
                    <span className="visually-hidden">Twitter</span>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-secondary">
                    <span className="visually-hidden">Facebook</span>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Invisible component to handle URL params with suspense */}
      <Suspense fallback={null}>
        <PlanSelector 
          pricingPlans={pricingPlans}
          onPlanSelected={handlePlanSelected}
        />
      </Suspense>
      
      {/* Header */}
      <header className="py-4 px-3 px-md-5 d-flex align-items-center justify-content-between">
        <Link href="/" className="fs-4 fw-semibold text-decoration-none text-body">YOUR COMPANY</Link>
        <nav className="d-none d-md-flex gap-4">
          <Link href="/#solutions" className="text-decoration-none text-body">Solutions</Link>
          <Link href="/#benefits" className="text-decoration-none text-body">Benefits</Link>
          <Link href="/#process" className="text-decoration-none text-body">Process</Link>
          <Link href="/#contact" className="text-decoration-none text-body">Contact</Link>
          <Link href="/pricing" className="text-decoration-none text-body">Pricing</Link>
        </nav>
        <button className="btn d-md-none border-0 p-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <main className="flex-grow-1">
        {/* Checkout Section */}
        <section className="py-5 py-md-7">
          <div className="container">
            <h1 className="fs-1 fw-light mb-5 border-bottom pb-3">Complete Your Purchase</h1>
            
            {/* Plan Summary */}
            <div className="bg-light p-4 p-md-5 rounded mb-5">
              <h2 className="fs-4 fw-medium mb-4">Your Selected Plan</h2>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between">
                <div>
                  <div className="fs-3 fw-medium mb-1">{selectedPlan.name} Plan</div>
                  <div className="fs-4 text-secondary mb-1">{selectedPlan.price} per user per month</div>
                  <p className="text-secondary">{selectedPlan.description}</p>
                </div>
                <div className="mt-3 mt-md-0">
                  <Link href="/pricing" className="text-secondary text-decoration-none">
                    Change Plan
                  </Link>
                </div>
              </div>
              <div className="mt-4 pt-4 border-top">
                <h3 className="fs-5 fw-medium mb-3">Includes:</h3>
                <ul className="list-unstyled">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="d-flex align-items-start mb-2">
                      <svg className="text-success flex-shrink-0 me-2 mt-1" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Checkout Form */}
            <form onSubmit={handleSubmit}>
              <div className="row g-5">
                <div className="col-md-6">
                  <h2 className="fs-4 fw-medium mb-4">Customer Information</h2>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="company" className="form-label">Company Name</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="address" className="form-label">Address</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="city" className="form-label">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="state" className="form-label">State</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="zip" className="form-label">ZIP Code</label>
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <h2 className="fs-4 fw-medium mb-4">Payment Information</h2>
                  <div>
                    <div className="d-flex gap-4 mb-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="creditCard"
                          name="paymentMethod"
                          value="credit"
                          checked={formData.paymentMethod === 'credit'}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="creditCard">Credit Card</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="invoice"
                          name="paymentMethod"
                          value="invoice"
                          checked={formData.paymentMethod === 'invoice'}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="invoice">Pay by Invoice</label>
                      </div>
                    </div>
                    
                    {formData.paymentMethod === 'credit' && (
                      <div className="row g-3">
                        <div className="col-12">
                          <label htmlFor="cardNumber" className="form-label">Card Number</label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="1234 5678 9012 3456"
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="cardExpiry" className="form-label">Expiration Date</label>
                          <input
                            type="text"
                            id="cardExpiry"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="cardCvc" className="form-label">CVC</label>
                          <input
                            type="text"
                            id="cardCvc"
                            name="cardCvc"
                            value={formData.cardCvc}
                            onChange={handleInputChange}
                            placeholder="123"
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                    )}
                    
                    {formData.paymentMethod === 'invoice' && (
                      <div className="alert alert-secondary">
                        <p className="mb-0">
                          You&apos;ll receive an invoice via email. Payment is due within 30 days of receipt.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-5 pt-4 border-top">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal</span>
                        <span>{selectedPlan.price}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-secondary mb-2">
                        <span>Tax</span>
                        <span>Calculated at next step</span>
                      </div>
                      <div className="d-flex justify-content-between fw-bold fs-5 mt-3 pt-3 border-top">
                        <span>Estimated Total</span>
                        <span>{selectedPlan.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 mt-4">
                  <div className="alert alert-secondary mb-4">
                    <p className="mb-0 small">
                      By completing this purchase, you agree to our <a href="#" className="text-decoration-none">Terms of Service</a> and <a href="#" className="text-decoration-none">Privacy Policy</a>.
                    </p>
                  </div>
                  <button type="submit" className="btn btn-dark w-100 py-3 fs-5">
                    Complete Purchase
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 py-md-5 border-top mt-auto">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0 text-center text-md-start">
              <div className="fs-4 fw-semibold mb-2">YOUR COMPANY</div>
              <p className="small text-secondary mb-0">© 2025 Your Company. All rights reserved.</p>
            </div>
            <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
              <div className="d-flex gap-4">
                <a href="#" className="text-secondary">
                  <span className="visually-hidden">LinkedIn</span>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
                <a href="#" className="text-secondary">
                  <span className="visually-hidden">Twitter</span>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-secondary">
                  <span className="visually-hidden">Facebook</span>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}