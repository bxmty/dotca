// 1. First, create a lib/gtag.js file

// Define types for Google Analytics
interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown; // For other valid gtag event parameters
}

// Add type definition for window with gtag
declare global {
  interface Window {
    dataLayer: Array<IArguments | unknown[]>;
    gtag: (
      command: 'js' | 'config' | 'event' | string,
      target: Date | string,
      ...args: Array<{[key: string]: unknown}>
    ) => void;
  }
}

// Environment-specific GA4 Measurement IDs
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' 
  ? process.env.NEXT_PUBLIC_PRODUCTION_GA_ID  // Production GA4 property
  : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
    ? process.env.NEXT_PUBLIC_STAGING_GA_ID  // Staging GA4 property
    : process.env.NEXT_PUBLIC_DEV_GA_ID || '';     // Development GA4 property (optional)

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
const isDevelopment = !isProduction && !isStaging;

// Initialize Google Analytics if the measurement ID is available
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) return;
  
  // Add Google Analytics script to the document
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function properly using rest parameters
  window.gtag = function(command: string, target: string | Date, ...rest) {
    window.dataLayer.push({ command, target, ...rest });
  };
  
  window.gtag('js', new Date());
  
  // Configure with environment-specific settings
  if (isProduction) {
    // Production setup with production GA4 property
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      transport_type: 'beacon',
    });
  } else if (isStaging) {
    // Staging setup with staging GA4 property
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
    });
  } else if (isDevelopment && GA_MEASUREMENT_ID) {
    // Development setup with optional development GA4 property
    window.gtag('config', GA_MEASUREMENT_ID, {
      debug_mode: true,
      send_page_view: false, // Optional: Disable page views in development
    });
  }
};

// Track page views
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || (!isProduction && !isStaging)) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Track custom events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (!GA_MEASUREMENT_ID || (!isProduction && !isStaging)) return;
  
  const eventParams: GtagEventParams = {
    event_category: category,
    event_label: label,
    value: value,
    environment: isStaging ? 'staging' : 'production',
  };
  
  window.gtag('event', action, eventParams);
};
