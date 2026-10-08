"use client";

import "./globals.css";
import ErrorNotice from "./components/ErrorNotice";
import { fontVariableClassNames } from "../lib/fonts";

// Replaces the root layout when it fails, so it brings its own document,
// global styles and fonts, and renders without the nav and footer.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className={fontVariableClassNames}>
      <body>
        <main id="main-content">
          <ErrorNotice error={error} retry={retry} />
        </main>
      </body>
    </html>
  );
}
