'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * UmamiAnalytics component for client-side tracking
 * Handles pageview tracking and integrates with Umami dashboard
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
      trackView: (url?: string, referrer?: string) => void;
    };
  }
}

export default function UmamiAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Umami script when component mounts
  useEffect(() => {
    const initUmami = () => {
      const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
      const hostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;

      if (!websiteId || !hostUrl) {
        console.warn(
          'Umami configuration missing. Please set NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_HOST_URL environment variables.'
        );
        return;
      }

      // Check if script is already loaded
      const existingScript = document.querySelector('script[data-umami]');
      if (existingScript) {
        console.log('Umami script already loaded');
        return;
      }

      // Create and inject Umami script
      const script = document.createElement('script');
      script.src = `${hostUrl}/script.js`;
      script.setAttribute('data-website-id', websiteId);
      script.setAttribute('data-umami', '');
      script.async = true;

      // Add error handling
      script.onerror = () => {
        console.error('Failed to load Umami tracking script');
      };

      script.onload = () => {
        console.log('Umami tracking script loaded successfully');
      };

      document.head.appendChild(script);
    };

    // Add a slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initUmami();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track page views when route changes
  useEffect(() => {
    if (!pathname) return;

    // Wait for Umami script to be available
    const trackPageView = () => {
      if (!window.umami?.trackView) {
        // Retry after a short delay if umami is not ready
        setTimeout(trackPageView, 500);
        return;
      }

      try {
        const url = searchParams?.size
          ? `${pathname}?${searchParams.toString()}`
          : pathname;

        console.log('Route changed, tracking pageview with Umami:', url);
        window.umami.trackView(url, document.referrer);
      } catch (error) {
        console.error('Error tracking pageview with Umami:', error);
      }
    };

    // Small delay to ensure script is loaded
    const timer = setTimeout(trackPageView, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Track custom events (can be called from other components)
  useEffect(() => {
    // Make tracking functions available globally for other components
    if (typeof window !== 'undefined') {
      window.umamiTrackEvent = (
        event: string,
        data?: Record<string, unknown>
      ) => {
        if (!window.umami?.track) {
          console.warn('Umami tracking not available');
          return;
        }

        try {
          window.umami.track(event, data);
          console.log('Custom event tracked with Umami:', event, data);
        } catch (error) {
          console.error('Error tracking custom event with Umami:', error);
        }
      };

      window.umamiTrackView = (url?: string, referrer?: string) => {
        if (!window.umami?.trackView) {
          console.warn('Umami tracking not available');
          return;
        }

        try {
          window.umami.trackView(url, referrer);
          console.log('Pageview tracked with Umami:', url);
        } catch (error) {
          console.error('Error tracking pageview with Umami:', error);
        }
      };
    }
  }, []);

  // This is a utility component with no visual rendering
  return null;
}

// Global type declarations for TypeScript
declare global {
  interface Window {
    umamiTrackEvent?: (event: string, data?: Record<string, unknown>) => void;
    umamiTrackView?: (url?: string, referrer?: string) => void;
  }
}
