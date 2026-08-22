import Link from "next/link";
import Image from "next/image";
import CheckIcon from "./components/CheckIcon";
import ContactForm from "./components/ContactForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "IT That Just Works — Away From the Desk",
  description:
    "For businesses that live outside the office, we replace break-fix firefighting with technology that just works — one flat price, no surprises.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "IT That Just Works — Away From the Desk | Boximity MSP",
    description:
      "For businesses that live outside the office, we replace break-fix firefighting with technology that just works — one flat price, no surprises.",
  },
};

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="position-relative vh-75 d-flex align-items-center">
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
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAGAAoDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+Nrw1oXhTX/hvodj4p0Pw7r99c+JvEtzfXWuaFpGuXsksVzEsE8tzq1jd3Usq28JN5dzpLdLHJ5WoSw273A/EeDckz16mNll+JzrLp4nHYqvUoxzXMstpVK1LEpVsRS9hictw8pyhCKr0L0IqrSqUuajVjyRb/wBH89zLhaGW5b/a2Gwue46ngsHhoV44XA5piqVOFbCKUIVfb4/GVFFTqTcsNW5p05QtVpTqU6cn/9k="
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            quality={70}
          />
        </div>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row">
            <div className="col-md-8 col-lg-6">
              <h1 className="display-4 fw-light mb-4 text-white">
                IT that just works — for businesses whose work happens away from
                the desk.
              </h1>
              <p className="lead text-white mb-4">
                For businesses that live outside the office, we replace
                break-fix firefighting with technology that just works — one
                flat price, no surprises.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link href="#contact" className="btn btn-light">
                  Get a Business-First IT Assessment
                </Link>
                <Link href="/pricing" className="btn btn-outline-light">
                  See Pricing Options
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Reactive IT Trap */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
            The Reactive IT Trap
          </h2>
          <p className="lead text-body-secondary mb-5 col-lg-10">
            Too often, technology only gets attention after it breaks — leaving
            you stuck reacting to security threats, wasted time, and frustrated
            employees instead of running the business.
          </p>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border">
                <div className="card-body">
                  <div
                    className="mb-4 icon-box d-flex align-items-center justify-content-center bg-dark text-white rounded-circle"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <svg
                      aria-hidden="true"
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
                  <h3 className="fs-4 fw-medium mb-3">Security Threats</h3>
                  <p>
                    Bad actors are constantly targeting your valuable business
                    and customer data.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border">
                <div className="card-body">
                  <div
                    className="mb-4 icon-box d-flex align-items-center justify-content-center bg-dark text-white rounded-circle"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <svg
                      aria-hidden="true"
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
                  <h3 className="fs-4 fw-medium mb-3">Wasted Time</h3>
                  <p>
                    Hours spent troubleshooting technology issues instead of
                    serving your customers and growing your business.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border">
                <div className="card-body">
                  <div
                    className="mb-4 icon-box d-flex align-items-center justify-content-center bg-dark text-white rounded-circle"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <svg
                      aria-hidden="true"
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
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="fs-4 fw-medium mb-3">Employee Frustration</h3>
                  <p>
                    Staff turnover increases when technology consistently fails
                    and prevents efficient work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section
        id="solutions"
        className="py-5 py-md-7 bg-alt"
        data-bs-theme="dark"
      >
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">
            Our Small Business Cloud Bundle
          </h2>
          <div className="row">
            <div className="col-md-6 mb-5 mb-md-0">
              <p className="mb-4">
                Technology is advancing at an unprecedented pace, and it&apos;s
                completely understandable why keeping up can feel overwhelming,
                especially when you have a business to run.
              </p>
              <p className="mb-4">
                You&apos;re not alone in this—many smart, capable business
                owners seek help to manage these complexities so they can focus
                on what they do best, without really understanding the business
                impact — or being forced into decisions that don&apos;t fit how
                you actually work.
              </p>
              <p className="mb-0">
                Our founder has spent 19 years running application development
                and support for other businesses — that background is why we
                understand how fast technology moves, and why we build solutions
                that actually fit how you work, not the other way around.
              </p>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h3 className="fs-4 fw-medium mb-4">
                    Everything your 5-10 person team needs:
                  </h3>
                  <ul className="list-unstyled">
                    <li className="d-flex mb-3">
                      <CheckIcon />
                      <div>
                        <span className="fw-medium">
                          Secure Password Management
                        </span>
                        <p className="small mb-0">
                          Protect critical business accounts with
                          enterprise-grade security
                        </p>
                      </div>
                    </li>
                    <li className="d-flex mb-3">
                      <CheckIcon />
                      <div>
                        <span className="fw-medium">
                          Professional Web Hosting
                        </span>
                        <p className="small mb-0">
                          Keep your online presence reliable and fast
                        </p>
                      </div>
                    </li>
                    <li className="d-flex mb-3">
                      <CheckIcon />
                      <div>
                        <span className="fw-medium">
                          Business Email Solutions
                        </span>
                        <p className="small mb-0">
                          Communicate professionally with customers and partners
                        </p>
                      </div>
                    </li>
                    <li className="d-flex">
                      <CheckIcon />
                      <div>
                        <span className="fw-medium">
                          Microsoft Collaboration Tools
                        </span>
                        <p className="small mb-0">
                          Enable your team to work together seamlessly
                        </p>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-secondary text-white rounded">
                    <p className="fw-medium mb-0">
                      All managed by experts, so you don&apos;t have to become
                      one.
                    </p>
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
          <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">
            Our Simple Process Gets You Up and Running Fast
          </h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-4"
                style={{ width: "4rem", height: "4rem" }}
              >
                01
              </div>
              <h3 className="fs-4 fw-medium mb-3">Share Your Team Structure</h3>
              <p>
                Outline staff in a contact list including job functions, contact
                information, and systems currently used.
              </p>
            </div>
            <div className="col-md-4">
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-4"
                style={{ width: "4rem", height: "4rem" }}
              >
                02
              </div>
              <h3 className="fs-4 fw-medium mb-3">
                Review Your Current IT Investment
              </h3>
              <p>
                Submit your past year&apos;s IT spend and information about your
                most recent technology purchases.
              </p>
            </div>
            <div className="col-md-4">
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-4"
                style={{ width: "4rem", height: "4rem" }}
              >
                03
              </div>
              <h3 className="fs-4 fw-medium mb-3">Simple Setup</h3>
              <p>
                We&apos;ll email installation instructions for our management
                tool to your team, ensuring all systems are properly configured.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="py-5 py-md-7 bg-alt"
        data-bs-theme="dark"
      >
        <div className="container">
          <div className="row">
            <div className="col-md-6 mb-5 mb-md-0">
              <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
                What You&apos;ll Experience With Our Solution
              </h2>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex">
                  <CheckIcon className="text-success-emphasis flex-shrink-0 me-3" />
                  <p className="mb-0 fw-medium">
                    Greater Confidence in Decision-Making
                  </p>
                </div>
                <div className="d-flex">
                  <CheckIcon className="text-success-emphasis flex-shrink-0 me-3" />
                  <p className="mb-0 fw-medium">
                    Peace of Mind from Proactive Protection
                  </p>
                </div>
                <div className="d-flex">
                  <CheckIcon className="text-success-emphasis flex-shrink-0 me-3" />
                  <p className="mb-0 fw-medium">Enhanced Security</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
                The Real Cost of Inadequate Technology
              </h2>
              <div className="card mb-3">
                <div className="card-body bg-dark">
                  <p className="fs-3 fw-light mb-2 text-white">
                    Up to{" "}
                    <span className="fw-bold text-danger-emphasis">
                      2 weeks
                    </span>
                  </p>
                  <p className="text-white-50 mb-0">
                    of downtime after a cyber incident
                  </p>
                </div>
              </div>
              <div className="card mb-3">
                <div className="card-body bg-dark">
                  <p className="fs-3 fw-light mb-2 text-white">
                    Employee productivity losses of{" "}
                    <span className="fw-bold text-danger-emphasis">
                      up to 22%
                    </span>
                  </p>
                  <p className="text-white-50 mb-0">due to technology issues</p>
                </div>
              </div>
              <div className="card mb-3">
                <div className="card-body bg-dark">
                  <p className="fs-3 fw-light mb-2 text-white">
                    Average data breach costs of{" "}
                    <span className="fw-bold text-danger-emphasis">
                      $108,000
                    </span>
                  </p>
                  <p className="text-white-50 mb-0">for small businesses</p>
                </div>
              </div>
              <div className="card">
                <div className="card-body bg-dark">
                  <p className="fs-3 fw-light mb-2 text-white">
                    <span className="fw-bold text-danger-emphasis">
                      60% higher
                    </span>{" "}
                    employee turnover
                  </p>
                  <p className="text-white-50 mb-0">
                    when technology consistently fails
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-5 py-md-7">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">
            Our Guarantees
          </h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="h-100">
                <p className="fs-5 fw-medium mb-0">
                  Every recommendation comes with a plain-language reason you
                  can repeat back — if you can&apos;t, the conversation is free.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="h-100">
                <p className="fs-5 fw-medium mb-0">
                  No line item you weren&apos;t told about in advance — or that
                  line item is free.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="h-100">
                <p className="fs-5 fw-medium mb-0">
                  A free written second opinion on any vendor quote or existing
                  IT contract.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-5 py-md-7 bg-secondary">
        <div className="container">
          <h2 className="fs-1 fw-light mb-5 border-bottom pb-3">
            Limited Time Offer for Small Businesses
          </h2>
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card shadow">
                <div className="card-body p-4 p-md-5">
                  <h3 className="fs-3 fw-medium mb-4 text-center">
                    Complete Bundle: $99/month per user
                  </h3>
                  <ul className="list-unstyled mb-4">
                    <li className="d-flex align-items-center mb-2">
                      <CheckIcon size={20} />
                      Password Manager
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <CheckIcon size={20} />
                      Web Hosting
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <CheckIcon size={20} />
                      Business Email
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <CheckIcon size={20} />
                      Microsoft Collaboration Tools
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <CheckIcon size={20} />
                      Email Support
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <CheckIcon size={20} />
                      Quarterly IT Assessment
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <CheckIcon size={20} />
                      Reduced Web Design Rates
                    </li>
                    <li className="d-flex align-items-center">
                      <CheckIcon size={20} />
                      Server Monitoring
                    </li>
                  </ul>
                  <div className="alert alert-success mb-4 text-center">
                    <p className="fw-medium mb-0">
                      First month free when you sign up for annual service
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="btn w-100 btn-lg btn-primary"
                  >
                    Choose A Plan Today
                  </Link>
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
              <h2 className="fs-1 fw-light mb-4 border-bottom pb-3">
                Take the First Step Today
              </h2>
              <p className="mb-4 text-body">
                We&apos;re ready to help your small business leverage the power
                of enterprise-grade technology without the enterprise-level
                complexity or cost.
              </p>
              <div className="mb-4">
                <h3 className="fs-4 fw-medium mb-2">Contact Us</h3>
                <p className="mb-1">Toronto</p>
                <p className="mb-0">Ontario, Canada</p>
              </div>
              <div className="mb-4">
                <p className="mb-1">hi@boximity.ca</p>
                <p className="mb-0">(289) 539-0098</p>
              </div>
              <div className="alert alert-secondary">
                <p className="small fst-italic mb-0">
                  &quot;We value your confidence and the privilege to manage
                  your corporate data and will not disclose any sensitive
                  information.&quot;
                </p>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
