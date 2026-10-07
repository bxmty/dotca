"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

const navLinks = [
  { href: "/#solutions", label: "Solutions" },
  { href: "/#benefits", label: "Benefits" },
  { href: "/#process", label: "Process" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
] as const;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar navbar-expand-md py-4 px-3 px-md-5">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <Logo />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? "Close" : "Menu"}
        </button>
        <div
          className={`navbar-collapse collapse${isOpen ? " show" : ""}`}
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto gap-1 gap-md-2">
            {navLinks.map(({ href, label }) => (
              <li key={href} className="nav-item">
                <Link
                  href={href}
                  className="nav-link text-body fs-6 fw-semibold"
                  onClick={() => setIsOpen(false)}
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
