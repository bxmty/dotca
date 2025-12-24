import { NextRequest, NextResponse } from 'next/server';
import type { WebVitalsMetric } from '@/lib/web-vitals';

export async function POST(request: NextRequest) {
  try {
    const body: WebVitalsMetric = await request.json();
    
    // Log the metrics in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Web Vitals:', body);
    }
    
    // In production, you'd want to store metrics in a database or send to an analytics service
    // Example: Push to analytics service, database, monitoring tool, etc.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { error: 'Failed to process web vitals data' },
      { status: 500 }
    );
  }
}