import Link from "next/link";
import Image from "next/image";
import ContactForm from './components/ContactForm';

export default function Home() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="py-4 px-3 px-md-5 d-flex align-items-center justify-content-between">
        <div className="fs-4 fw-semibold">YOUR COMPANY</div>
        <nav className="d-none d-md-flex gap-4">
          <a href="#solutions" className="text-decoration-none text-body">Solutions</a>
          <a href="#benefits" className="text-decoration-none text-body">Benefits</a>
          <a href="#process" className="text-decoration-none text-body">Process</a>
          <a href="#contact" className="text-decoration-none text-body">Contact</a>
          <Link href="/pricing" className="text-decoration-none text-body">Pricing</Link>
        </nav>
        <button className="btn d-md-none border-0 p-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-grow-1">
        <section className="position-relative vh-75 d-flex align-items-center">
          <div className="position-absolute inset-0">
            <div className="w-100 h-100 bg-dark bg-opacity-75 position-absolute z-index-1"></div>
            <div className="w-100 h-100">
              <Image 
                src="/images/hero-background.jpg" 
                alt="Office setting with technology" 
                fill 
                priority
                className="object-fit-cover"
                quality={90}
              />
            </div>
          </div>
          <div className="container position-relative z-index-2">
            <div className="row">
              <div className="col-md-8 col-lg-6">
                <h1 className="display-4 fw-light mb-4 text-white">
                  Make Your Whole Team Tech-Savvy Without the Headache
                </h1>
                <p className="lead text-white mb-4">
                  Stop wasting time on technology management. Start focusing on what you do best. Small businesses deserve enterprise-grade solutions without the complexity or cost.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3">
                  <button className="btn btn-light">
                    Get Your IT Assessment
                  </button>
                  <Link href="/pricing" className="btn btn-outline-light">
                    See pricing options
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Challenge Section */}
        <section className="py-5 py-md-7">
          <div className="container">
            <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">The Technology Challenge Small Businesses Face Today</h2>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="card h-100 border">
                  <div className="card-body">
                    <div className="mb-4 icon-box d-flex align-items-center justify-content-center bg-light rounded-circle" style={{width: "3rem", height: "3rem"}}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="fs-4 fw-medium mb-3">Security Threats</h3>
                    <p className="text-secondary">Bad actors are constantly targeting your valuable business and customer data.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border">
                  <div className="card-body">
                    <div className="mb-4 icon-box d-flex align-items-center justify-content-center bg-light rounded-circle" style={{width: "3rem", height: "3rem"}}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="fs-4 fw-medium mb-3">Wasted Time</h3>
                    <p className="text-secondary">Hours spent troubleshooting technology issues instead of serving your customers and growing your business.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border">
                  <div className="card-body">
                    <div className="mb-4 icon-box d-flex align-items-center justify-content-center bg-light rounded-circle" style={{width: "3rem", height: "3rem"}}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="fs-4 fw-medium mb-3">Employee Frustration</h3>
                    <p className="text-secondary">Staff turnover increases when technology consistently fails and prevents efficient work.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-5 py-md-7 bg-light">
          <div className="container">
            <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">Our Small Business Cloud Bundle</h2>
            <div className="row">
              <div className="col-md-6 mb-5 mb-md-0">
                <p className="mb-4 text-body">
                  Technology is advancing at an unprecedented pace, and it&apos;s completely understandable why keeping up can feel overwhelming, especially when you have a business to run.
                </p>
                <p className="mb-4 text-body">
                  You&apos;re not alone in this—many smart, capable business owners seek help to manage these complexities so they can focus on what they do best.
                </p>
                <p className="text-body">
                  With decades of experience in corporate technology solutions, we understand the rapid pace of technological advancement. Our team stays ahead of the latest developments, ensuring your business has the most effective solutions available.
                </p>
              </div>
              <div className="col-md-6">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h3 className="fs-4 fw-medium mb-4">Everything your 5-10 person team needs:</h3>
                    <ul className="list-unstyled">
                      <li className="d-flex mb-3">
                        <svg className="text-success flex-shrink-0 me-2" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <div>
                          <span className="fw-medium">Secure Password Management</span>
                          <p className="text-secondary small mb-0">Protect critical business accounts with enterprise-grade security</p>
                        </div>
                      </li>
                      <li className="d-flex mb-3">
                        <svg className="text-success flex-shrink-0 me-2" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <div>
                          <span className="fw-medium">Professional Web Hosting</span>
                          <p className="text-secondary small mb-0">Keep your online presence reliable and fast</p>
                        </div>
                      </li>
                      <li className="d-flex mb-3">
                        <svg className="text-success flex-shrink-0 me-2" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <div>
                          <span className="fw-medium">Business Email Solutions</span>
                          <p className="text-secondary small mb-0">Communicate professionally with customers and partners</p>
                        </div>
                      </li>
                      <li className="d-flex">
                        <svg className="text-success flex-shrink-0 me-2" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <div>
                          <span className="fw-medium">Microsoft Collaboration Tools</span>
                          <p className="text-secondary small mb-0">Enable your team to work together seamlessly</p>
                        </div>
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-light rounded">
                      <p className="fw-medium mb-0">All managed by experts, so you don&apos;t have to become one.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Process Section */}
        <section id="process" className="py-5 py-md-7">
          <div className="container">
            <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">Our Simple Process Gets You Up and Running Fast</h2>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{width: "4rem", height: "4rem"}}>01</div>
                <h3 className="fs-4 fw-medium mb-3">Share Your Team Structure</h3>
                <p className="text-secondary">Outline staff in a contact list including job functions, contact information, and systems currently used.</p>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{width: "4rem", height: "4rem"}}>02</div>
                <h3 className="fs-4 fw-medium mb-3">Review Your Current IT Investment</h3>
                <p className="text-secondary">Submit your past year&apos;s IT spend and information about your most recent technology purchases.</p>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{width: "4rem", height: "4rem"}}>03</div>
                <h3 className="fs-4 fw-medium mb-3">Simple Setup</h3>
                <p className="text-secondary">We&apos;ll email installation instructions for our management tool to your team, ensuring all systems are properly configured.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-5 py-md-7 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-md-6 mb-5 mb-md-0">
                <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">What You&apos;ll Experience With Our Solution</h2>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex">
                    <svg className="text-success flex-shrink-0 me-3" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-body mb-0"><span className="fw-medium">Reduced stress and anxiety</span> - No more worrying about security or system failures</p>
                  </div>
                  <div className="d-flex">
                    <svg className="text-success flex-shrink-0 me-3" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-body mb-0"><span className="fw-medium">Increased productivity</span> - Less time troubleshooting, more time growing your business</p>
                  </div>
                  <div className="d-flex">
                    <svg className="text-success flex-shrink-0 me-3" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-body mb-0"><span className="fw-medium">Enhanced security</span> - Professional protection for your critical business data</p>
                  </div>
                  <div className="d-flex">
                    <svg className="text-success flex-shrink-0 me-3" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-body mb-0"><span className="fw-medium">Streamlined communication</span> - Better tools mean better teamwork</p>
                  </div>
                  <div className="d-flex">
                    <svg className="text-success flex-shrink-0 me-3" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-body mb-0"><span className="fw-medium">Competitive advantage</span> - Access to technology usually reserved for larger companies</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">The Real Cost of Inadequate Technology</h2>
                <div className="card mb-3">
                  <div className="card-body">
                    <p className="fs-3 fw-light mb-2">Up to <span className="fw-bold text-danger">2 weeks</span></p>
                    <p className="text-secondary mb-0">of downtime after a cyber incident</p>
                  </div>
                </div>
                <div className="card mb-3">
                  <div className="card-body">
                    <p className="fs-3 fw-light mb-2">Employee productivity losses of <span className="fw-bold text-danger">up to 22%</span></p>
                    <p className="text-secondary mb-0">due to technology issues</p>
                  </div>
                </div>
                <div className="card mb-3">
                  <div className="card-body">
                    <p className="fs-3 fw-light mb-2">Average data breach costs of <span className="fw-bold text-danger">$108,000</span></p>
                    <p className="text-secondary mb-0">for small businesses</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <p className="fs-3 fw-light mb-2"><span className="fw-bold text-danger">60% higher</span> employee turnover</p>
                    <p className="text-secondary mb-0">when technology consistently fails</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-5 py-md-7">
          <div className="container">
            <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">Why Small Businesses Choose Our Cloud Bundle</h2>
            <div className="row g-4 mb-5">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <p className="fs-5 fst-italic mb-4 text-body">
                      &quot;Since switching to their cloud bundle, we&apos;ve eliminated at least 5 hours of IT headaches each week. Now we&apos;re focusing that time on serving our customers instead.&quot;
                    </p>
                    <div className="d-flex align-items-center">
                      <div className="bg-secondary rounded-circle me-3" style={{width: "3rem", height: "3rem"}}></div>
                      <div>
                        <p className="fw-medium mb-0">Sarah K.</p>
                        <p className="small text-secondary mb-0">Accounting Firm Owner</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body">
                    <p className="fs-5 fst-italic mb-4 text-body">
                      &quot;Their team made the transition painless. We&apos;re now more secure and productive than ever, all while spending less on technology.&quot;
                    </p>
                    <div className="d-flex align-items-center">
                      <div className="bg-secondary rounded-circle me-3" style={{width: "3rem", height: "3rem"}}></div>
                      <div>
                        <p className="fw-medium mb-0">Michael T.</p>
                        <p className="small text-secondary mb-0">Legal Practice</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="fw-medium mb-4">Trusted by over 200 small businesses in your region</p>
              <div className="d-flex justify-content-center gap-4">
                <div className="bg-light rounded" style={{width: "6rem", height: "3rem"}}></div>
                <div className="bg-light rounded" style={{width: "6rem", height: "3rem"}}></div>
                <div className="bg-light rounded" style={{width: "6rem", height: "3rem"}}></div>
                <div className="bg-light rounded" style={{width: "6rem", height: "3rem"}}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-5 py-md-7 bg-light">
          <div className="container">
            <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">Limited Time Offer for Small Businesses</h2>
            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6">
                <div className="card shadow">
                  <div className="card-body p-4 p-md-5">
                    <h3 className="fs-3 fw-medium mb-4 text-center">Complete Cloud Bundle: $99/month per user</h3>
                    <ul className="list-unstyled mb-4">
                      <li className="d-flex align-items-center mb-2">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Password Manager
                      </li>
                      <li className="d-flex align-items-center mb-2">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Web Hosting
                      </li>
                      <li className="d-flex align-items-center mb-2">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Business Email
                      </li>
                      <li className="d-flex align-items-center mb-2">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Microsoft Collaboration Tools
                      </li>
                      <li className="d-flex align-items-center mb-2">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Email Support
                      </li>
                      <li className="d-flex align-items-center mb-2">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Quarterly IT Assessment
                      </li>
                      <li className="d-flex align-items-center mb-2">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Reduced Web Design Rates
                      </li>
                      <li className="d-flex align-items-center">
                        <svg className="text-success flex-shrink-0 me-2" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Server Monitoring
                      </li>
                    </ul>
                    <div className="alert alert-success mb-4 text-center">
                      <p className="fw-medium mb-0">First month free when you sign up for annual service</p>
                    </div>
                    <button className="btn btn-dark w-100 py-3 fw-medium">
                      Get Your Customized IT Assessment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-5 py-md-7">
          <div className="container">
            <div className="row">
              <div className="col-md-6 mb-5 mb-md-0">
                <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">Take the First Step Today</h2>
                <p className="mb-4 text-body">
                  We&apos;re ready to help your small business leverage the power of enterprise-grade technology without the enterprise-level complexity or cost.
                </p>
                <div className="mb-4">
                  <h3 className="fs-4 fw-medium mb-2">Contact Us</h3>
                  <p className="text-secondary mb-1">123 Tech Avenue</p>
                  <p className="text-secondary mb-0">Your City, ST 12345</p>
                </div>
                <div className="mb-4">
                  <p className="text-secondary mb-1">support@yourcompany.com</p>
                  <p className="text-secondary mb-0">(555) 123-4567</p>
                </div>
                <div className="alert alert-secondary">
                  <p className="small fst-italic mb-0">
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
      <footer className="py-4 py-md-5 border-top">
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