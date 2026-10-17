// tests/legacy-pages.test.tsx
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import "@testing-library/jest-dom";
import Custom404 from "@/pages/404";

// The pages-router _app and _error modules are covered in pages-app.test.tsx
// and pages-error.test.tsx, which mock the router and Sentry they depend on.

// Mock next/link for 404 page
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Next.js only renders these document primitives inside its own server
// pipeline, so stand them in with plain elements and assert the shell _document
// builds out of them.
jest.mock("next/document", () => ({
  __esModule: true,
  Html: ({ children, ...props }: React.ComponentProps<"html">) => (
    <html {...props}>{children}</html>
  ),
  Head: () => <head data-testid="document-head" />,
  Main: () => <main data-testid="document-main" />,
  NextScript: () => <script data-testid="next-script" />,
  default: () => null,
}));

import Document from "@/pages/_document";

/** The HTML shell _document builds out of the Next.js document primitives. */
function renderDocumentMarkup(): string {
  return renderToStaticMarkup(<Document />);
}

describe("Legacy Pages", () => {
  describe("404 Page", () => {
    it("renders 404 page with link to home", () => {
      render(<Custom404 />);

      // Check for 404 text
      expect(screen.getByText("404 - Page Not Found")).toBeInTheDocument();

      // Check for link to home
      const homeLink = screen.getByRole("link", { name: /Return to Home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");
    });
  });

  describe("_document Page", () => {
    it("renders an English document that follows the OS colour scheme", () => {
      const markup = renderDocumentMarkup();

      expect(markup).toContain('lang="en"');
      expect(markup).toContain('data-bs-theme="auto"');
    });

    it("renders the head, page body and Next.js scripts", () => {
      const markup = renderDocumentMarkup();

      expect(markup).toContain('data-testid="document-head"');
      expect(markup).toContain('data-testid="document-main"');
      expect(markup).toContain('data-testid="next-script"');
    });
  });
});
