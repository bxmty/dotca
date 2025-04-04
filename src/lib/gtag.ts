// 1. First, create a lib/gtag.js file

// Environment-specific GA4 Measurement IDs
export const GA_MEASUREMENT_ID = process.env.NODE_PUBLIC_ENVIRONMENT === 'production' 
  ? process.env.NEXT_PUBLIC_PROD_GA_ID  // Production GA4 property
  : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
    ? process.env.NEXT_PUBLIC_STAGING_GA_ID  // Staging GA4 property
    : process.env.NEXT_PUBLIC_DEV_GA_ID || '';     // Development GA4 property (optional)

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' && process.env.NEXT_ENV !== 'staging';
const isStaging = process.env.NEXT_ENV === 'staging';
const isDevelopment = !isProduction && !isStaging;

// Initialize Google Analytics if the measurement ID is available
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) return;
  
  // Add Google Analytics script to the document
  window.dataLayer = window.dataLayer || [];
  
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  
  gtag('js', new Date());
  
  // Configure with environment-specific settings
  if (isProduction) {
    // Production setup with production GA4 property
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      transport_type: 'beacon',
    });
  } else if (isStaging) {
    // Staging setup with staging GA4 property
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
    });
  } else if (isDevelopment && GA_MEASUREMENT_ID) {
    // Development setup with optional development GA4 property
    gtag('config', GA_MEASUREMENT_ID, {
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
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    environment: isStaging ? 'staging' : 'production',
  });
};