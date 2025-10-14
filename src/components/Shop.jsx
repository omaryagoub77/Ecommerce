import React, { useMemo, useEffect, useState, useCallback, useReducer, Suspense, lazy, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { optimizeImageUrl, imagePreloader } from '../utils/imageUtils';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-red-600" />
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
  viewMode: "grid",
  // Add section show more states
  showAllMen: false,
  showAllWomen: false,
  showAllKids: false
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
  const discountPercent = originalPrice > discountedPrice 
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0;

  // Get the primary image URL (first image in the array)
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="group bg-white rounded-xl shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-xl border border-gray-100 flex flex-col h-[90%]">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>
          {primaryImage ? (
            <LazyLoadImage
              src={optimizeImageUrl(primaryImage, 75)}
              alt={product.name}
              effect=""
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              placeholderSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkNGQ0ZDIi8+Cjwvc3ZnPgo="
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
        </Link>
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            {discountPercent}% OFF
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={() => onAddToFavorites(product.id)}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 shadow-lg ${
            isFav
              ? "bg-red-600 text-white"
              : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              isFav ? "fill-current" : ""
            }`}
          />
        </button>
        
        {!imageLoaded && !imageError && primaryImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-1 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 line text-sm sm:text-base min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between border-gray-100">
          <div className="flex flex-col">
            {originalPrice > discountedPrice && (
              <span className="line-through text-xs text-gray-400">
                ${originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold text-red-600">
              ${discountedPrice.toFixed(2)}
            </span>
          </div>
          
          <button
            onClick={() => onAddToCart(product)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center space-x-1"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
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
  <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-9 bg-gray-200 rounded w-16"></div>
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
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
          className="flex overflow-x-auto overflow-y-hidden gap-4 sm:gap-6 pb-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLoader key={i} />
            ))
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-40 sm:w-48 md:w-56">
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={onAddToFavorites}
                  isFav={isFav(product.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Show More Button */}
      <div className="flex justify-end">
        <Link
          to={categoryRoute}
          className="px-6 py-3 text-red-500 rounded-lg hover:drop-shadow-2xl hover:text-red-600 transition-all font-semibold inline-flex items-center space-x-2"
        >
          <span>View All {title}</span>
          <ChevronRight className="w-5 h-5" />
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
    <div className="w-full mb-8 mx-auto px-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for products, brands and more..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 text-sm"
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              aria-label="Clear search"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {searchQuery.trim() !== "" && (
          <div className="mt-3 text-center">
            <p className="text-gray-700 text-sm">
              Showing <span className="font-bold text-red-600">{filteredCount}</span> result{filteredCount !== 1 ? "s" : ""} for <span className="font-semibold">"{searchQuery}"</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// Category Navigation Component with optimized images and scroll functionality
const CategoryNav = React.memo(({ onCategoryClick }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesData();
  }, []);

  const handleCategoryClick = (categoryName) => {
    // Convert to lowercase and replace spaces with hyphens for the ID
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    const element = document.getElementById(`${categoryId}-section`);
    
    if (element) {
      // Scroll to the category section
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Add a highlight effect
      element.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50');
      }, 2000);
      
      // Call the parent's onCategoryClick if provided
      if (onCategoryClick) {
        onCategoryClick(categoryName);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin h-16 w-16 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Shop From Top Categories</h2>
        <p className="text-gray-600 text-sm max-w-2xl mx-auto">Browse our collections and find the perfect items for you</p>
      </div>
      
      <div className="flex justify-center overflow-x-auto gap-6 sm:gap-8 pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className="flex flex-col items-center group cursor-pointer flex-shrink-0"
            onClick={() => handleCategoryClick(cat.name)}
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 border-4 border-white shadow-lg bg-gradient-to-br from-gray-100 to-gray-200">
              {cat.imageUrl ? (
                <LazyLoadImage
                  src={cat.imageUrl}
                  alt={cat.name}
                  effect="blur"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                  <span className="text-3xl">{cat.name.charAt(0)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="mt-3 text-xs sm:text-sm font-medium text-gray-700 capitalize group-hover:text-red-600 transition-colors text-center">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Main Component
const EnhancedProducts = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const {
    products,
    loading,
    searchQuery,
    favoriteState,
    lastVisible,
    hasMore,
    page,
    viewMode,
    showAllMen,
    showAllWomen,
    showAllKids
  } = state;
  
  const pageSize = 100;

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

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategoriesData();
  }, []);

  // Check for category in URL hash and scroll to it
  useEffect(() => {
    if (location.hash) {
      const categoryId = location.hash.substring(1); // Remove the # character
      const element = document.getElementById(`${categoryId}-section`);
      
      if (element) {
        // Wait a bit for content to load
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          
          // Add a highlight effect
          element.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50');
          }, 2000);
        }, 500);
      }
    }
  }, [location.hash, categories]);

  // Optimized fetch function with caching - reduce main thread blocking
  const fetchProductsData = useCallback(async (pageNum = 1, search = searchQuery) => {
    if (pageNum === 1) {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'RESET_PAGINATION' });
    }
    
    try {
      const filters = {
        pageSize: 100,
        lastVisible: pageNum > 1 ? lastVisible : null
      };
      
      // Declare the result variable first
      let result;
      
      // Then assign the value to it
      result = await new Promise((resolve) => {
        const executeQuery = async () => {
          const queryResult = await fetchProducts(filters);
          resolve(queryResult);
        };
        
        if (window.requestIdleCallback) {
          window.requestIdleCallback(executeQuery, { timeout: 1000 });
        } else {
          setTimeout(executeQuery, 0);
        }
      });
      
      // NOW we can safely log the result
      console.log("Fetched products:", result.products);
      console.log("Product categories:", result.products.map(p => p.category));
      console.log("Products with undefined category:", result.products.filter(p => !p.category));
      
      // Rest of your existing code...
      if (pageNum === 1) {
        dispatch({ type: 'SET_PRODUCTS', payload: result.products });
      } else {
        dispatch({ type: 'SET_PRODUCTS', payload: [...products, ...result.products] });
      }
      
      dispatch({ type: 'SET_LAST_VISIBLE', payload: result.lastVisible });
      dispatch({ type: 'SET_HAS_MORE', payload: result.hasMore });
      dispatch({ type: 'SET_PAGE', payload: pageNum });
      
      // ... rest of the function
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [lastVisible, products]);
  
  // Initial fetch
  useEffect(() => {
    fetchProductsData();
  }, []);

  // Handle search query changes
  useEffect(() => {
    // Reset show all states when starting a new search
    if (searchQuery.trim() !== "") {
      dispatch({ type: 'RESET_SHOW_ALL' });
    }
    // Don't refetch on search - we'll filter client-side for better UX
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
  }, [onAddToFavorites, products]); // Removed favoriteState from dependencies

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

  // Group products by category dynamically
  const productsByCategory = useMemo(() => {
    const groups = {};
    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });
    return groups;
  }, [products]);

  // Apply search filter to each category
  const filteredProductsByCategory = useMemo(() => {
    const filteredGroups = {};
    Object.keys(productsByCategory).forEach(category => {
      if (searchQuery.trim() !== "") {
        filteredGroups[category] = productsByCategory[category].filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } else {
        filteredGroups[category] = productsByCategory[category];
      }
    });
    return filteredGroups;
  }, [productsByCategory, searchQuery]);

  // Calculate total filtered results
  const totalFilteredResults = useMemo(() => {
    return Object.values(filteredProductsByCategory).reduce((total, products) => total + products.length, 0);
  }, [filteredProductsByCategory]);

  // Handle category click from navigation
  const handleCategoryClick = useCallback((categoryName) => {
    // Convert to lowercase and replace spaces with hyphens for the ID
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    const element = document.getElementById(`${categoryId}-section`);
    
    if (element) {
      // Scroll to the category section
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Add a highlight effect
      element.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50');
      }, 2000);
    }
  }, []);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-red-600" />
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <Suspense fallback={<div className="h-64 bg-gray-200 animate-pulse" />}>
          <HeroSlider />
        </Suspense>

        {/* Categories */}
        <CategoryNav onCategoryClick={handleCategoryClick} />

        {/* Search Bar */}
        <div className="py-1">
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query })}
            filteredCount={totalFilteredResults}
          />
        </div>

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
          {/* Dynamic Category Sections */}
          {categories.map(category => {
            const categoryProducts = filteredProductsByCategory[category.name] || [];
            
            if (categoryProducts.length === 0) {
              return null;
            }
            
            // Create a consistent ID for the section
            const categoryId = category.name.toLowerCase().replace(/\s+/g, '-');
            
            return (
              <div key={category.id} id={`${categoryId}-section`} className="scroll-mt-20">
                <HorizontallyScrollableSection
                  title={`${category.name}'s Collection`}
                  count={categoryProducts.length}
                  products={categoryProducts}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={handleFavoriteClick}
                  isFav={isProductFavorite}
                  categoryRoute={`/${category.name.toLowerCase()}`}
                  loading={loading && products.length === 0}
                />
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center my-8">
            <button
              onClick={() => fetchProductsData(page + 1)}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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