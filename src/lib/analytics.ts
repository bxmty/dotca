/**
 * Unified Analytics Interface
 *
 * This module provides a single, consistent API for tracking analytics events
 * so the rest of the application never talks to a provider directly.
 * Google Analytics is currently the only provider.
 */

import {
  pageview as gaPageview,
  event as gaEvent,
  initGA,
  GA_MEASUREMENT_ID,
} from "./gtag";

// Types for unified analytics interface
export interface UnifiedEventData {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown; // For additional custom properties
}

export interface AnalyticsConfig {
  enableGoogleAnalytics: boolean;
}

// Default configuration - can be overridden by environment variables
const getAnalyticsConfig = (): AnalyticsConfig => ({
  enableGoogleAnalytics: !!GA_MEASUREMENT_ID,
});

// Global analytics state
let isInitialized = false;

// Reset function for testing
export const __resetAnalyticsState = () => {
  isInitialized = false;
};

/**
 * Initialize all enabled analytics providers
 */
export const initializeAnalytics = (): void => {
  const config = getAnalyticsConfig();

  // Initialize Google Analytics if enabled and available
  if (config.enableGoogleAnalytics) {
    try {
      initGA();
    } catch (error) {
      console.error("❌ Failed to initialize Google Analytics:", error);
    }
  }

  isInitialized = true;
};

/**
 * Track a page view across all enabled analytics providers
 * @param url - The page URL/path to track
 */
export const trackPageView = async (url: string): Promise<void> => {
  const config = getAnalyticsConfig();

  if (!isInitialized) {
    initializeAnalytics();
  }

  if (config.enableGoogleAnalytics) {
    try {
      gaPageview(url);
    } catch (error) {
      console.error("❌ GA pageview error:", error);
    }
  }
};

/**
 * Track a custom event across all enabled analytics providers
 * @param eventData - The event data to track
 */
export const trackEvent = async (
  eventData: UnifiedEventData,
): Promise<void> => {
  const config = getAnalyticsConfig();

  if (!isInitialized) {
    initializeAnalytics();
  }

  if (config.enableGoogleAnalytics) {
    try {
      gaEvent({
        action: eventData.action,
        category: eventData.category || "engagement",
        label: eventData.label || "",
        value: eventData.value,
      });
    } catch (error) {
      console.error("❌ GA event error:", error);
    }
  }
};

/**
 * Track a form submission event
 * @param formName - Name/identifier of the form
 */
export const trackFormSubmit = async (formName: string): Promise<void> => {
  await trackEvent({
    action: "form_submit",
    category: "forms",
    label: formName,
  });
};

/**
 * Track a button click event
 * @param buttonName - Name/identifier of the button
 */
export const trackButtonClick = async (buttonName: string): Promise<void> => {
  await trackEvent({
    action: "button_click",
    category: "interaction",
    label: buttonName,
  });
};

/**
 * Track user engagement events
 * @param action - The engagement action (scroll, time_on_page, etc.)
 */
export const trackEngagement = async (action: string): Promise<void> => {
  await trackEvent({
    action: `engagement_${action}`,
    category: "engagement",
    label: action,
  });
};

/**
 * Check if analytics tracking is properly configured
 */
export const isAnalyticsConfigured = (): boolean => {
  return getAnalyticsConfig().enableGoogleAnalytics;
};

/**
 * Get current analytics configuration (for debugging)
 */
export const getAnalyticsStatus = (): AnalyticsConfig & {
  initialized: boolean;
} => ({
  ...getAnalyticsConfig(),
  initialized: isInitialized,
});

// Export convenience functions for common use cases
export const analytics = {
  init: initializeAnalytics,
  pageview: trackPageView,
  event: trackEvent,
  formSubmit: trackFormSubmit,
  buttonClick: trackButtonClick,
  engagement: trackEngagement,
  isConfigured: isAnalyticsConfigured,
  getStatus: getAnalyticsStatus,
} as const;
