import type { ReactNode } from "react";

/**
 * One ground for every section: they are separated by the section head's
 * ink rule, not by alternating dark bands. 64 px apart on phones, 96 px from
 * 768 px.
 */
export default function Section({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="grid gap-5.5 px-4 py-8 md:px-7 md:py-12">
      {children}
    </section>
  );
}
