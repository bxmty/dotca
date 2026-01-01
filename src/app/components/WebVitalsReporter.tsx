"use client";

import { useEffect } from "react";
import { initWebVitals } from "../../lib/web-vitals";

export default function WebVitalsReporter() {
  useEffect(() => {
    // Add a small delay to allow GA and other analytics to initialize first
    const timer = setTimeout(() => {
      initWebVitals();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // This is a utility component with no visual rendering
  return null;
}
