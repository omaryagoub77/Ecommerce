// Advanced icon loading utility for performance optimization
import { Suspense, lazy, memo, createElement } from 'react';

// Icon cache to prevent redundant imports
const iconCache = new Map();

// Generic icon loader with caching
export const loadIcon = (iconName) => {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName);
  }

  const IconComponent = lazy(() => 
    import('lucide-react')
      .then(mod => ({ default: mod[iconName] }))
      .catch(() => ({ default: () => createElement('span', null, '⚠️') })) // Fallback
  );

  iconCache.set(iconName, IconComponent);
  return IconComponent;
};

// Icon component with fallback
export const Icon = memo(({ name, className = "", size = 24, ...props }) => {
  const IconComponent = loadIcon(name);
  
  return createElement(Suspense, {
    fallback: createElement('div', {
      className: `animate-pulse bg-gray-300 rounded ${className}`,
      style: { width: size, height: size }
    })
  }, createElement(IconComponent, {
    className,
    size,
    ...props
  }));
});

// Preload commonly used icons
export const preloadIcons = (iconNames) => {
  iconNames.forEach(iconName => {
    loadIcon(iconName);
  });
};

// Common icon sets for preloading
export const COMMON_ICONS = [
  'ShoppingCart', 'Heart', 'Search', 'User', 'Menu'
];

export const SHOP_ICONS = [
  'Grid', 'List', 'Filter', 'Star', 'Plus', 'Minus'
];

export const NAVIGATION_ICONS = [
  'Home', 'ArrowLeft', 'ArrowRight', 'ChevronDown'
];

Icon.displayName = 'Icon';