// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.init();
  }

  init() {
    // Initialize performance observers
    this.observeNavigation();
    this.observePaint();
    this.observeLargestContentfulPaint();
    this.observeFirstInputDelay();
    this.observeLayoutShift();
  }

  // Monitor navigation timing
  observeNavigation() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigationTiming', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive - entry.fetchStart,
              firstByte: entry.responseStart - entry.requestStart
            });
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  // Monitor paint timing
  observePaint() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.startTime);
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    }
  }

  // Monitor Largest Contentful Paint
  observeLargestContentfulPaint() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largest-contentful-paint', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  // Monitor First Input Delay
  observeFirstInputDelay() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('first-input-delay', entry.processingStart - entry.startTime);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    }
  }

  // Monitor Cumulative Layout Shift
  observeLayoutShift() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('cumulative-layout-shift', clsValue);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    }
  }

  // Record custom metrics
  recordMetric(name, value) {
    const timestamp = Date.now();
    this.metrics.set(name, {
      value,
      timestamp,
      type: 'custom'
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric: ${name}`, value);
    }
  }

  // Measure function execution time
  measureFunction(name, fn) {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      this.recordMetric(`function-${name}`, end - start);
      return result;
    };
  }

  // Measure React component render time
  measureComponent(componentName) {
    return (WrappedComponent) => {
      return (props) => {
        const start = performance.now();
        React.useEffect(() => {
          const end = performance.now();
          this.recordMetric(`component-${componentName}`, end - start);
        });
        return React.createElement(WrappedComponent, props);
      };
    };
  }

  // Get all recorded metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    return {
      lcp: this.metrics.get('largest-contentful-paint')?.value || null,
      fid: this.metrics.get('first-input-delay')?.value || null,
      cls: this.metrics.get('cumulative-layout-shift')?.value || null,
      fcp: this.metrics.get('first-contentful-paint')?.value || null,
      ttfb: this.metrics.get('navigationTiming')?.value?.firstByte || null
    };
  }

  // Generate performance report
  generateReport() {
    const coreWebVitals = this.getCoreWebVitals();
    const allMetrics = this.getMetrics();
    
    return {
      coreWebVitals,
      allMetrics,
      recommendations: this.generateRecommendations(coreWebVitals)
    };
  }

  // Generate performance recommendations
  generateRecommendations(vitals) {
    const recommendations = [];

    if (vitals.lcp > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Consider optimizing images and reducing server response times.');
    }

    if (vitals.fid > 100) {
      recommendations.push('First Input Delay is high. Consider reducing JavaScript execution time.');
    }

    if (vitals.cls > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Ensure images and ads have defined dimensions.');
    }

    if (vitals.fcp > 1800) {
      recommendations.push('First Contentful Paint is slow. Consider reducing render-blocking resources.');
    }

    return recommendations;
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;