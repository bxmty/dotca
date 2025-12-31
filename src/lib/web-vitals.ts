import {
  CLSMetric,
  FCPMetric,
  INPMetric,
  LCPMetric,
  TTFBMetric,
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
} from "web-vitals";
import * as gtag from "./gtag";

/**
 * Interface for web vitals metric reporting
 */
export type WebVitalsMetric =
  | CLSMetric
  | FCPMetric
  | INPMetric
  | LCPMetric
  | TTFBMetric;

/**
 * Report web vitals metrics to an analytics endpoint
 */
const reportWebVitals = async (metric: WebVitalsMetric) => {
  // You can use this function to send metrics to your analytics service
  // For example: Google Analytics, custom endpoint, etc.

  // For development purposes, we'll log to console
  if (process.env.NODE_ENV !== "production") {
    console.log(metric);
  }

  // Example of sending to a custom analytics endpoint
  try {
    // Send to Google Analytics if available and ready
    if (
      gtag.GA_MEASUREMENT_ID &&
      typeof window !== "undefined" &&
      window.gtag
    ) {
      gtag.event({
        action: "web_vitals",
        category: "Web Vitals",
        label: metric.id,
        value: Math.round(
          metric.name === "CLS" ? metric.delta * 1000 : metric.value,
        ),
      });
    } else if (
      gtag.GA_MEASUREMENT_ID &&
      process.env.NODE_ENV !== "production"
    ) {
      console.log(
        "GA not ready for web vitals tracking, skipping:",
        metric.name,
      );
    }

    // Also send metrics to the API endpoint
    const body = JSON.stringify({
      name: metric.name,
      id: metric.id,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
    });

    await fetch("/api/analytics/web-vitals", {
      body,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Avoid crashing due to analytics errors
    if (process.env.NODE_ENV !== "production") {
      console.error("Error reporting web vitals:", error);
    }
  }
};

/**
 * Initialize web vitals collection and reporting
 */
export function initWebVitals() {
  onCLS(reportWebVitals);
  onINP(reportWebVitals);
  onLCP(reportWebVitals);
  onFCP(reportWebVitals);
  onTTFB(reportWebVitals);
}
