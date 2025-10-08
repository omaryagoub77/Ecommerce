import React, { useEffect, useState, useCallback, useReducer, Suspense, lazy, useRef } from "react";
import { Link } from "react-router-dom";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import firebaseService from '../utils/firebaseService';
import { optimizeImageUrl, imagePreloader } from '../utils/imageUtils';
import { getOptimizedImageSrc, preloadCriticalImages } from '../utils/optimizedImages';
import performanceMonitor from '../utils/performanceMonitor';

// Aggressive dynamic imports to reduce initial bundle size
const HeroSlider = lazy(() => import('./HeroSlider'));

// Lazy load icons only when needed
const ShoppingCart = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.ShoppingCart }))
);
const WifiOff = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.WifiOff }))
);
const Heart = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.Heart }))
);
const Search = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.Search }))
);
const X = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.X }))
);
const Grid = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.Grid }))
);
const List = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.List }))
);
// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-3">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We're experiencing technical difficulties. Please try again later.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Debounce utility function (moved outside component to avoid recreation)
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// State reducer for better performance
const initialState = {
  products: [],
  loading: false,
  searchQuery: "",
  favoriteState: [], // Initialize as empty array
  lastVisible: null,
  hasMore: true,
  page: 1,
  viewMode: "grid"
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FAVORITE_STATE':
      // Ensure favoriteState is always an array
      return { ...state, favoriteState: Array.isArray(action.payload) ? action.payload : [] };
    case 'SET_LAST_VISIBLE':
      return { ...state, lastVisible: action.payload };
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'RESET_PAGINATION':
      return { ...state, page: 1, lastVisible: null, hasMore: true, products: [] };
    default:
      return state;
  }
}

// Helper functions for localStorage
const getFavoritesFromStorage = () => {
  try {
    const favorites = localStorage.getItem('favorites');
    if (!favorites) return [];
    
    const parsedFavorites = JSON.parse(favorites);
    return Array.isArray(parsedFavorites) ? parsedFavorites : [];
  } catch (error) {
    console.error('Error getting favorites from localStorage:', error);
    return [];
  }
};

const saveFavoritesToStorage = (favorites) => {
  try {
    // Ensure we're saving an array
    const favoritesArray = Array.isArray(favorites) ? favorites : [];
    localStorage.setItem('favorites', JSON.stringify(favoritesArray));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
};

// Memoized Product Card Component
const ProductCard = React.memo(({ product, onAddToCart, onAddToFavorites, isFav }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const originalPrice = parseFloat(product.price);
  const discountedPrice = parseFloat(product.newPrice);

  // Get the primary image URL (first image in the array)
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[1/1]">
      <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>
        {primaryImage ? (
          <LazyLoadImage
          src={optimizeImageUrl(primaryImage, 75)}
          alt={product.name}
          effect="blur"
          // width={400}
          // height={400}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          placeholderSrc={optimizeImageUrl(primaryImage, 10)}
          threshold={100}
          loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Image</span>
            </div>
          </div>
        )}
        </Link>
        
        {/* Image Loading Placeholder */}
        {!imageLoaded && !imageError && primaryImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          </div>
        )}
        
        {/* Image Error Fallback */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-2">
            <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-1" />
            <p className="text-gray-500 text-xs">Image unavailable</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2 z-10">
          <button
            onClick={() => onAddToFavorites(product.id)}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            className={`p-1 sm:p-1.5 max-[450px]:p-1 rounded-full backdrop-blur-sm transition-all duration-300 shadow-sm ${
              isFav
                ? "bg-pink-100 text-pink-600"
                : "bg-white/80 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 max-[450px]:w-3 max-[450px]:h-3 transition-all duration-200 ${
                isFav ? "fill-current" : ""
              }`}
            />
          </button>
          
     
        </div>

   
      </div>

      {/* Product Info */}
      <div className="p-2 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1">
            {product.name}
          </h3>
 
        </div>
        
        {/* <p className="text-gray-600 text-xs mb-2 line-clamp-2 flex-grow">
          {product.det}
        </p> */}
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-1">
            {originalPrice > discountedPrice && (
              <span className="line-through text-xs text-gray-500">
                ${originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-sm sm:text-base font-bold text-red-700">
              ${discountedPrice.toFixed(2)}
            </span>
                         {/* Discount Badge */}
     {originalPrice > discountedPrice && (
  <div
    className="
      line-through
      bg-pink-100 text-pink-600 
      px-2 py-1 
      rounded-full 
      text-xs font-bold 

      sm:px-1.5 sm:py-0.5 sm:text-[11px] 
      max-[500px]:px-1 max-[500px]:py-0.5 max-[500px]:text-[10px] 
      max-[400px]:px-0.5 max-[400px]:py-0.5 max-[400px]:text-[9px]
    "
  >
    {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}%
  </div>
)}

          </div>
          
          <button
            onClick={() => onAddToCart(product)}
            className="p-1 sm:p-1.5 max-[450px]:p-1 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 max-[450px]:w-3 max-[450px]:h-3`} />
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.isFav === nextProps.isFav
  );
});

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse border border-gray-100 flex flex-col h-full">
    {/* Image Container */}
    <div className="relative overflow-hidden bg-gray-200 aspect-[1/1]">
      {/* Discount Badge Placeholder */}
      <div className="absolute top-2 left-2 bg-gray-300 rounded-full px-1 py-0.5 sm:px-1.5 sm:py-0.5 max-[450px]:px-1 max-[450px]:py-0.5 w-12 h-4 max-[450px]:w-10 max-[450px]:h-3"></div>

      {/* Action Buttons Placeholder */}
      <div className="absolute top-2 right-2 flex flex-col space-y-2 z-10">
        <div className="p-1 sm:p-1.5 max-[450px]:p-1 rounded-full bg-gray-300 w-6 h-6 sm:w-7 sm:h-7 max-[450px]:w-5 max-[450px]:h-5"></div>
        <div className="p-1 sm:p-1.5 max-[450px]:p-1 rounded-full bg-gray-300 w-6 h-6 sm:w-7 sm:h-7 max-[450px]:w-5 max-[450px]:h-5"></div>
      </div>
    </div>

    {/* Product Info */}
    <div className="p-2 flex flex-col flex-grow">
      {/* Title & Category Badge */}
      <div className="flex justify-between items-start mb-1">
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        <div className="h-4 bg-gray-300 rounded-full w-12"></div>
      </div>
      
      {/* Description Lines */}
      <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6 mb-2"></div>

      {/* Price & Cart Button */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center space-x-1">
          <div className="h-3 bg-gray-300 rounded w-8"></div>
          <div className="h-5 bg-gray-300 rounded w-14"></div>
        </div>
        <div className="p-1 sm:p-1.5 max-[450px]:p-1 bg-gray-300 rounded-lg w-6 h-6 sm:w-7 sm:h-7 max-[450px]:w-5 max-[450px]:h-5"></div>
      </div>
    </div>
  </div>
);

// Search Bar Component
const SearchBar = React.memo(({ searchQuery, setSearchQuery, filteredCount }) => {
  // Debounced search handler
  const handleSearchChange = useCallback(
    debounce((value) => setSearchQuery(value), 300),
    [setSearchQuery]
  );

  return (
    <div className="w-full mb-10 mx-auto px-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 text-sm"
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {searchQuery.trim() !== "" && (
          <div className="mt-2 text-center">
            <p className="text-gray-700 text-sm">
              Searching for <span className="font-semibold text-red-700">"{searchQuery}"</span>
            </p>
            <p className="text-gray-600 text-xs">
              Found <span className="font-bold">{filteredCount}</span> result{filteredCount !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// Category Navigation Component with optimized images
const CategoryNav = React.memo(() => {
  const categories = [
    { name: "men", img: getOptimizedImageSrc('men') },
    { name: "women", img: getOptimizedImageSrc('women') },
    { name: "kids", img: getOptimizedImageSrc('kids') },
  ];

  // Preload critical images on component mount
  useEffect(() => {
    preloadCriticalImages();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Shop by Category</h2>
        <p className="text-gray-600 text-sm max-w-2xl mx-auto">Browse our collections and find the perfect items for you</p>
      </div>
      
      <div className="flex justify-center gap-4 sm:gap-8 md:gap-16">
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center group">
            <button
              onClick={() => {
                const section = document.getElementById(`${cat.name}-section`);
                section?.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border-4 border-white shadow-lg"
              aria-label={`View ${cat.name} products`}
            >
              <LazyLoadImage
                src={cat.img}
                alt={`${cat.name} category`}
                effect="blur"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <span className="mt-2 text-sm sm:text-base font-medium text-gray-800 capitalize group-hover:text-red-700 transition-colors">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Section Header Component
const SectionHeader = React.memo(({ title, count }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
    <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
      {count} {count === 1 ? "item" : "items"}
    </span>
  </div>
));

// Main Component
const EnhancedProducts = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    products,
    loading,
    searchQuery,
    favoriteState,
    lastVisible,
    hasMore,
    page,
    viewMode
  } = state;
  
  const pageSize = 12;

  // Create a ref to hold the latest favoriteState
  const favoriteStateRef = useRef(favoriteState);
  
  // Update the ref whenever favoriteState changes
  useEffect(() => {
    favoriteStateRef.current = favoriteState;
  }, [favoriteState]);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = getFavoritesFromStorage();
    dispatch({ type: 'SET_FAVORITE_STATE', payload: savedFavorites });
  }, []);

  // Optimized fetch function with caching - reduce main thread blocking
  const fetchProducts = useCallback(async (pageNum = 1, search = searchQuery) => {
    if (pageNum === 1) {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'RESET_PAGINATION' });
    }
    
    try {
      const filters = {
        searchQuery: search.trim(),
        pageSize: 8, // Reduced from 12 to load faster
        lastVisible: pageNum > 1 ? lastVisible : null
      };
      
      // Use requestIdleCallback to avoid blocking main thread
      const result = await new Promise((resolve) => {
        const executeQuery = async () => {
          const queryResult = await firebaseService.fetchProducts(filters);
          resolve(queryResult);
        };
        
        if (window.requestIdleCallback) {
          window.requestIdleCallback(executeQuery, { timeout: 1000 });
        } else {
          setTimeout(executeQuery, 0);
        }
      });
      
      // Batch state updates to prevent multiple re-renders
      if (pageNum === 1) {
        dispatch({ type: 'SET_PRODUCTS', payload: result.products });
      } else {
        dispatch({ type: 'SET_PRODUCTS', payload: [...products, ...result.products] });
      }
      
      dispatch({ type: 'SET_LAST_VISIBLE', payload: result.lastVisible });
      dispatch({ type: 'SET_HAS_MORE', payload: result.hasMore });
      dispatch({ type: 'SET_PAGE', payload: pageNum });
      
      // Preload only essential images (first 4)
      if (result.products.length > 0) {
        const imageUrls = result.products
          .slice(0, 4) // Reduced from 6 to 4
          .map(p => p.images && p.images[0])
          .filter(Boolean)
          .map(url => optimizeImageUrl(url, 40)); // Lower quality for preload
        
        // Use requestIdleCallback for image preloading
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            imagePreloader.preloadWithPriority(imageUrls, 2);
          });
        }
      }
      
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [searchQuery, lastVisible, products]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery !== state.searchQuery) {
      fetchProducts(1, searchQuery);
    }
  }, [searchQuery]);

  // Load more products
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProducts(page + 1);
    }
  }, [loading, hasMore, page, fetchProducts]);

  // Create a stable favorite toggle function
  const handleFavoriteClick = useCallback((productId) => {
    // Get the latest favoriteState from the ref
    const currentFavorites = Array.isArray(favoriteStateRef.current) 
      ? [...favoriteStateRef.current] 
      : (typeof favoriteStateRef.current === 'object' && favoriteStateRef.current !== null) 
        ? Object.values(favoriteStateRef.current) 
        : [];
    
    // Check if product is already in favorites
    const isFavorite = currentFavorites.includes(productId);
    
    let updatedFavorites;
    if (isFavorite) {
      // Remove from favorites
      updatedFavorites = currentFavorites.filter(id => id !== productId);
    } else {
      // Add to favorites
      updatedFavorites = [...currentFavorites, productId];
    }
    
    // Save to localStorage
    saveFavoritesToStorage(updatedFavorites);
    
    // Update state
    dispatch({ type: 'SET_FAVORITE_STATE', payload: updatedFavorites });

    if (onAddToFavorites) {
      const product = products.find((p) => p.id === productId);
      if (product) onAddToFavorites(product);
    }
  }, [onAddToFavorites, products]); // Removed favoriteState from dependencies

  // Ensure favoriteState is always an array before using it
  const safeFavoriteState = Array.isArray(favoriteState) 
    ? favoriteState 
    : (typeof favoriteState === 'object' && favoriteState !== null) 
      ? Object.values(favoriteState) 
      : [];

  // Group products
  const men = products.filter((p) => p.category === "men");
  const women = products.filter((p) => p.category === "women");
  const kids = products.filter((p) => p.category === "kids");

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm">Discover our latest collection of premium products</p>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-4 bg-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">No Products Available</h2>
          <p className="text-gray-600 mb-6 text-sm">We couldn't find any products at the moment. Please check back later.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section */}
        <Suspense fallback={<div className="h-64 bg-gray-200 animate-pulse" />}>
          <HeroSlider />
        </Suspense>

        {/* Categories */}
        <CategoryNav />

        {/* Search Bar */}
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query })}
          filteredCount={products.length}
        />

        {/* View Mode Toggle */}
        <div className="max-w-7xl mx-auto px-4 mb-4 hidden sm:flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === "grid"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === "list"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Men Section */}
        {men.length > 0 && (
          <div id="men-section" className="max-w-7xl mx-auto px-4 py-4">
            <SectionHeader title="Men's Collection" count={men.length} />
            <div className={`grid gap-3 sm:gap-4 md:gap-6 
           
            sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
            
            }
            `}>
              {men.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={handleFavoriteClick}
                  isFav={safeFavoriteState.includes(product.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Women Section */}
        {women.length > 0 && (
          <div id="women-section" className="max-w-7xl mx-auto px-4 py-4">
            <SectionHeader title="Women's Collection" count={women.length} />
            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {women.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={handleFavoriteClick}
                  isFav={safeFavoriteState.includes(product.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Kids Section */}
        {kids.length > 0 && (
          <div id="kids-section" className="max-w-7xl mx-auto px-4 py-4">
            <SectionHeader title="Kids' Collection" count={kids.length} />
            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {kids.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={handleFavoriteClick}
                  isFav={safeFavoriteState.includes(product.id)}
                />
              ))}
            </div>
          </div>
        )}
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center my-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                "Load More Products"
              )}
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(EnhancedProducts);