import Link from "next/link";
import Image from "next/image";
import ContactForm from './components/ContactForm';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="py-6 px-8 md:px-16 flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tight">YOUR COMPANY</div>
        <nav className="hidden md:flex space-x-8">
          <a href="#solutions" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Solutions</a>
          <a href="#benefits" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Benefits</a>
          <a href="#process" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Process</a>
          <a href="#contact" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact</a>
          <Link href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Pricing</Link>
        </nav>
        <button className="md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative h-[80vh] flex items-center">
          <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-r from-gray-900/95 to-gray-900/70 absolute z-10"></div>
        <div className="w-full h-full">
          <Image 
            src="/images/hero-background.jpg" 
            alt="Office setting with technology" 
            fill 
            priority
            className="object-cover"
            quality={90}
          />
        </div>
          </div>
          <div className="container mx-auto px-8 md:px-16 z-10 relative">
        <h1 className="text-4xl md:text-6xl font-light mb-6 text-white max-w-2xl leading-tight">
          Make Your Whole Team Tech-Savvy Without the Headache
        </h1>
        <p className="text-lg text-gray-200 max-w-xl mb-8">
          Stop wasting time on technology management. Start focusing on what you do best. Small businesses deserve enterprise-grade solutions without the complexity or cost.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 transition-colors">
            Get Your IT Assessment
          </button>
          <Link href="/pricing" className="px-8 py-3 bg-transparent border border-white text-white hover:bg-white/10 transition-colors">
            See pricing options
          </Link>
        </div>
          </div>
        </section>

        {/* The Challenge Section */}
        <section className="py-24 px-8 md:px-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-light mb-16 border-b pb-4">The Technology Challenge Small Businesses Face Today</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-4">Security Threats</h3>
                <p className="text-gray-600 dark:text-gray-400">Bad actors are constantly targeting your valuable business and customer data.</p>
              </div>
              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-4">Wasted Time</h3>
                <p className="text-gray-600 dark:text-gray-400">Hours spent troubleshooting technology issues instead of serving your customers and growing your business.</p>
              </div>
              <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-4">Employee Frustration</h3>
                <p className="text-gray-600 dark:text-gray-400">Staff turnover increases when technology consistently fails and prevents efficient work.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-24 px-8 md:px-16 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto">
            <h2 className="text-3xl font-light mb-16 border-b pb-4">Our Small Business Cloud Bundle</h2>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 md:pr-16 mb-12 md:mb-0">
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                  Technology is advancing at an unprecedented pace, and it&apos;s completely understandable why keeping up can feel overwhelming, especially when you have a business to run.
                </p>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                  You&apos;re not alone in this—many smart, capable business owners seek help to manage these complexities so they can focus on what they do best.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  With decades of experience in corporate technology solutions, we understand the rapid pace of technological advancement. Our team stays ahead of the latest developments, ensuring your business has the most effective solutions available.
                </p>
              </div>
              <div className="md:w-1/2 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-medium mb-6">Everything your 5-10 person team needs:</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div>
                      <span className="font-medium">Secure Password Management</span>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Protect critical business accounts with enterprise-grade security</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div>
                      <span className="font-medium">Professional Web Hosting</span>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Keep your online presence reliable and fast</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div>
                      <span className="font-medium">Business Email Solutions</span>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Communicate professionally with customers and partners</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div>
                      <span className="font-medium">Microsoft Collaboration Tools</span>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Enable your team to work together seamlessly</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="font-medium">All managed by experts, so you don't have to become one.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Process Section */}
        <section id="process" className="py-24 px-8 md:px-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-light mb-16 border-b pb-4">Our Simple Process Gets You Up and Running Fast</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full mb-6">01</div>
                <h3 className="text-xl font-medium mb-4">Share Your Team Structure</h3>
                <p className="text-gray-600 dark:text-gray-400">Outline staff in a contact list including job functions, contact information, and systems currently used.</p>
              </div>
              <div>
                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full mb-6">02</div>
                <h3 className="text-xl font-medium mb-4">Review Your Current IT Investment</h3>
                <p className="text-gray-600 dark:text-gray-400">Submit your past year&apos;s IT spend and information about your most recent technology purchases.</p>
              </div>
              <div>
                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full mb-6">03</div>
                <h3 className="text-xl font-medium mb-4">Simple Setup</h3>
                <p className="text-gray-600 dark:text-gray-400">We&apos;ll email installation instructions for our management tool to your team, ensuring all systems are properly configured.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 px-8 md:px-16 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 mb-12 md:mb-0">
                <h2 className="text-3xl font-light mb-8 border-b pb-4">What You&apos;ll Experience With Our Solution</h2>
                <div className="space-y-6">
                  <div className="flex">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Reduced stress and anxiety</span> - No more worrying about security or system failures</p>
                  </div>
                  <div className="flex">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Increased productivity</span> - Less time troubleshooting, more time growing your business</p>
                  </div>
                  <div className="flex">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Enhanced security</span> - Professional protection for your critical business data</p>
                  </div>
                  <div className="flex">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Streamlined communication</span> - Better tools mean better teamwork</p>
                  </div>
                  <div className="flex">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Competitive advantage</span> - Access to technology usually reserved for larger companies</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 md:pl-16">
                <h2 className="text-3xl font-light mb-8 border-b pb-4">The Real Cost of Inadequate Technology</h2>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                  <p className="text-2xl font-light mb-2">Up to <span className="font-bold text-red-500">2 weeks</span></p>
                  <p className="text-gray-600 dark:text-gray-400">of downtime after a cyber incident</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                  <p className="text-2xl font-light mb-2">Employee productivity losses of <span className="font-bold text-red-500">up to 22%</span></p>
                  <p className="text-gray-600 dark:text-gray-400">due to technology issues</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                  <p className="text-2xl font-light mb-2">Average data breach costs of <span className="font-bold text-red-500">$108,000</span></p>
                  <p className="text-gray-600 dark:text-gray-400">for small businesses</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <p className="text-2xl font-light mb-2"><span className="font-bold text-red-500">60% higher</span> employee turnover</p>
                  <p className="text-gray-600 dark:text-gray-400">when technology consistently fails</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-8 md:px-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-light mb-16 border-b pb-4">Why Small Businesses Choose Our Cloud Bundle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-lg italic mb-6 text-gray-700 dark:text-gray-300">
                  &quot;Since switching to their cloud bundle, we&apos;ve eliminated at least 5 hours of IT headaches each week. Now we&apos;re focusing that time on serving our customers instead.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full mr-4"></div>
                  <div>
                    <p className="font-medium">Sarah K.</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Accounting Firm Owner</p>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-lg italic mb-6 text-gray-700 dark:text-gray-300">
                  &quot;Their team made the transition painless. We&apos;re now more secure and productive than ever, all while spending less on technology.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full mr-4"></div>
                  <div>
                    <p className="font-medium">Michael T.</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Legal Practice</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium mb-6">Trusted by over 200 small businesses in your region</p>
              <div className="flex justify-center space-x-8">
                <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-8 md:px-16 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto">
            <h2 className="text-3xl font-light mb-16 border-b pb-4">Limited Time Offer for Small Businesses</h2>
            <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium mb-6 text-center">Complete Cloud Bundle: $99/month per user</h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Password Manager
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Web Hosting
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Business Email
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Microsoft Collaboration Tools
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Email Support
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Quarterly IT Assessment
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Reduced Web Design Rates
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Server Monitoring
                </li>
              </ul>
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded text-center mb-8">
                <p className="font-medium">First month free when you sign up for annual service</p>
              </div>
              <button className="w-full py-4 bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors rounded-lg font-medium">
                Get Your Customized IT Assessment
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-8 md:px-16">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 mb-12 md:mb-0">
                <h2 className="text-3xl font-light mb-8 border-b pb-4">Take the First Step Today</h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                  We&apos;re ready to help your small business leverage the power of enterprise-grade technology without the enterprise-level complexity or cost.
                </p>
                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-2">Contact Us</h3>
                  <p className="text-gray-600 dark:text-gray-400">123 Tech Avenue</p>
                  <p className="text-gray-600 dark:text-gray-400">Your City, ST 12345</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">support@yourcompany.com</p>
                  <p className="text-gray-600 dark:text-gray-400">(555) 123-4567</p>
                </div>
                <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="text-sm italic">
                    &quot;We value your confidence and the privilege to manage your corporate data and will not disclose any sensitive information.&quot;
                  </p>
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 md:px-16 border-t">
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