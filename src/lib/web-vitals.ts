import { CLSMetric, FCPMetric, FIDMetric, LCPMetric, TTFBMetric, onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';

/**
 * Interface for web vitals metric reporting
 */
export type WebVitalsMetric = CLSMetric | FCPMetric | FIDMetric | LCPMetric | TTFBMetric;

/**
 * Report web vitals metrics to an analytics endpoint
 */
const reportWebVitals = async (metric: WebVitalsMetric) => {
  // You can use this function to send metrics to your analytics service
  // For example: Google Analytics, custom endpoint, etc.
  
  // For development purposes, we'll log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log(metric);
  }

  // Example of sending to a custom analytics endpoint
  // In production, replace with your actual analytics reporting
  try {
    // Send to analytics
    const body = JSON.stringify({
      name: metric.name,
      id: metric.id,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType
    });

    // Send metrics to the API endpoint
    await fetch('/api/analytics/web-vitals', {
      body,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Avoid crashing due to analytics errors
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error reporting web vitals:', error);
    }
  }
};

/**
 * Initialize web vitals collection and reporting
 */
export function initWebVitals() {
  onCLS(reportWebVitals);
  onFID(reportWebVitals);
  onLCP(reportWebVitals);
  onFCP(reportWebVitals);
  onTTFB(reportWebVitals);
}