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
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="py-6 px-8 md:px-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">YOUR COMPANY</Link>
        <nav className="hidden md:flex space-x-8">
          <Link href="/#solutions" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Solutions</Link>
          <Link href="/#benefits" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Benefits</Link>
          <Link href="/#process" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Process</Link>
          <Link href="/#contact" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact</Link>
          <Link href="/pricing" className="text-gray-900 dark:text-white font-medium">Pricing</Link>
        </nav>
        <button className="md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Pricing Hero */}
      <section className="bg-gray-100 dark:bg-gray-900 py-20 px-8 md:px-16">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-6">Technology Solutions That Fit Your Budget</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Enterprise-grade technology solutions without enterprise-level complexity or cost. Choose the package that best fits your business needs.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 px-8 md:px-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.name} 
                className={`border p-8 rounded-lg flex flex-col ${plan.highlighted ? 'border-2 border-gray-900 dark:border-white shadow-lg relative' : 'border-gray-200 dark:border-gray-700'}`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-1 text-sm rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-medium mb-2">{plan.name}</h3>
                <div className="text-3xl font-light mb-1">{plan.price}</div>
                <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-4">per user per month</p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
                <div className="flex-grow">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link 
                  href={`/checkout?plan=${plan.name}`}
                  className={`w-full py-3 inline-block text-center ${plan.highlighted ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600'} hover:opacity-90 transition-opacity`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-100 dark:bg-gray-900 py-16 px-8 md:px-16">
        <div className="container mx-auto">
          <h2 className="text-3xl font-light mb-12 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-xl font-medium mb-3">What&apos;s included in the Password Manager?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our Password Manager includes secure credential storage, password generation, multi-factor authentication, and admin controls to manage team access to company accounts.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3">How long does implementation typically take?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                For most small businesses, our Basic package can be implemented within 1-2 business days, Standard within 3-5 days, and Premium within 5-7 days, depending on your team size and existing infrastructure.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3">Do these prices include all necessary software licenses?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, all packages include the necessary licenses for the specified features. There are no hidden costs or additional software purchases required.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3">What if my business needs change and I need to upgrade?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You can upgrade your plan at any time. We&apos;ll prorate the difference and apply any unused portion of your current subscription to your new plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-8 md:px-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-light mb-6">Ready to Transform Your Business Technology?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Take the first step today to eliminate IT headaches and focus on what you do best: serving your customers and growing your business.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              href="/#contact" 
              className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
            >
              Get Your IT Assessment
            </Link>
          </div>
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