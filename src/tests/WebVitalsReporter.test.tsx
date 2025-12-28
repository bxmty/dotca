import { render } from '@testing-library/react';
import WebVitalsReporter from '@/app/components/WebVitalsReporter';
import * as webVitals from '@/lib/web-vitals';

jest.mock('@/lib/web-vitals', () => ({
  initWebVitals: jest.fn(),
}));

describe('WebVitalsReporter', () => {
  it('initializes web vitals tracking on mount', () => {
    render(<WebVitalsReporter />);
    expect(webVitals.initWebVitals).toHaveBeenCalledTimes(1);
  });

  it('renders nothing to the DOM', () => {
    const { container } = render(<WebVitalsReporter />);
    expect(container.firstChild).toBeNull();
  });
});