import Link from "next/link";
import Logo from "./Logo";

type FooterLink = { href: string; label: string };
type FooterGroup = { heading: string; links: readonly FooterLink[] };

// Grouped columns, so the service landing pages are reachable from every
// route (the SEO map wants the internal links too).
const footerGroups: readonly FooterGroup[] = [
  {
    heading: "Services",
    links: [
      {
        href: "/services/managed-it-services-ontario",
        label: "Managed IT, Ontario",
      },
      {
        href: "/services/it-services-for-architecture-firms",
        label: "Architecture firms",
      },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/#contact", label: "Contact" },
      {
        href: "https://www.linkedin.com/company/19035825/",
        label: "LinkedIn",
      },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms-of-service", label: "Terms of service" },
    ],
  },
];

// The bottom line shows a short SHA, like `git log --oneline`.
const SHORT_COMMIT_HASH_LENGTH = 7;

const BAND_LINK_CLASS_NAME = "text-band-ink no-underline hover:underline";

/**
 * The oxford band, in both modes. bg-band re-points --logo at the cultured
 * ink and --fig at band-fig (globals.css), so the lockup, accents and focus
 * rings all read on oxford.
 */
export default function Footer() {
  // Set at build time (Dockerfile, deploy.yml) to the full commit SHA.
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH;

  return (
    <footer className="bg-band text-band-ink">
      <div className="mx-auto grid gap-6 px-4 pt-8 pb-[22px] md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <Logo height={36} />
          <nav aria-label="Footer" className="flex flex-wrap gap-10 text-small">
            {footerGroups.map(({ heading, links }) => {
              const headingId = `footer-${heading.toLowerCase()}`;
              return (
                <div key={heading} className="grid content-start gap-1.5">
                  <p
                    id={headingId}
                    className="m-0 font-mono text-label text-band-fig"
                  >
                    {heading}
                  </p>
                  <ul
                    aria-labelledby={headingId}
                    className="m-0 grid list-none gap-1.5 p-0"
                  >
                    {links.map(({ href, label }) => (
                      <li key={href}>
                        <Link href={href} className={BAND_LINK_CLASS_NAME}>
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-band-rule pt-3 font-mono text-label text-band-fig">
          <span>© 2026 Boximity MSP · Toronto, Ontario</span>
          <span>
            <a href="mailto:hi@boximity.ca" className="text-band-fig">
              hi@boximity.ca
            </a>
            {" · "}
            <a href="tel:+12895390098" className="text-band-fig">
              (289) 539-0098
            </a>
          </span>
          {commitHash && (
            <span>Build {commitHash.slice(0, SHORT_COMMIT_HASH_LENGTH)}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
