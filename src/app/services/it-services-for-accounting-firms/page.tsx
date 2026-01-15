import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT Services for Accounting Firms | CPA Firm Technology | Boximity",
  description:
    "Professional IT services for accounting firms. Specialized managed IT support for CPA firms with 5-15 employees. Accounting firm cybersecurity, QuickBooks management, and Cloud 5 Pack solutions. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "IT services for accounting firms",
    "accounting firm IT support",
    "managed IT for accountants",
    "CPA firm IT support",
    "accounting firm cybersecurity",
    "IT support for bookkeeping firms",
    "accounting practice technology",
    "CPA firm technology solutions",
    "accounting firm IT consulting",
    "IT outsourcing accounting firms",
  ],
  alternates: {
    canonical: "/services/it-services-for-accounting-firms",
  },
  openGraph: {
    url: "/services/it-services-for-accounting-firms",
    title: "IT Services for Accounting Firms | CPA Firm Technology | Boximity",
    description:
      "Professional IT services for accounting firms. Specialized managed IT support for CPA firms with 5-15 employees. Accounting firm cybersecurity, QuickBooks management, and Cloud 5 Pack solutions.",
  },
};

export default function ITForAccountingFirms() {
  return (
    <>
      {/* Hero Section */}
      <section className="position-relative py-5 py-md-7 text-white">
        <div className="position-absolute top-0 start-0 w-100 h-100">
          <div
            className="w-100 h-100 position-absolute"
            style={{ zIndex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)" }}
          ></div>
        </div>
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ zIndex: 0 }}
        >
          <Image
            src="/images/hero-background.jpg"
            alt="Accounting firm office with technology"
            fill
            priority
            loading="eager"
            sizes="(max-width: 768px) 100vw, 100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAGAAoDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+Nrw1oXhTX/hvodj4p0Pw7r99c+JvEtzfXWuaFpGuXsksVzEsE8tzq1jd3Usq28JN5dzpLdLHJ5WoSw273A/EeDckz16mNll+JzrLp4nHYqvUoxzXMstpVK1LEpVsRS9hictw8pyhCKr0L0IqrSqUuajVjyRb/wBH89zLhaGW5b/a2Gwue46ngsHhoV44XA5piqVOFbCKUIVfb4/GVFFTqTcsNW5p05QtVpTqU6cn/9k="
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            quality={70}
          />
        </div>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-light mb-4">
                IT Services for Accounting Firms
              </h1>
              <p className="lead mb-4">
                Specialized managed IT services designed specifically for
                accounting firms with 5-15 employees. Keep your CPA practice
                technology running smoothly while you focus on serving clients
                with our Cloud 5 Pack solution.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
                <Link href="/#contact" className="btn btn-light btn-lg">
                  Get Free IT Assessment
                </Link>
                <Link href="/pricing" className="btn btn-outline-light btn-lg">
                  View Cloud 5 Pack Pricing
                </Link>
              </div>
              <div className="d-flex align-items-center text-light">
                <svg
                  className="me-2"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <small>Serving accounting firms across Canada</small>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-lg">
                <div className="card-body p-4">
                  <h3 className="h4 mb-3">Cloud 5 Pack - $1,250/month</h3>
                  <p className="text-muted mb-3">
                    Everything your 5-10 person accounting firm needs:
                  </p>
                  <small className="text-muted d-block mb-3">
                    See pricing page for full details and firm sizes
                  </small>
                  <ul className="list-unstyled">
                    <li className="d-flex mb-2">
                      <svg
                        className="text-success flex-shrink-0 me-2 mt-1"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                      </svg>
                      24/7 Proactive Monitoring
                    </li>
                    <li className="d-flex mb-2">
                      <svg
                        className="text-success flex-shrink-0 me-2 mt-1"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                      </svg>
                      Advanced Cybersecurity
                    </li>
                    <li className="d-flex mb-2">
                      <svg
                        className="text-success flex-shrink-0 me-2 mt-1"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                      </svg>
                      Cloud Backup & Recovery
                    </li>
                    <li className="d-flex mb-2">
                      <svg
                        className="text-success flex-shrink-0 me-2 mt-1"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                      </svg>
                      Microsoft 365 Management
                    </li>
                    <li className="d-flex mb-2">
                      <svg
                        className="text-success flex-shrink-0 me-2 mt-1"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                      </svg>
                      Unlimited Help Desk Support
                    </li>
                  </ul>
                  <div className="mt-3 p-3 bg-light rounded">
                    <p className="mb-0 text-dark fw-medium">
                      ✓ No contracts • ✓ 30-day money-back guarantee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-4" style={{ backgroundColor: "#2b3035" }}>
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-auto">
              <small style={{ color: "#f8f9fa" }}>
                Trusted by accounting firms since 2020
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* Why IT Services for Accounting Firms Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            Why Accounting Firms Need Specialized IT Services
          </h2>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div
                    className="mb-4 icon-box d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mx-auto"
                    style={{ width: "4rem", height: "4rem" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      width="24"
                      height="24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Protect Client Financial Data
                  </h3>
                  <p className="text-secondary">
                    Accounting firms handle sensitive financial information
                    daily. Our accounting firm cybersecurity solutions include
                    advanced data protection, secure financial document
                    management, and compliance tools that safeguard client
                    confidentiality and meet CRA requirements.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div
                    className="mb-4 icon-box d-flex align-items-center justify-content-center bg-success text-white rounded-circle mx-auto"
                    style={{ width: "4rem", height: "4rem" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      width="24"
                      height="24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Never Miss Tax Deadlines
                  </h3>
                  <p className="text-secondary">
                    Stop wasting valuable billable time troubleshooting IT
                    issues. Our managed IT services for accounting firms ensure
                    your QuickBooks, tax software, and financial systems work
                    reliably so accountants can focus on tax preparation and
                    client advisory services.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div
                    className="mb-4 icon-box d-flex align-items-center justify-content-center bg-info text-white rounded-circle mx-auto"
                    style={{ width: "4rem", height: "4rem" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      width="24"
                      height="24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Meet Regulatory Requirements
                  </h3>
                  <p className="text-secondary">
                    CPA firms face strict regulatory requirements for data
                    security and retention. Our IT support for accounting firms
                    includes CRA compliance monitoring, secure financial data
                    management, and audit trails that help you meet accounting
                    industry standards and privacy regulations.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div
                    className="mb-4 icon-box d-flex align-items-center justify-content-center bg-warning text-white rounded-circle mx-auto"
                    style={{ width: "4rem", height: "4rem" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      width="24"
                      height="24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Stay Ahead of Accounting Tech Trends
                  </h3>
                  <p className="text-secondary">
                    Accounting technology evolves rapidly with new compliance
                    tools, cloud accounting platforms, and client portals. Our
                    managed IT for accountants includes regular technology
                    assessments and upgrades to ensure you always have access to
                    modern accounting practice management tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Are IT Services for Accounting Firms Section */}
      <section className="py-5 py-md-7 bg-alt">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
                What Are IT Services for Accounting Firms?
              </h2>
              <p className="mb-4">
                IT services for accounting firms refer to specialized technology
                management tailored to the unique needs of CPA practices. Unlike
                generic IT support, our solutions understand the critical
                importance of financial data security, tax deadline reliability,
                and QuickBooks integration requirements.
              </p>
              <p className="mb-4">
                Our accounting firm IT support services are specifically
                designed for small to medium-sized CPA firms, providing
                enterprise-grade technology solutions without the complexity or
                cost. We become your virtual IT department, handling everything
                from cybersecurity to system updates to technical support.
              </p>
              <div className="card border-primary">
                <div className="card-body">
                  <h4 className="h5 mb-3">
                    Accounting-First Technology Approach
                  </h4>
                  <p className="mb-0">
                    Unlike traditional IT companies that focus solely on
                    technology, our IT services for accounting firms prioritize
                    your CPA practice outcomes. We speak your language,
                    understand accounting industry challenges, and deliver
                    technology solutions that support tax preparation, client
                    services, and regulatory compliance.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h3 className="h4 mb-4">
                    Key Components of Our Accounting Firm IT Support
                  </h3>
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <div className="fs-2 mb-2">🔒</div>
                        <div className="fw-medium">Security</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <div className="fs-2 mb-2">⚡</div>
                        <div className="fw-medium">Monitoring</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <div className="fs-2 mb-2">💾</div>
                        <div className="fw-medium">Backup</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <div className="fs-2 mb-2">🛠️</div>
                        <div className="fw-medium">Support</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <div className="fs-2 mb-2">☁️</div>
                        <div className="fw-medium">Cloud</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <div className="fs-2 mb-2">📊</div>
                        <div className="fw-medium">Compliance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud 5 Pack Details */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            Cloud 5 Pack: Complete IT Services for Accounting Firms
          </h2>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="card shadow-lg border-0">
                <div className="card-header bg-primary text-white text-center py-4">
                  <h3 className="h2 mb-2">$1,250/month</h3>
                  <p className="mb-0">
                    For 5 users • No contracts • Cancel anytime
                  </p>
                  <small className="opacity-75">
                    See pricing page for full details and firm sizes
                  </small>
                </div>
                <div className="card-body p-4 p-md-5">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        🔒 Accounting Firm Cybersecurity
                      </h4>
                      <ul className="list-unstyled mb-4">
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Advanced protection against financial data breaches
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Secure QuickBooks and financial data management
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          CRA compliance monitoring and reporting
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Accounting industry security training
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        ⚡ 24/7 Proactive Monitoring
                      </h4>
                      <ul className="list-unstyled mb-4">
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Real-time monitoring for tax software and QuickBooks
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Automated maintenance for accounting applications
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Performance optimization for financial workflows
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Tax season reliability and deadline protection
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        💾 Secure Financial Data Backup & Recovery
                      </h4>
                      <ul className="list-unstyled mb-4">
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Encrypted client financial data backups
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          QuickBooks and tax return secure cloud storage
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Year-end processing disaster recovery
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Backup testing and CRA compliance verification
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        🛠️ Unlimited Help Desk Support
                      </h4>
                      <ul className="list-unstyled mb-4">
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Phone, email, and chat support for accounting staff
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Average 15-minute response time
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Remote troubleshooting for QuickBooks and tax software
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Accounting software training and guidance
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="text-center">
                    <Link
                      href="/#contact"
                      className="btn btn-primary btn-lg px-5"
                    >
                      Start Your Free Assessment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            Frequently Asked Questions About Accounting Firm IT Services
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
                      What makes your IT services different for accounting
                      firms?
                    </button>
                  </h3>
                  <div
                    id="faq1"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Our IT services for accounting firms are specifically
                      designed for CPA practices, with deep understanding of
                      financial data security, tax deadline pressures, and
                      QuickBooks integration requirements. Unlike generic IT
                      companies, we speak accounting language, understand CRA
                      compliance, and provide technology solutions that support
                      tax preparation, year-end processing, and client financial
                      services while protecting sensitive financial data.
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
                      How quickly can you implement IT services for our
                      accounting firm?
                    </button>
                  </h3>
                  <div
                    id="faq2"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Most accounting firms can be up and running with our IT
                      services within 1-2 weeks. We begin with a comprehensive
                      financial technology assessment to understand your current
                      QuickBooks setup and accounting workflows, then implement
                      our Cloud 5 Pack solution. For urgent tax season or
                      compliance concerns, we can often provide immediate
                      emergency support while the full implementation is
                      underway.
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
                      Do you understand CRA compliance requirements?
                    </button>
                  </h3>
                  <div
                    id="faq3"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Absolutely. Our accounting firm IT support includes
                      specialized CRA compliance monitoring for data security,
                      retention requirements, and audit trails. We implement
                      secure financial data management, encryption standards,
                      and backup procedures specifically designed for CPA firms
                      handling sensitive client financial information.
                    </div>
                  </div>
                </div>
                <div className="accordion-item mb-3 border">
                  <h3 className="accordion-header">
                    <button
                      className="accordion-button fw-medium collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#faq4"
                    >
                      What happens if we have an IT emergency during tax season?
                    </button>
                  </h3>
                  <div
                    id="faq4"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Our IT services for accounting firms include 24/7
                      proactive monitoring, which means we often detect and
                      resolve issues before they become emergencies. For
                      critical tax season situations, we provide priority
                      after-hours support through our accounting technology
                      specialists. Tax deadlines and year-end processing are
                      always prioritized to minimize business and client impact.
                    </div>
                  </div>
                </div>
                <div className="accordion-item border">
                  <h3 className="accordion-header">
                    <button
                      className="accordion-button fw-medium collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#faq5"
                    >
                      Can you work with our existing QuickBooks setup?
                    </button>
                  </h3>
                  <div
                    id="faq5"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Yes, our IT support for accounting firms is designed to
                      integrate seamlessly with QuickBooks, tax preparation
                      software, and other accounting applications. During
                      onboarding, we assess your current technology stack and
                      develop a migration plan that minimizes disruption to your
                      financial workflows while enhancing security and
                      reliability for tax season and year-end processing.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="position-relative py-5 py-md-7 text-white">
        <div className="position-absolute top-0 start-0 w-100 h-100">
          <div
            className="w-100 h-100 position-absolute"
            style={{ zIndex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)" }}
          ></div>
        </div>
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ zIndex: 0 }}
        >
          <Image
            src="/images/hero-background.jpg"
            alt="Accounting firm office with technology"
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAGAAoDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+Nrw1oXhTX/hvodj4p0Pw7r99c+JvEtzfXWuaFpGuXsksVzEsE8tzq1jd3Usq28JN5dzpLdLHJ5WoSw273A/EeDckz16mNll+JzrLp4nHYqvUoxzXMstpVK1LEpVsRS9hictw8pyhCKr0L0IqrSqUuajVjyRb/wBH89zLhaGW5b/a2Gwue46ngsHhoV44XA5piqVOFbCKUIVfb4/GVFFTqTcsNW5p05QtVpTqU6cn/9k="
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            quality={70}
          />
        </div>
        <div
          className="container position-relative text-center"
          style={{ zIndex: 2 }}
        >
          <h2 className="fs-1 fw-light mb-4">
            Ready to Transform Your Accounting Firm with Professional IT
            Services?
          </h2>
          <p className="lead mb-5 col-md-8 mx-auto">
            Join hundreds of CPA firms that have eliminated IT headaches and
            regained focus on what matters most - serving clients and meeting
            tax deadlines. Start with a free IT assessment today.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <Link href="/#contact" className="btn btn-light btn-lg px-5">
              Get Free IT Assessment
            </Link>
            <Link href="/pricing" className="btn btn-outline-light btn-lg px-5">
              View All Pricing Options
            </Link>
          </div>
          <div className="mt-4">
            <small className="text-light opacity-75">
              ✓ No contracts • ✓ 30-day money-back guarantee
            </small>
          </div>
        </div>
      </section>
    </>
  );
}
