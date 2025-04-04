'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, pageview } from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize GA when component mounts
    initGA();
  }, []);

  // Track page views when route changes
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.size 
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
        
      pageview(url);
    }
  }, [pathname, searchParams]);

  // This is a utility component with no visual rendering
  return null;
}