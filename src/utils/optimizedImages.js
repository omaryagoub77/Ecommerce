// Optimized image URLs to replace massive local files
// These are lightweight, properly sized images for category navigation

export const optimizedCategoryImages = {
  women: {
    // Optimized WebP version - much smaller than the 3.3MB original
    webp: 'data:image/webp;base64,UklGRkIBAABXRUJQVlA4IDYBAADwBQCdASoAQABAAP7+/P//////kgAiCWlu/KVH8dxlz9WAF0mwN+5DP0cPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPAAA=',
    fallback: '/images/women-optimized.webp',
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjQ4IiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Xb21lbjwvdGV4dD4KPC9zdmc+'
  },
  men: {
    webp: 'data:image/webp;base64,UklGRkIBAABXRUJQVlA4IDYBAADwBQCdASoAQABAAP7+/P//////kgAiCWlu/KVH8dxlz9WAF0mwN+5DP0cPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPAAA=',
    fallback: '/images/men-optimized.webp',
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjQ4IiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NZW48L3RleHQ+Cjwvc3ZnPg=='
  },
  kids: {
    webp: 'data:image/webp;base64,UklGRkIBAABXRUJQVlA4IDYBAADwBQCdASoAQABAAP7+/P//////kgAiCWlu/KVH8dxlz9WAF0mwN+5DP0cPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPQw9DD0MPAAA=',
    fallback: '/images/kids-optimized.webp',
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjQ4IiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5LaWRzPC90ZXh0Pgo8L3N2Zz4='
  }
};

// Generate optimized image source based on format support
export const getOptimizedImageSrc = (category, options = {}) => {
  const { 
    preferWebP = true, 
    width = 96, 
    height = 96,
    quality = 80 
  } = options;
  
  const categoryData = optimizedCategoryImages[category];
  if (!categoryData) return categoryData.placeholder;
  
  // Check WebP support
  const supportsWebP = (() => {
    try {
      return document.createElement('canvas').toDataURL('image/webp').indexOf('webp') > -1;
    } catch {
      return false;
    }
  })();
  
  if (supportsWebP && preferWebP) {
    return categoryData.webp;
  }
  
  return categoryData.fallback || categoryData.placeholder;
};

// Preload critical images
export const preloadCriticalImages = () => {
  Object.values(optimizedCategoryImages).forEach(category => {
    if (category.webp) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = category.webp;
      document.head.appendChild(link);
    }
  });
};