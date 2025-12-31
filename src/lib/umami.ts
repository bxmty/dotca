import { Umami, type UmamiEventData } from "@umami/node";

/**
 * Umami tracking utility functions for server-side analytics
 * Provides pageview and event tracking capabilities using @umami/node
 */

// Configuration interface for Umami tracking
interface UmamiConfig {
  websiteId: string;
  hostUrl: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

// Transform event data to Umami-compatible format
const transformEventData = (
  data?: Record<string, unknown>,
): UmamiEventData | undefined => {
  if (!data) return undefined;

  const transformed: UmamiEventData = {};

  for (const [key, value] of Object.entries(data)) {
    // Only include values that are strings, numbers, or Date objects
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      value instanceof Date
    ) {
      transformed[key] = value;
    } else if (value !== null && value !== undefined) {
      // Convert other types to strings for tracking
      transformed[key] = String(value);
    }
  }

  return transformed;
};

// Get Umami configuration from environment variables
const getUmamiConfig = (): UmamiConfig | null => {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const hostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;

  if (!websiteId || !hostUrl) {
    console.warn(
      "Umami configuration missing. Please set NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_HOST_URL environment variables.",
    );
    return null;
  }

  return {
    websiteId,
    hostUrl,
    sessionId: process.env.UMAMI_SESSION_ID,
    userAgent: process.env.USER_AGENT,
    ip: process.env.CLIENT_IP,
  };
};

/**
 * Track a pageview event
 * @param pathname - The page path being viewed
 * @param referrer - Optional referrer URL
 * @param title - Optional page title
 */
export async function trackPageView(
  pathname: string,
  referrer?: string,
  title?: string,
): Promise<void> {
  const config = getUmamiConfig();

  if (!config) {
    return;
  }

  try {
    const umami = new Umami({
      websiteId: config.websiteId,
      hostUrl: config.hostUrl,
    });

    await umami.track("pageview", {
      url: pathname,
      referrer: referrer || "",
      title: title || "Unknown Page",
    });
  } catch (error) {
    console.error("Failed to track pageview with Umami:", error);
  }
}

/**
 * Track a custom event
 * @param eventName - Name of the event
 * @param eventData - Optional event data object
 */
export async function trackCustomEvent(
  eventName: string,
  eventData?: Record<string, unknown>,
): Promise<void> {
  const config = getUmamiConfig();

  if (!config) {
    return;
  }

  try {
    const umami = new Umami({
      websiteId: config.websiteId,
      hostUrl: config.hostUrl,
    });

    await umami.track(eventName, transformEventData(eventData));
  } catch (error) {
    console.error("Failed to track custom event with Umami:", error);
  }
}

/**
 * Track form submission events
 * @param formName - Name/identifier of the form
 * @param formData - Optional form data (will be sanitized)
 */
export async function trackFormSubmission(
  formName: string,
  formData?: Record<string, unknown>,
): Promise<void> {
  // Sanitize form data to avoid tracking sensitive information
  const sanitizedData = formData
    ? Object.keys(formData).reduce(
        (acc, key) => {
          // Only include non-sensitive fields
          if (
            !["password", "email", "phone", "credit_card", "ssn"].some(
              (field) => key.toLowerCase().includes(field),
            )
          ) {
            acc[key] =
              typeof formData[key] === "string" && formData[key].length > 100
                ? `${formData[key].substring(0, 100)}...`
                : formData[key];
          }
          return acc;
        },
        {} as Record<string, unknown>,
      )
    : {};

  await trackCustomEvent(`form_submission_${formName}`, {
    form_name: formName,
    field_count: Object.keys(sanitizedData).length,
    ...sanitizedData,
  });
}

/**
 * Track button click events
 * @param buttonName - Name/identifier of the button
 * @param buttonContext - Optional context where the button was clicked
 */
export async function trackButtonClick(
  buttonName: string,
  buttonContext?: string,
): Promise<void> {
  await trackCustomEvent("button_click", {
    button_name: buttonName,
    context: buttonContext || "unknown",
  });
}

/**
 * Track user engagement events
 * @param action - The engagement action (scroll, time_on_page, etc.)
 * @param details - Optional details about the engagement
 */
export async function trackEngagement(
  action: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await trackCustomEvent(`engagement_${action}`, details);
}

/**
 * Check if Umami tracking is properly configured
 */
export function isUmamiConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
    process.env.NEXT_PUBLIC_UMAMI_HOST_URL
  );
}

/**
 * Initialize Umami tracking (useful for server-side setup)
 */
export function initializeUmamiTracking(): void {
  if (!isUmamiConfigured()) {
    console.warn("Umami tracking is not configured. Skipping initialization.");
    return;
  }

  console.log("Umami tracking initialized successfully");
}
