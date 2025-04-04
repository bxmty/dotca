import type { Metadata, Viewport } from "next";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Script from "next/script";
import { Suspense } from "react";
import BootstrapClient from "./components/BootstrapClient";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WebVitalsReporter from "./components/WebVitalsReporter";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { GA_MEASUREMENT_ID } from "@/lib/gtag";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    template: "%s | Boximity MSP",
    default: "Boximity MSP - Enterprise IT Solutions for Small Businesses"
  },
  description: "Boximity MSP provides enterprise-grade technology solutions for small businesses without the complexity or cost. Password management, web hosting, business email, and more.",
  keywords: ["IT Services", "MSP", "Managed Service Provider", "Small Business IT", "Password Management", "Web Hosting", "Business Email"],
  creator: "Boximity MSP",
  publisher: "Boximity MSP",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  metadataBase: new URL("https://boximity.ca"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://boximity.ca",
    title: "Boximity MSP - Enterprise IT Solutions for Small Businesses",
    description: "Boximity MSP provides enterprise-grade technology solutions for small businesses without the complexity or cost.",
    siteName: "Boximity MSP",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Boximity MSP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Boximity MSP - Enterprise IT Solutions for Small Businesses",
    description: "Boximity MSP provides enterprise-grade technology solutions for small businesses without the complexity or cost.",
    images: ["/images/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-bs-theme="auto">
      <body>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <BootstrapClient />
        <WebVitalsReporter />
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <div className="min-vh-100 d-flex flex-column">
          <Navbar />
          <main className="flex-grow-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
