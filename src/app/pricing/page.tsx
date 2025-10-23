'use client';

import Link from 'next/link';
import { Suspense } from 'react';

// Shared pricing plans data
const pricingPlans = [
  {
    name: 'Free',
    price: '$0.00',
    description:
      'Ideal for startups and freelancers looking to secure their digital assets',
    features: [
      'Automatic Windows Updates',
      'Basic Antivirus Protection',
      '24/7 Device Monitoring',
    ],
    cta: 'Choose Free',
  },
  {
    name: 'Basic',
    price: '$99.00',
    description:
      'Perfect for small teams needing essential IT security and communication tools',
    features: [
      'Everything in Free',
      'Password Manager',
      'Business Email Solution',
      'Email Support (Business Hours)',
      'Basic Security Monitoring',
      'Setup & Onboarding Assistance',
    ],
    cta: 'Choose Basic',
  },
  {
    name: 'Standard',
    price: '$249.00',
    description:
      'Our recommended option for growing businesses needing comprehensive IT support',
    features: [
      'Everything in Basic',
      'Professional Web Hosting',
      'Microsoft Collaboration Tools',
      'Quarterly IT Assessment',
      'Extended Technical Support',
      'Cloud Backup Solutions',
      '30-day email & phone support',
    ],
    highlighted: true,
    cta: 'Choose Standard',
  },
  {
    name: 'Premium',
    price: '$449.00',
    description:
      'Complete IT management solution for businesses requiring enterprise-grade technology',
    features: [
      'Everything in Standard',
      '24/7 Priority Support',
      'Server Monitoring & Management',
      'Reduced Web Design Rates',
      'Advanced Security Suite',
      'Dedicated Account Manager',
      'On-site Consultations',
      'Unlimited Device Support',
    ],
    cta: 'Choose Premium',
  },
];

// Client component to handle the Link with searchParams
function PricingCards() {
  return (
    <div className="row g-3">
      {pricingPlans.map(plan => (
        <div key={plan.name} className="col-md-3">
          <div
            className={`card h-100 ${plan.highlighted ? 'border-primary shadow position-relative' : 'border'}`}
          >
            {plan.highlighted && (
              <div className="position-absolute top-0 start-50 translate-middle badge bg-primary px-3 py-2 rounded-pill">
                Recommended
              </div>
            )}
            <div className="card-body p-4">
              <h3 className="fs-3 fw-medium mb-2">{plan.name}</h3>
              <div className="fs-2 fw-light mb-1">{plan.price}</div>
              <p className="small fst-italic text-secondary mb-3">
                per user per month
              </p>
              <p className="text-secondary mb-4">{plan.description}</p>
              <ul className="list-unstyled mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="d-flex align-items-start mb-2">
                    <svg
                      className="text-success flex-shrink-0 me-2 mt-1"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-footer border-0 bg-transparent p-4 pt-0">
              <Link
                href={`/checkout?plan=${plan.name}`}
                className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-outline-primary'} w-100`}
              >
                {plan.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main page component
export default function Pricing() {
  return (
    <>
      {/* Pricing Hero */}
      <section className="py-5 py-md-7 bg-alt text-white">
        <div className="container text-center">
          <h1 className="display-4 fw-light mb-4">
            Technology Solutions That Fit Your Budget
          </h1>
          <p className="lead text-light mx-auto mb-4 col-md-8">
            Enterprise-grade technology solutions without enterprise-level
            complexity or cost. Choose the package that best fits your business
            needs.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-5 py-md-7">
        <div className="container">
          <Suspense fallback={<div>Loading pricing plans...</div>}>
            <PricingCards />
          </Suspense>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-alt py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center">
            Frequently Asked Questions
          </h2>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item mb-3 border">
                  <h3 className="accordion-header">
                    <button
                      className="accordion-button fw-medium"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#faq1"
                    >
                      What&apos;s included in the Password Manager?
                    </button>
                  </h3>
                  <div
                    id="faq1"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Our Password Manager includes secure credential storage,
                      password generation, multi-factor authentication, and
                      admin controls to manage team access to company accounts.
                    </div>
                  </div>
                </div>
                <div className="accordion-item mb-3 border">
                  <h3 className="accordion-header">
                    <button
                      className="accordion-button fw-medium collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#faq2"
                    >
                      How long does implementation typically take?
                    </button>
                  </h3>
                  <div
                    id="faq2"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      For most small businesses, our Basic package can be
                      implemented within 1-2 weeks, Standard within 3-5 weeks,
                      and Premium within 5-7 weeks, depending on your team size
                      and existing infrastructure.
                    </div>
                  </div>
                </div>
                <div className="accordion-item mb-3 border">
                  <h3 className="accordion-header">
                    <button
                      className="accordion-button fw-medium collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#faq3"
                    >
                      Do these prices include all necessary software licenses?
                    </button>
                  </h3>
                  <div
                    id="faq3"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Yes, all packages include the necessary licenses for the
                      specified features. There are no hidden costs or
                      additional software purchases required.
                    </div>
                  </div>
                </div>
                <div className="accordion-item border">
                  <h3 className="accordion-header">
                    <button
                      className="accordion-button fw-medium collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#faq4"
                    >
                      What if my business needs change and I need to upgrade?
                    </button>
                  </h3>
                  <div
                    id="faq4"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      You can upgrade your plan at any time. We&apos;ll prorate
                      the difference and apply any unused portion of your
                      current subscription to your new plan.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-5 py-md-7">
        <div className="container text-center">
          <h2 className="fs-1 fw-light mb-4">
            Ready to Transform Your Business Technology?
          </h2>
          <p className="lead text-secondary col-md-8 mx-auto mb-5">
            Take the first step today to eliminate IT headaches and focus on
            what you do best: serving your customers and growing your business.
          </p>
          <Link href="/#contact" className="btn btn-secondary btn-lg px-5 py-3">
            Get Your IT Assessment
          </Link>
        </div>
      </section>
    </>
  );
}
