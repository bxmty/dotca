import type { ReactNode } from "react";

type StatusPageProps = {
  /** Mono kicker above the heading, e.g. "404" or "Error". */
  kicker: string;
  heading: string;
  children: ReactNode;
  /** The way out. Secondary, so the nav CTA stays the one primary in view. */
  action: ReactNode;
};

/** The 404 and error pages: a rule-topped block on the page ground. */
export default function StatusPage({
  kicker,
  heading,
  children,
  action,
}: StatusPageProps) {
  return (
    <section className="mx-auto max-w-[720px] px-4 py-16 md:py-24">
      <div className="grid gap-4 border-t-2 border-ink pt-6">
        <p className="m-0 font-mono text-label text-muted">{kicker}</p>
        <h1 className="m-0 text-section leading-tight font-light text-balance">
          {heading}
        </h1>
        <div className="text-prose text-muted">{children}</div>
        <div className="mt-2">{action}</div>
      </div>
    </section>
  );
}
