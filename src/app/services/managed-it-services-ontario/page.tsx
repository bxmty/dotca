import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Managed IT Services Ontario | Professional IT Support | Boximity",
  description:
    "Expert managed IT services for Ontario businesses. Cloud 5 Pack includes 24/7 monitoring, cybersecurity, cloud backup, and Microsoft 365 management. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "managed IT services Ontario",
    "IT support Ontario",
    "managed service provider Ontario",
    "MSP Ontario",
    "IT services Ontario",
    "cloud IT services Ontario",
    "business IT support Ontario",
    "Ontario IT managed services",
    "professional IT services Ontario",
    "IT outsourcing Ontario",
  ],
  alternates: {
    canonical: "/services/managed-it-services-ontario",
  },
  openGraph: {
    url: "/services/managed-it-services-ontario",
    title: "Managed IT Services Ontario | Professional IT Support | Boximity",
    description:
      "Expert managed IT services for Ontario businesses. Cloud 5 Pack includes 24/7 monitoring, cybersecurity, cloud backup, and Microsoft 365 management.",
  },
};

export default function ManagedITServicesOntario() {
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
            alt="Office setting with technology"
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
                Managed IT Services Ontario
              </h1>
              <p className="lead mb-4">
                Professional managed IT services designed specifically for
                Ontario businesses. Keep your technology running smoothly while
                you focus on growing your business with our Cloud 5 Pack
                solution.
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
                <small>
                  Serving Toronto, Ottawa, Hamilton, London & surrounding areas
                </small>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-lg">
                <div className="card-body p-4">
                  <h3 className="h4 mb-3">Cloud 5 Pack - $1,250/month</h3>
                  <p className="text-muted mb-3">
                    Everything your 5-user team needs:
                  </p>
                  <small className="text-muted d-block mb-3">
                    See pricing page for full details and team sizes
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
                Trusted by Ontario businesses since 2020
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* Why Managed IT Services Ontario Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            Why Ontario Businesses Choose Managed IT Services
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Reduce Business Risk
                  </h3>
                  <p className="text-secondary">
                    Ontario businesses face unique cybersecurity threats and
                    compliance requirements. Our managed IT services Ontario
                    include advanced protection against ransomware, data
                    breaches, and system failures that could cost your business
                    thousands of dollars.
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Increase Productivity
                  </h3>
                  <p className="text-secondary">
                    Stop wasting valuable time troubleshooting IT issues. Our
                    managed IT services Ontario ensure your systems work
                    reliably so your team can focus on what matters most -
                    serving clients and growing your Ontario business.
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Control Costs
                  </h3>
                  <p className="text-secondary">
                    Predictable monthly pricing with our managed IT services
                    Ontario eliminates unexpected IT expenses. Know exactly what
                    you'll pay each month without surprise repair bills or
                    emergency IT support costs.
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
                    Stay Ahead of Technology
                  </h3>
                  <p className="text-secondary">
                    Technology evolves rapidly, and Ontario businesses need to
                    keep pace. Our managed IT services Ontario include regular
                    technology assessments and upgrades to ensure you always
                    have access to modern tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Managed IT Services Section */}
      <section className="py-5 py-md-7 bg-alt">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
                What Are Managed IT Services Ontario?
              </h2>
              <p className="mb-4">
                Managed IT services Ontario refer to the practice of outsourcing
                your business technology management to a trusted partner.
                Instead of handling IT issues internally or hiring full-time IT
                staff, you subscribe to a comprehensive service that monitors,
                maintains, and supports all your technology infrastructure.
              </p>
              <p className="mb-4">
                Our managed IT services Ontario are specifically designed for
                small to medium-sized businesses in Ontario, providing
                enterprise-grade technology solutions without the
                enterprise-level complexity or cost. We become your virtual IT
                department, handling everything from cybersecurity to system
                updates to technical support.
              </p>
              <div className="card border-primary">
                <div className="card-body">
                  <h4 className="h5 mb-3">The Business-First Difference</h4>
                  <p className="mb-0">
                    Unlike traditional IT companies that focus solely on
                    technology, our managed IT services Ontario prioritize your
                    business outcomes. We speak your language, understand your
                    challenges, and deliver technology solutions that drive real
                    business results.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h3 className="h4 mb-4">
                    Key Components of Our Managed IT Services Ontario
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
            Cloud 5 Pack: Complete Managed IT Services Ontario
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
                    See pricing page for full details and team sizes
                  </small>
                </div>
                <div className="card-body p-4 p-md-5">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        🔒 Advanced Cybersecurity
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
                          Multi-layered protection against ransomware
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
                          Advanced endpoint protection
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
                          Email security and filtering
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
                          Security awareness training
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
                          Real-time system monitoring
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
                          Automated maintenance and updates
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
                          Performance optimization
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
                          Issue prevention and alerts
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        💾 Cloud Backup & Recovery
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
                          Automated daily backups
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
                          Secure off-site storage
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
                          Quick disaster recovery
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
                          Backup testing and verification
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
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.97a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Phone, email, and chat support
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.97a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
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
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.97a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          Remote troubleshooting
                        </li>
                        <li className="d-flex mb-2">
                          <svg
                            className="text-success flex-shrink-0 me-2 mt-1"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.97a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                          </svg>
                          User training and guidance
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

      {/* Service Areas */}
      <section className="py-5 py-md-7 bg-alt">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            Managed IT Services Ontario Coverage
          </h2>
          <p className="lead text-center mb-5">
            We provide managed IT services Ontario-wide, with local expertise
            and rapid response times across major business centers.
          </p>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body">
                  <div className="fs-1 mb-3">🏢</div>
                  <h4 className="h5 mb-3">Toronto</h4>
                  <p className="text-secondary small mb-3">
                    GTA's business hub with specialized support for professional
                    services firms, financial institutions, and tech companies.
                  </p>
                  <small className="text-muted">Response: &lt; 2 hours</small>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body">
                  <div className="fs-1 mb-3">🏛️</div>
                  <h4 className="h5 mb-3">Ottawa</h4>
                  <p className="text-secondary small mb-3">
                    Government and research sector expertise with focus on
                    compliance and secure communications.
                  </p>
                  <small className="text-muted">Response: &lt; 4 hours</small>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body">
                  <div className="fs-1 mb-3">🏭</div>
                  <h4 className="h5 mb-3">Hamilton</h4>
                  <p className="text-secondary small mb-3">
                    Manufacturing and logistics support with industrial IT
                    solutions and remote monitoring capabilities.
                  </p>
                  <small className="text-muted">Response: &lt; 3 hours</small>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body">
                  <div className="card-body">
                    <div className="fs-1 mb-3">🌾</div>
                    <h4 className="h5 mb-3">London</h4>
                    <p className="text-secondary small mb-3">
                      Agricultural and healthcare sector IT support with
                      specialized compliance and data management solutions.
                    </p>
                    <small className="text-muted">Response: &lt; 3 hours</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-5">
            <p className="mb-4">
              Don't see your city? We serve all of Ontario with our managed IT
              services.
            </p>
            <Link href="/#contact" className="btn btn-outline-primary">
              Check Service Availability
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            Frequently Asked Questions About Managed IT Services Ontario
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
                      What makes your managed IT services Ontario different from
                      others?
                    </button>
                  </h3>
                  <div
                    id="faq1"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Our managed IT services Ontario are designed specifically
                      for small businesses, with a business-first approach that
                      prioritizes your outcomes over technical complexity. We
                      speak your language, understand Ontario-specific
                      challenges, and provide personalized support that grows
                      with your business. Unlike large MSPs, we maintain the
                      personal touch and accessibility that small businesses
                      need.
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
                      How quickly can you start providing managed IT services
                      Ontario?
                    </button>
                  </h3>
                  <div
                    id="faq2"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Most Ontario businesses can be up and running with our
                      managed IT services within 1-2 weeks. We begin with a
                      comprehensive IT assessment to understand your current
                      setup, then implement our Cloud 5 Pack solution. For
                      urgent security concerns or critical issues, we can often
                      provide immediate emergency support while the full
                      implementation is underway.
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
                      Do you require long-term contracts for managed IT services
                      Ontario?
                    </button>
                  </h3>
                  <div
                    id="faq3"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      No long-term contracts required. Our managed IT services
                      Ontario operate month-to-month, giving you the flexibility
                      to adjust or cancel services as your business needs
                      change. This approach builds trust and ensures our
                      partnership remains mutually beneficial. We focus on
                      delivering ongoing value that keeps you as a satisfied
                      customer.
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
                      What happens if there's an IT emergency outside business
                      hours?
                    </button>
                  </h3>
                  <div
                    id="faq4"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Our managed IT services Ontario include 24/7 proactive
                      monitoring, which means we often detect and resolve issues
                      before they become emergencies. For true emergencies, we
                      provide after-hours support through our on-call technician
                      network. Critical business systems are prioritized, and we
                      work to minimize downtime and business impact.
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
                      Can you work with our existing IT setup?
                    </button>
                  </h3>
                  <div
                    id="faq5"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Absolutely. Our managed IT services Ontario are designed
                      to integrate with your existing technology infrastructure.
                      We assess your current setup during the onboarding process
                      and develop a migration plan that minimizes disruption.
                      Whether you have legacy systems, cloud applications, or a
                      mix of both, we can manage and optimize your entire IT
                      environment.
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
            alt="Office setting with technology"
            fill
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
        <div
          className="container position-relative text-center"
          style={{ zIndex: 2 }}
        >
          <h2 className="fs-1 fw-light mb-4">
            Ready to Transform Your Ontario Business with Managed IT Services?
          </h2>
          <p className="lead mb-5 col-md-8 mx-auto">
            Join hundreds of Ontario businesses that have eliminated IT
            headaches and regained focus on what matters most - growing their
            business. Start with a free IT assessment today.
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
