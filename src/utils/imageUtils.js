// Image optimization utilities for better performance

// Optimize image URL for better performance
const optimizeImageUrl = (url, quality = 80) => {
  if (!url) return url;
  
  // For Firebase Storage URLs, add quality parameter
  if (url.includes('firebasestorage.googleapis.com')) {
    return `${url}?alt=media&q=${quality}`;
  }
  
  // For other CDNs, you can add specific optimizations
  return url;
};

// Image preloader utility
class ImagePreloader {
  constructor() {
    this.cache = new Set();
    this.loading = new Map();
  }

  // Preload a single image
  preload(src) {
    if (this.cache.has(src) || this.loading.has(src)) {
      return this.loading.get(src) || Promise.resolve();
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.add(src);
        this.loading.delete(src);
        resolve(img);
      };
      
      img.onerror = (error) => {
        this.loading.delete(src);
        reject(error);
      };
      
      img.src = src;
    });

    this.loading.set(src, promise);
    return promise;
  }

  // Preload multiple images
  preloadMultiple(urls) {
    return Promise.allSettled(urls.map(url => this.preload(url)));
  }

  // Preload images with priority
  preloadWithPriority(urls, concurrent = 3) {
    return new Promise((resolve) => {
      const results = [];
      let completed = 0;
      let index = 0;

      const loadNext = () => {
        if (index >= urls.length) {
          if (completed === urls.length) {
            resolve(results);
          }
          return;
        }

        const url = urls[index++];
        this.preload(url)
          .then(result => {
            results.push({ status: 'fulfilled', value: result });
          })
          .catch(error => {
            results.push({ status: 'rejected', reason: error });
          })
          .finally(() => {
            completed++;
            loadNext();
          });
      };

      // Start initial concurrent loads
      for (let i = 0; i < Math.min(concurrent, urls.length); i++) {
        loadNext();
      }
    });
  }

  // Check if image is cached
  isCached(src) {
    return this.cache.has(src);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.loading.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

// Create singleton instance
const imagePreloader = new ImagePreloader();

// Intersection Observer for lazy loading
const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px'
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Generate responsive image URLs
const generateSrcSet = (baseSrc, widths = [320, 480, 768, 1024, 1200]) => {
  if (!baseSrc) return '';
  
  return widths
    .map(width => {
      const optimizedUrl = optimizeImageUrl(baseSrc, 80);
      return `${optimizedUrl}&w=${width} ${width}w`;
    })
    .join(', ');
};

export {
  optimizeImageUrl,
  imagePreloader,
  createIntersectionObserver,
  generateSrcSet
};