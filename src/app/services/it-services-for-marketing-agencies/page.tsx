import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "IT Services for Marketing Agencies | Creative Agency Technology | Boximity",
  description:
    "Professional IT services for marketing agencies. Specialized managed IT support for creative agencies with 5-15 employees. Marketing agency cybersecurity, creative file management, and Cloud 5 Pack solutions. Starting at $1,250/month. Free IT assessment available.",
  keywords: [
    "IT services for marketing agencies",
    "agency IT services",
    "creative agency IT support",
    "marketing agency IT support",
    "marketing agency technology",
    "creative agency technology solutions",
    "marketing agency IT consulting",
    "IT support for creative agencies",
    "marketing firm IT services",
    "agency IT outsourcing",
  ],
  alternates: {
    canonical: "/services/it-services-for-marketing-agencies",
  },
  openGraph: {
    url: "/services/it-services-for-marketing-agencies",
    title:
      "IT Services for Marketing Agencies | Creative Agency Technology | Boximity",
    description:
      "Professional IT services for marketing agencies. Specialized managed IT support for creative agencies with 5-15 employees. Marketing agency cybersecurity, creative file management, and Cloud 5 Pack solutions.",
  },
};

export default function ITForMarketingAgencies() {
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
            alt="Marketing agency office with creative technology"
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
                IT Services for Marketing Agencies
              </h1>
              <p className="lead mb-4">
                Specialized managed IT services designed specifically for
                marketing agencies with 5-15 employees. Keep your creative
                workflow running smoothly while you focus on serving clients
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
                <small>Serving marketing agencies across Canada</small>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-lg">
                <div className="card-body p-4">
                  <h3 className="h4 mb-3">Cloud 5 Pack - $1,250/month</h3>
                  <p className="text-muted mb-3">
                    Everything your 5-10 person marketing agency needs:
                  </p>
                  <small className="text-muted d-block mb-3">
                    See pricing page for full details and agency sizes
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
                Trusted by marketing agencies since 2020
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* Why IT Services for Marketing Agencies Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 text-center border-bottom pb-3">
            Why Marketing Agencies Need Specialized IT Services
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
                    Protect Client Creative Assets
                  </h3>
                  <p className="text-secondary">
                    Marketing agencies handle valuable client intellectual
                    property daily - logos, campaigns, and creative assets. Our
                    marketing agency cybersecurity solutions include advanced
                    data protection, secure file sharing, and intellectual
                    property safeguards that protect your agency's and clients'
                    creative work.
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
                    Never Miss Campaign Deadlines
                  </h3>
                  <p className="text-secondary">
                    Stop wasting valuable creative time troubleshooting IT
                    issues. Our managed IT services for marketing agencies
                    ensure your design software, project management tools, and
                    collaboration platforms work reliably so your team can focus
                    on delivering outstanding client campaigns.
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3 text-center">
                    Enable Creative Collaboration
                  </h3>
                  <p className="text-secondary">
                    Marketing teams thrive on collaboration, but outdated
                    technology can hinder creativity. Our IT support for
                    marketing agencies includes secure cloud collaboration
                    tools, version control for creative assets, and seamless
                    integration with design software to keep your creative
                    workflow flowing smoothly.
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
                    Stay Ahead of Marketing Tech Trends
                  </h3>
                  <p className="text-secondary">
                    Marketing technology evolves rapidly with new social media
                    platforms, analytics tools, and content management systems.
                    Our managed IT for marketing agencies includes regular
                    technology assessments and upgrades to ensure you always
                    have access to cutting-edge marketing tools and platforms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Are IT Services for Marketing Agencies Section */}
      <section className="py-5 py-md-7 bg-alt">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
                What Are IT Services for Marketing Agencies?
              </h2>
              <p className="mb-4">
                IT services for marketing agencies refer to specialized
                technology management tailored to the unique needs of creative
                marketing firms. Unlike generic IT support, our solutions
                understand the critical importance of creative file security,
                campaign deadline reliability, and design software integration
                requirements.
              </p>
              <p className="mb-4">
                Our marketing agency IT support services are specifically
                designed for small to medium-sized creative agencies, providing
                enterprise-grade technology solutions without the complexity or
                cost. We become your virtual IT department, handling everything
                from cybersecurity to system updates to technical support.
              </p>
              <div className="card border-primary">
                <div className="card-body">
                  <h4 className="h5 mb-3">
                    Creativity-First Technology Approach
                  </h4>
                  <p className="mb-0">
                    Unlike traditional IT companies that focus solely on
                    technology, our IT services for marketing agencies
                    prioritize your creative process and client outcomes. We
                    speak marketing language, understand campaign workflows, and
                    deliver technology solutions that enhance creativity while
                    protecting valuable intellectual property.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h3 className="h4 mb-4">
                    Key Components of Our Marketing Agency IT Support
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
                        <div className="fs-2 mb-2">🎨</div>
                        <div className="fw-medium">Creative</div>
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
            Cloud 5 Pack: Complete IT Services for Marketing Agencies
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
                    See pricing page for full details and agency sizes
                  </small>
                </div>
                <div className="card-body p-4 p-md-5">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        🔒 Marketing Agency Cybersecurity
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
                          Advanced protection against creative asset theft
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
                          Secure client work and intellectual property
                          protection
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
                          Design file security and version control
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
                          Creative industry security training
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
                          Real-time monitoring for design software and creative
                          tools
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
                          Automated maintenance for Adobe Creative Suite
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
                          Performance optimization for large creative files
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
                          Campaign deadline reliability and protection
                        </li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h4 className="h5 mb-3 text-primary">
                        💾 Creative File Backup & Recovery
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
                          Encrypted client creative asset backups
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
                          Campaign materials and design file secure cloud
                          storage
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
                          Quick disaster recovery for campaign deadlines
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
                          Backup testing and creative workflow verification
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
                          Phone, email, and chat support for creative teams
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
                          Remote troubleshooting for design software
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
                          Creative software training and guidance
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
            Frequently Asked Questions About Marketing Agency IT Services
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
                      What makes your IT services different for marketing
                      agencies?
                    </button>
                  </h3>
                  <div
                    id="faq1"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Our IT services for marketing agencies are specifically
                      designed for creative firms, with deep understanding of
                      intellectual property protection, campaign deadline
                      pressures, and design software integration requirements.
                      Unlike generic IT companies, we speak creative language,
                      understand agency workflows, and provide technology
                      solutions that protect valuable creative assets while
                      enhancing collaboration and meeting client deadlines.
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
                      marketing agency?
                    </button>
                  </h3>
                  <div
                    id="faq2"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Most marketing agencies can be up and running with our IT
                      services within 1-2 weeks. We begin with a comprehensive
                      creative technology assessment to understand your current
                      design software setup and agency workflows, then implement
                      our Cloud 5 Pack solution. For urgent campaign or creative
                      asset concerns, we can often provide immediate emergency
                      support while the full implementation is underway.
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
                      Do you understand intellectual property protection needs?
                    </button>
                  </h3>
                  <div
                    id="faq3"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Absolutely. Our marketing agency IT support includes
                      specialized intellectual property protection for client
                      work, logos, campaigns, and creative assets. We implement
                      advanced security measures, secure file sharing, and
                      version control systems specifically designed for creative
                      agencies handling valuable client intellectual property.
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
                      What happens if we have an IT emergency during a campaign
                      deadline?
                    </button>
                  </h3>
                  <div
                    id="faq4"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Our IT services for marketing agencies include 24/7
                      proactive monitoring, which means we often detect and
                      resolve issues before they become emergencies. For
                      critical campaign situations, we provide priority
                      after-hours support through our creative technology
                      specialists. Campaign deadlines and client presentations
                      are always prioritized to minimize business and creative
                      impact.
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
                      Can you work with our existing design software?
                    </button>
                  </h3>
                  <div
                    id="faq5"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body text-secondary">
                      Yes, our IT support for marketing agencies is designed to
                      integrate seamlessly with Adobe Creative Suite, design
                      software, project management platforms, and other creative
                      tools. During onboarding, we assess your current
                      technology stack and develop a migration plan that
                      minimizes disruption to your creative workflows while
                      enhancing security and reliability for campaign production
                      and client delivery.
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
            alt="Marketing agency office with creative technology"
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
            Ready to Transform Your Marketing Agency with Professional IT
            Services?
          </h2>
          <p className="lead mb-5 col-md-8 mx-auto">
            Join hundreds of creative agencies that have eliminated IT headaches
            and regained focus on what matters most - delivering outstanding
            client campaigns. Start with a free IT assessment today.
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
