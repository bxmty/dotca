import { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app/globals.css';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import * as gtag from '../lib/gtag'; // Import your existing gtag.ts file

// Add gtag to the Window interface
declare global {
  interface Window {
    gtag: (command: string, action: string, params?: Record<string, unknown>) => void;
    dataLayer: Array<Record<string, unknown>>;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Initialize Google Analytics
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      gtag.initGA();
    }
  }, []);

  // Send web-vitals metrics to Google Analytics
  useEffect(() => {
    const reportWebVitals = ({ name, delta, id, value }: { name: string; delta: number; id: string; value: number }) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Web Vital: ${name}`, { id, delta, value });
      }

      // Send to Google Analytics as an event
      gtag.event({
        action: 'web_vitals',
        category: 'Web Vitals',
        label: id, // Unique ID for the metric occurrence
        value: Math.round(name === 'CLS' ? delta * 1000 : delta), // Convert CLS to milliseconds
        // Additional custom parameters
        metric_name: name,
        page_path: router.asPath,
        non_interaction: 1, // Doesn't affect bounce rate
      });
    };

    // Register web-vitals reporting
    onCLS(reportWebVitals);
    onINP(reportWebVitals);
    onLCP(reportWebVitals);
    onFCP(reportWebVitals);
    onTTFB(reportWebVitals);
  }, [router.asPath]);

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      {/* Google Analytics Script - only load if we have a measurement ID */}
      {gtag.GA_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_MEASUREMENT_ID}`}
          />
        </>
      )}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;