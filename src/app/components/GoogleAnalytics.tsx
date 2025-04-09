'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, pageview, GA_MEASUREMENT_ID } from '../../lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize GA when component mounts
  useEffect(() => {
    // Add a slight delay to ensure the script has loaded
    const timer = setTimeout(() => {
      console.log('GoogleAnalytics component mounted, initializing GA...');
      console.log('GA_MEASUREMENT_ID:', GA_MEASUREMENT_ID);
      initGA();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Track page views when route changes
  useEffect(() => {
    if (!pathname) return;
    
    try {
      const url = searchParams?.size 
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      
      console.log('Route changed, tracking pageview:', url);
      pageview(url);
    } catch (error) {
      console.error('Error tracking pageview:', error);
    }
  }, [pathname, searchParams]);

  // This is a utility component with no visual rendering
  return null;
}