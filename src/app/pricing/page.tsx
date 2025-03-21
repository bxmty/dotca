import Link from "next/link";

export default function Pricing() {
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
      ],
      cta: "Choose Basic"
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
      ],
      highlighted: true,
      cta: "Choose Standard"
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
      ],
      cta: "Choose Premium"
    }
  ];

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="py-4 px-3 px-md-5 d-flex align-items-center justify-content-between">
        <Link href="/" className="fs-4 fw-semibold text-decoration-none text-body">YOUR COMPANY</Link>
        <nav className="d-none d-md-flex gap-4">
          <Link href="/#solutions" className="text-decoration-none text-body">Solutions</Link>
          <Link href="/#benefits" className="text-decoration-none text-body">Benefits</Link>
          <Link href="/#process" className="text-decoration-none text-body">Process</Link>
          <Link href="/#contact" className="text-decoration-none text-body">Contact</Link>
          <Link href="/pricing" className="text-decoration-none fw-medium">Pricing</Link>
        </nav>
        <button className="btn d-md-none border-0 p-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Pricing Hero */}
      <section className="bg-light py-5 py-md-7">
        <div className="container text-center">
          <h1 className="display-4 fw-light mb-4">Technology Solutions That Fit Your Budget</h1>
          <p className="lead text-secondary mx-auto mb-4 col-md-8">
            Enterprise-grade technology solutions without enterprise-level complexity or cost. Choose the package that best fits your business needs.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-5 py-md-7">
        <div className="container">
          <div className="row g-4">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.name} 
                className="col-md-4"
              >
                <div className={`card h-100 ${plan.highlighted ? 'border-primary shadow position-relative' : 'border'}`}>
                  {plan.highlighted && (
                    <div className="position-absolute top-0 start-50 translate-middle badge bg-primary px-3 py-2 rounded-pill">
                      Most Popular
                    </div>
                  )}
                  <div className="card-body p-4">
                    <h3 className="fs-3 fw-medium mb-2">{plan.name}</h3>
                    <div className="fs-2 fw-light mb-1">{plan.price}</div>
                    <p className="small fst-italic text-secondary mb-3">per user per month</p>
                    <p className="text-secondary mb-4">{plan.description}</p>
                    <ul className="list-unstyled mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="d-flex align-items-start mb-2">
                          <svg className="text-success flex-shrink-0 me-2 mt-1" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
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
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-light py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center">Frequently Asked Questions</h2>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item mb-3 border">
                  <h3 className="accordion-header">
                    <button className="accordion-button fw-medium" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                      What&apos;s included in the Password Manager?
                    </button>
                  </h3>
                  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div className="accordion-body text-secondary">
                      Our Password Manager includes secure credential storage, password generation, multi-factor authentication, and admin controls to manage team access to company accounts.
                    </div>
                  </div>
                </div>
                <div className="accordion-item mb-3 border">
                  <h3 className="accordion-header">
                    <button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                      How long does implementation typically take?
                    </button>
                  </h3>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body text-secondary">
                      For most small businesses, our Basic package can be implemented within 1-2 business days, Standard within 3-5 days, and Premium within 5-7 days, depending on your team size and existing infrastructure.
                    </div>
                  </div>
                </div>
                <div className="accordion-item mb-3 border">
                  <h3 className="accordion-header">
                    <button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                      Do these prices include all necessary software licenses?
                    </button>
                  </h3>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body text-secondary">
                      Yes, all packages include the necessary licenses for the specified features. There are no hidden costs or additional software purchases required.
                    </div>
                  </div>
                </div>
                <div className="accordion-item border">
                  <h3 className="accordion-header">
                    <button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                      What if my business needs change and I need to upgrade?
                    </button>
                  </h3>
                  <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body text-secondary">
                      You can upgrade your plan at any time. We&apos;ll prorate the difference and apply any unused portion of your current subscription to your new plan.
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
          <h2 className="fs-1 fw-light mb-4">Ready to Transform Your Business Technology?</h2>
          <p className="lead text-secondary col-md-8 mx-auto mb-5">
            Take the first step today to eliminate IT headaches and focus on what you do best: serving your customers and growing your business.
          </p>
          <Link 
            href="/#contact" 
            className="btn btn-dark btn-lg px-5 py-3"
          >
            Get Your IT Assessment
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