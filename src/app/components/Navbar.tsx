"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="py-4 px-3 px-md-5">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
            <Link href="/" className="d-flex align-items-center fs-4 fw-semibold text-decoration-none text-body">
            <img 
              src="/images/logo.svg" 
              alt="Boximity MSP Logo" 
              className="me-2" 
              width="30" 
              height="auto" 
            />
            boximity msp
            </Link>
        </div>
        <nav className="d-none d-md-flex gap-4">
          <Link href="/#solutions" className="text-decoration-none text-body">Solutions</Link>
          <Link href="/#benefits" className="text-decoration-none text-body">Benefits</Link>
          <Link href="/#process" className="text-decoration-none text-body">Process</Link>
          <Link href="/pricing" className="text-decoration-none text-body">Pricing</Link>
          <Link href="/#contact" className="text-decoration-none text-body">Contact</Link>
        </nav>
        <button 
          className="btn d-md-none border-0 p-0" 
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="d-md-none mt-3 py-3 border-top">
          <nav className="d-flex flex-column gap-3">
            <Link 
              href="/#solutions" 
              className="text-decoration-none text-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solutions
            </Link>
            <Link 
              href="/#benefits" 
              className="text-decoration-none text-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              Benefits
            </Link>
            <Link 
              href="/#process" 
              className="text-decoration-none text-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              Process
            </Link>
            <Link 
              href="/#contact" 
              className="text-decoration-none text-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link 
              href="/pricing" 
              className="text-decoration-none text-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}