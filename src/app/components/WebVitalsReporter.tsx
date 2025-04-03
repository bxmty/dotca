'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';

export default function WebVitalsReporter() {
  useEffect(() => {
    // Initialize web vitals on client side only
    initWebVitals();
  }, []);

  // This is a utility component with no visual rendering
  return null;
}