import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/#solutions", label: "Solutions" },
  { href: "/#benefits", label: "Benefits" },
  { href: "/#process", label: "Process" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
] as const;

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-md py-4 px-3 px-md-5">
      <div className="container-fluid">
        <Link
          href="/"
          className="navbar-brand d-flex align-items-center fs-4 fw-semibold text-body"
        >
          <Image
            src="/images/logo.svg"
            alt="Boximity MSP Logo"
            className="me-2"
            width={30}
            height={30}
            priority
          />
          boximity msp
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-2 gap-md-4">
            {navLinks.map(({ href, label }) => (
              <li key={href} className="nav-item">
                <Link
                  href={href}
                  className="nav-link text-body fs-5 fw-semibold"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
