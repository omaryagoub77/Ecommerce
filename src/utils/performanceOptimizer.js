// Modern performance optimization utilities

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Debounce utility with leading edge option
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle utility for performance-critical events
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Image preloader with priority support
export const preloadImage = (src, priority = 'low') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.fetchPriority = priority;
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Batch image preloader
export const preloadImages = (urls, priority = 'low') => {
  return Promise.allSettled(
    urls.map(url => preloadImage(url, priority))
  );
};

// Virtual scrolling utility for large lists
export class VirtualScrollManager {
  constructor(containerHeight, itemHeight, buffer = 5) {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
  }
  
  getVisibleRange(scrollTop, totalItems) {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + this.buffer * 2);
    
    return { startIndex, endIndex, visibleCount };
  }
}

// Memory management utility
export const createMemoryOptimizer = () => {
  const cache = new Map();
  const maxSize = 100;
  
  return {
    set(key, value) {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    
    get(key) {
      const value = cache.get(key);
      if (value !== undefined) {
        // Move to end (LRU)
        cache.delete(key);
        cache.set(key, value);
      }
      return value;
    },
    
    clear() {
      cache.clear();
    },
    
    size() {
      return cache.size;
    }
  };
};

// Component performance wrapper
export const withPerformanceOptimization = (Component) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom shallow comparison
    const keys = Object.keys(prevProps);
    return keys.every(key => {
      if (typeof prevProps[key] === 'function' && typeof nextProps[key] === 'function') {
        return prevProps[key].toString() === nextProps[key].toString();
      }
      return prevProps[key] === nextProps[key];
    });
  });
};

// Resource loading priority manager
export const ResourcePriority = {
  CRITICAL: 'high',
  IMPORTANT: 'low',
  BACKGROUND: 'auto'
};

// Performance timing utility
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
};

// Bundle splitting helper
export const createAsyncComponent = (importFn, chunkName) => {
  return React.lazy(() => 
    importFn().then(module => ({
      default: module.default || module
    }))
  );
};

// Network performance optimizer
export const createNetworkOptimizer = () => {
  const requestQueue = [];
  let isProcessing = false;
  
  const processQueue = async () => {
    if (isProcessing || requestQueue.length === 0) return;
    
    isProcessing = true;
    const request = requestQueue.shift();
    
    try {
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
    
    isProcessing = false;
    
    // Process next request
    if (requestQueue.length > 0) {
      setTimeout(processQueue, 0);
    }
  };
  
  return {
    enqueue(fn) {
      return new Promise((resolve, reject) => {
        requestQueue.push({ fn, resolve, reject });
        processQueue();
      });
    }
  };
};

export default {
  createIntersectionObserver,
  debounce,
  throttle,
  preloadImage,
  preloadImages,
  VirtualScrollManager,
  createMemoryOptimizer,
  withPerformanceOptimization,
  ResourcePriority,
  measurePerformance,
  createAsyncComponent,
  createNetworkOptimizer
};