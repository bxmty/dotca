"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { ButtonLink } from "./Button";

type NavLink = { href: string; label: string };

// Four links: the home page's in-page anchors (Solutions, Benefits,
// Process) folded into Services, since a nav that jumps around one page
// breaks on every other route. Contact is the one cross-page jump, to the
// home contact section, as #617 asks. There is no /services index, so Services opens the main
// landing page and stays current across every /services/* route.
const navLinks: readonly NavLink[] = [
  { href: "/services/managed-it-services-ontario", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

// The direct CTA from msp-playbook §4.4, the one primary button in view at
// the top of every route. /book redirects to the Bookings page.
const cta = { href: "/book", label: "Get a Business-First IT Assessment" };

/**
 * A link is current on its own top-level section: /blog/some-post keeps Blog
 * current. In-page anchors are never current.
 */
function isCurrentLink(href: string, pathname: string | null): boolean {
  if (!pathname || href.includes("#")) return false;
  const section = `/${href.split("/")[1]}`;
  return pathname === section || pathname.startsWith(`${section}/`);
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="border-b border-rule bg-bg">
      <nav
        aria-label="Main"
        className="mx-auto flex flex-wrap items-center justify-between gap-x-4 px-4 py-3.5 md:flex-nowrap md:px-6 md:py-[18px]"
      >
        {/* 13 px of clear space around the lockup, which the focus ring
            follows; the negative margin keeps it out of the layout. */}
        <Link href="/" className="-m-[13px] p-[13px]">
          <Logo className="block h-7 w-auto md:h-[34px]" />
        </Link>
        <button
          className="min-h-11 cursor-pointer rounded-ctl border border-rule px-3 font-mono text-label leading-none font-medium text-ink md:hidden"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? "Close" : "Menu"}
        </button>
        {/* Phone: a full-width panel of ruled rows that opens instantly.
            The basis and negative margins stretch it across the nav's
            padding. From 768 px it is the inline link list and CTA. */}
        <div
          id="navbarNav"
          className={`${isOpen ? "flex" : "hidden"} -mx-4 -mb-3.5 mt-3.5 basis-[calc(100%+2rem)] flex-col border-t border-rule md:m-0 md:flex md:basis-auto md:flex-row md:items-center md:gap-6 md:border-0`}
        >
          <ul className="m-0 flex list-none flex-col p-0 md:flex-row md:gap-6">
            {navLinks.map(({ href, label }) => (
              <li
                key={href}
                className="border-t border-rule first:border-t-0 md:border-0"
              >
                <Link
                  href={href}
                  aria-current={
                    isCurrentLink(href, pathname) ? "page" : undefined
                  }
                  className="flex min-h-12 items-center px-4 text-body text-ink no-underline decoration-fig underline-offset-6 hover:underline aria-[current=page]:shadow-[inset_2px_0_0_var(--fig)] md:block md:min-h-0 md:px-0 md:py-1 md:aria-[current=page]:shadow-[inset_0_-2px_0_var(--fig)]"
                  onClick={closeMenu}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-rule px-4 py-3.5 md:border-0 md:p-0">
            <ButtonLink
              href={cta.href}
              variant="primary"
              isBlock
              className="md:min-h-10 md:w-auto md:px-3.5 md:py-2.5 md:text-small"
              onClick={closeMenu}
            >
              {cta.label}
            </ButtonLink>
          </div>
        </div>
      </nav>
    </header>
  );
}
