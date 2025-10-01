'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, pageview, GA_MEASUREMENT_ID } from '../../lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize GA when component mounts
  useEffect(() => {
    console.log('GoogleAnalytics component mounted, initializing GA...');
    console.log('GA_MEASUREMENT_ID:', GA_MEASUREMENT_ID);

    // Initialize GA immediately
    initGA();

    // Also try after a delay in case the script loads slowly
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && !window.gtag) {
        console.log('Retrying GA initialization...');
        initGA();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Track page views when route changes
  useEffect(() => {
    if (!pathname) return;

    const trackPageView = () => {
      try {
        const url = searchParams?.size
          ? `${pathname}?${searchParams.toString()}`
          : pathname;

        console.log('Route changed, tracking pageview:', url);
        pageview(url);
      } catch (error) {
        console.error('Error tracking pageview:', error);
      }
    };

    // Try to track immediately
    trackPageView();

    // Also try after a delay in case GA isn't ready yet
    const timer = setTimeout(trackPageView, 1000);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // This is a utility component with no visual rendering
  return null;
}