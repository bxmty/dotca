import type { ReactNode } from "react";

// The page frame for long-form copy: blog posts and the legal pages. The
// article is the .prose scope (globals.css), left-aligned at a 66 ch measure.

export default function ProsePage({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-14 pb-12 md:px-7 md:pb-24">
      <article className="prose">{children}</article>
    </div>
  );
}
