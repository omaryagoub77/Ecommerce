import React, { useEffect, useState, useCallback, useReducer, Suspense, lazy, useRef } from "react";
import { Link } from "react-router-dom";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../firebaseConfig";
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
const ChevronLeft = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.ChevronLeft }))
);
const ChevronRight = lazy(() => 
  import('lucide-react').then(mod => ({ default: mod.ChevronRight }))
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
  loading: false,
  searchQuery: "",
  favoriteState: [], // Initialize as empty array
  viewMode: "grid",
  // Add section show more states
  showAllMen: false,
  showAllWomen: false,
  showAllKids: false
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FAVORITE_STATE':
      // Ensure favoriteState is always an array
      return { ...state, favoriteState: Array.isArray(action.payload) ? action.payload : [] };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'TOGGLE_SHOW_ALL_MEN':
      return { ...state, showAllMen: !state.showAllMen };
    case 'TOGGLE_SHOW_ALL_WOMEN':
      return { ...state, showAllWomen: !state.showAllWomen };
    case 'TOGGLE_SHOW_ALL_KIDS':
      return { ...state, showAllKids: !state.showAllKids };
    case 'RESET_SHOW_ALL':
      return { ...state, showAllMen: false, showAllWomen: false, showAllKids: false };
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

// Firebase service functions integrated into the component
const fetchProducts = async (filters = {}) => {
  try {
    let q = collection(db, 'products');
    
    // Apply filters
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.searchQuery) {
      q = query(q, 
        where('name', '>=', filters.searchQuery),
        where('name', '<=', filters.searchQuery + '\\uf8ff')
      );
    }
    
    // Add pagination
    if (filters.lastVisible) {
      q = query(q, startAfter(filters.lastVisible), limit(filters.pageSize || 100));
    } else {
      q = query(q, limit(filters.pageSize || 100));
    }
    
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return {
      products,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === (filters.pageSize || 100)
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const fetchCategories = async () => {
  try {
    const categoriesRef = collection(db, "categories");
    const snapshot = await getDocs(categoriesRef);

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
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
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 flex flex-col h-full w-40 sm:w-48 md:w-56 flex-shrink-0">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[1/1]">
        <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>
          {primaryImage ? (
            <LazyLoadImage
              src={optimizeImageUrl(primaryImage, 75)}
              alt={product.name}
              effect=""
              className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              placeholderSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkNGQ0ZDIi8+Cjwvc3ZnPgo="
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
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse border border-gray-100 flex flex-col h-full w-40 sm:w-48 md:w-56 flex-shrink-0">
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

// Horizontally Scrollable Section Component
const HorizontallyScrollableSection = React.memo(({ 
  title, 
  count, 
  products, 
  onAddToCart, 
  onAddToFavorites, 
  isFav,
  categoryRoute,
  loading = false
}) => {
  const scrollContainerRef = useRef(null);
  
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-3">
          <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto overflow-y-hidden gap-3 sm:gap-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} />
            ))
          ) : (
            products?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onAddToFavorites={onAddToFavorites}
                isFav={isFav(product.id)}
              />
            )) || []
          )}
        </div>
      </div>
      
      {/* Show More Button */}
      <div className="flex justify-end mt-4">
        <Link
          to={categoryRoute}
          className="text-red-400 hover:text-red-500 transition-all duration-300 hover:drop-shadow-lg font-medium inline-block"
        >
          View All {title}
        </Link>
      </div>
    </div>
  );
});

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
const CategoryNav = React.memo(({ categories }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Shop by Category</h2>
        <p className="text-gray-600 text-sm max-w-2xl mx-auto">Browse our collections and find the perfect items for you</p>
      </div>
      
      <div className="flex justify-center gap-4 sm:gap-8 md:gap-16">
        {categories?.map((cat) => (
          <div key={cat.id} className="flex flex-col items-center group">
            <button
              onClick={() => {
                const section = document.getElementById(`${cat.name}-section`);
                section?.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border-4 border-white shadow-lg"
              aria-label={`View ${cat.name} products`}
            >
              <LazyLoadImage
                src={cat.imageUrl || (cat.name ? `/images/categories/${cat.name}.jpg` : '/placeholder.jpg')}
                alt={`${cat.name} category`}
                effect="blur"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <span className="mt-2 text-sm sm:text-base font-medium text-gray-800 capitalize group-hover:text-red-700 transition-colors">
              {cat.name}
            </span>
          </div>
        )) || []}
      </div>
    </div>
  );
});

// Main Component
const EnhancedProducts = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    loading,
    searchQuery,
    favoriteState,
    viewMode,
    showAllMen,
    showAllWomen,
    showAllKids
  } = state;
  
  // State for products and categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch categories
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        
        // Fetch products for each category
        const categoryPromises = categoriesData.map(async (category) => {
          const result = await fetchProducts({ category: category.name, pageSize: 100 });
          return {
            category: category.name,
            products: result.products
          };
        });
        
        const categoryResults = await Promise.all(categoryPromises);
        
        // Combine all products
        const allProducts = categoryResults.flatMap(result => result.products);
        setProducts(allProducts);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle search query changes
  useEffect(() => {
    // Reset show all states when starting a new search
    if (searchQuery.trim() !== "") {
      dispatch({ type: 'RESET_SHOW_ALL' });
    }
  }, [searchQuery]);

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
  }, [onAddToFavorites, products]);

  // Ensure favoriteState is always an array before using it
  const safeFavoriteState = Array.isArray(favoriteState) 
    ? favoriteState 
    : (typeof favoriteState === 'object' && favoriteState !== null) 
      ? Object.values(favoriteState) 
      : [];

  // Helper function to check if a product is a favorite
  const isProductFavorite = useCallback((productId) => {
    return safeFavoriteState.includes(productId);
  }, [safeFavoriteState]);

  // Group products by category and apply search filter
  const getProductsByCategory = useCallback((categoryName) => {
    const categoryProducts = products.filter((p) => p.category === categoryName);
    
    // Apply search filter if provided
    if (searchQuery.trim() !== "") {
      return categoryProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return categoryProducts;
  }, [products, searchQuery]);

  // Calculate total filtered results for search display
  const totalFilteredResults = searchQuery.trim() !== "" 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length
    : products.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-red-700 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Error</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
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
        <CategoryNav categories={categories} />

        {/* Search Bar */}
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query })}
          filteredCount={totalFilteredResults}
        />

        {/* View Mode Toggle - Hidden as we're using horizontal scroll */}
        <div className="max-w-7xl mx-auto px-4 mb-4 hidden">
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

        <div className="max-w-7xl mx-auto px-4">
          {/* Render category sections dynamically */}
          {categories?.map((category) => {
            const categoryProducts = getProductsByCategory(category.name);
            
            // Only render sections that have products
            if (categoryProducts.length > 0) {
              return (
                <div key={category.id} id={`${category.name}-section`}>
                  <HorizontallyScrollableSection
                    title={`${category.name}'s Collection`}
                    count={categoryProducts.length}
                    products={categoryProducts}
                    onAddToCart={onAddToCart}
                    onAddToFavorites={handleFavoriteClick}
                    isFav={isProductFavorite}
                    categoryRoute={`/${category.name}`}
                    loading={isLoading}
                  />
                </div>
              );
            }
            
            return null;
          }) || []}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(EnhancedProducts);