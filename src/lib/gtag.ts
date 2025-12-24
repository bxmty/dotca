// Google Analytics configuration

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
      ...args: Array<{ [key: string]: unknown }>
    ) => void;
  }
}

// Environment-specific GA4 Measurement IDs
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
    ? process.env.NEXT_PUBLIC_PRODUCTION_GA_ID // Production GA4 property
    : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? process.env.NEXT_PUBLIC_STAGING_GA_ID // Staging GA4 property
      : process.env.NEXT_PUBLIC_DEV_GA_ID; // Development GA4 property (optional)

// Determine environment - simplified to just use NEXT_PUBLIC_ENVIRONMENT
const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
const isDevelopment = !isProduction && !isStaging;

// Add debugging for environment config (security-conscious logging)
console.log(`GA Environment: ${process.env.NEXT_PUBLIC_ENVIRONMENT}`);
console.log(
  `GA Measurement ID: ${GA_MEASUREMENT_ID ? 'SET (masked)' : 'NOT SET'}`
);

// Helper function to mask sensitive values
const maskValue = (value: string | undefined): string => {
  if (!value) return 'NOT SET';
  if (isDevelopment) return value; // Show full value in development
  if (value.length <= 8) return 'SET (too short to mask)';
  return `${value.substring(0, 4)}****${value.substring(value.length - 4)}`;
};

console.log(
  `NEXT_PUBLIC_STAGING_GA_ID: ${maskValue(process.env.NEXT_PUBLIC_STAGING_GA_ID)}`
);
console.log(
  `NEXT_PUBLIC_PRODUCTION_GA_ID: ${maskValue(process.env.NEXT_PUBLIC_PRODUCTION_GA_ID)}`
);
console.log(
  `isProduction: ${isProduction}, isStaging: ${isStaging}, isDevelopment: ${isDevelopment}`
);

// Initialize Google Analytics if the measurement ID is available
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.error(
      'GA Measurement ID is missing. Google Analytics will not be initialized.'
    );
    return;
  }

  console.log('Initializing Google Analytics with ID:', GA_MEASUREMENT_ID);

  // Check if gtag is already available (script might be loaded)
  if (typeof window !== 'undefined' && window.gtag) {
    console.log('GA script already loaded, configuring directly...');
    configureGA();
    return;
  }

  // Add Google Analytics script to the document
  window.dataLayer = window.dataLayer || [];

  // Define gtag function using the standard implementation
  window.gtag = function (command, target, ...rest) {
    window.dataLayer.push([command, target, ...rest]);
  };

  // Configure GA after a short delay to ensure script is ready
  setTimeout(() => {
    if (window.gtag) {
      configureGA();
    } else {
      console.warn('GA script not ready, will configure on next attempt');
    }
  }, 1000);
};

// Separate configuration function for reusability
const configureGA = () => {
  if (!window.gtag || !GA_MEASUREMENT_ID) {
    console.error(
      'Cannot configure GA: gtag function or measurement ID missing'
    );
    return;
  }

  window.gtag('js', new Date());

  // Configure with environment-specific settings
  if (isProduction) {
    console.log('Configuring GA for production');
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      transport_type: 'beacon',
    });
  } else if (isStaging) {
    console.log('Configuring GA for staging');
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
    });
  } else if (isDevelopment && GA_MEASUREMENT_ID) {
    console.log('Configuring GA for development');
    window.gtag('config', GA_MEASUREMENT_ID, {
      debug_mode: true,
      send_page_view: false, // Optional: Disable page views in development
    });
  }
};

// Track page views
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) {
    console.error('GA Measurement ID is missing. Page view not tracked.');
    return;
  }

  // Allow tracking in any environment, just debug in development
  if (isDevelopment) {
    console.log(`[DEV] Tracking pageview: ${url}`);
  }

  // Check if gtag is available
  if (!window.gtag) {
    console.warn('GA not ready, skipping pageview tracking:', url);
    return;
  }

  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });

    if (isProduction) {
      console.log(`Tracked pageview in production: ${url}`);
    }
  } catch (error) {
    console.error('Error tracking pageview:', error);
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (!GA_MEASUREMENT_ID) {
    console.error('GA Measurement ID is missing. Event not tracked.');
    return;
  }

  // Check if gtag is available
  if (!window.gtag) {
    console.warn('GA not ready, skipping event tracking:', action);
    return;
  }

  // Allow tracking in any environment, just debug in development
  if (isDevelopment) {
    console.log(`[DEV] Tracking event: ${action} in category ${category}`);
  }

  try {
    const eventParams: GtagEventParams = {
      event_category: category,
      event_label: label,
      value: value,
      environment: isProduction
        ? 'production'
        : isStaging
          ? 'staging'
          : 'development',
    };

    window.gtag('event', action, eventParams);

    if (isProduction) {
      console.log(`Tracked event in production: ${action}`);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};
