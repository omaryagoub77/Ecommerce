import React, { useEffect, useState, useCallback, useReducer } from "react";
import { collection, getDocs, query, limit, startAfter, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, HeartOff, WifiOff } from "lucide-react";

// State reducer for better performance
const initialState = {
  products: [],
  loading: false,
  favoriteState: [], // Initialize as empty array
  lastVisible: null,
  hasMore: true,
  page: 1
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_FAVORITE_STATE':
      // Ensure favoriteState is always an array
      return { ...state, favoriteState: Array.isArray(action.payload) ? action.payload : [] };
    case 'SET_LAST_VISIBLE':
      return { ...state, lastVisible: action.payload };
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
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

// Memoized Product Card Component - Updated with the new design
const ProductCard = React.memo(({ product, onAddToCart, onAddToFavorites, isFav }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const originalPrice = parseFloat(product.price) || 0;
  const discountedPrice = parseFloat(product.newPrice || product.newprice) || originalPrice;
  const discountPercent = originalPrice > discountedPrice 
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0;

  // Get the primary image URL (first image in the array)
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 flex flex-col h-[90%]">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
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
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 line mb-2 text-sm sm:text-base min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
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

// Skeleton Loader Component - Updated to match the new ProductCard design
const SkeletonLoader = () => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100 flex flex-col h-[90%]">
    {/* Image Container */}
    <div className="relative overflow-hidden bg-gray-200 aspect-square">
      {/* Discount Badge Placeholder */}
      <div className="absolute top-3 left-3 bg-gray-300 rounded-full px-3 py-1 w-12 h-6"></div>

      {/* Action Buttons Placeholder */}
      <div className="absolute top-3 right-3 flex flex-col space-y-2 z-10">
        <div className="p-2 rounded-full bg-gray-300 w-8 h-8"></div>
      </div>
    </div>

    {/* Product Info */}
    <div className="p-3 flex flex-col flex-grow">
      {/* Title */}
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      
      {/* Price & Cart Button */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200">
        <div className="flex flex-col space-y-1">
          <div className="h-3 bg-gray-300 rounded w-8"></div>
          <div className="h-5 bg-gray-300 rounded w-14"></div>
        </div>
        <div className="px-4 py-2 bg-gray-300 rounded-lg w-16 h-9"></div>
      </div>
    </div>
  </div>
);

// Section Header Component
const SectionHeader = React.memo(({ title, count }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
    <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
      {count} {count === 1 ? "item" : "items"}
    </span>
  </div>
));

const Kids = ({ onAddToCart }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    products,
    loading,
    favoriteState,
    lastVisible,
    hasMore,
    page
  } = state;
  
  const pageSize = 12;

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = getFavoritesFromStorage();
    dispatch({ type: 'SET_FAVORITE_STATE', payload: savedFavorites });
  }, []);

  // Fetch kids products with server-side filtering
  const fetchKidsProducts = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'RESET_PAGINATION' });
    }
    
    try {
      let q = collection(db, "products");
      
      // Add category filter
      q = query(q, where("category", "==", "kids"));
      
      // Add pagination
      if (pageNum > 1 && lastVisible) {
        q = query(q, startAfter(lastVisible), limit(pageSize));
      } else {
        q = query(q, limit(pageSize));
      }
      
      const querySnapshot = await getDocs(q);
      const productList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      if (pageNum === 1) {
        dispatch({ type: 'SET_PRODUCTS', payload: productList });
      } else {
        dispatch({ type: 'SET_PRODUCTS', payload: [...products, ...productList] });
      }
      
      dispatch({ type: 'SET_LAST_VISIBLE', payload: querySnapshot.docs[querySnapshot.docs.length - 1] });
      dispatch({ type: 'SET_HAS_MORE', payload: querySnapshot.docs.length === pageSize });
      dispatch({ type: 'SET_PAGE', payload: pageNum });
    } catch (error) {
      console.error("Error fetching kids products:", error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [lastVisible, products, pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchKidsProducts();
  }, []);

  // Toggle favorite for specific product with localStorage persistence
  const handleFavoriteClick = useCallback((productId) => {
    // Ensure favoriteState is always an array with multiple safety checks
    const currentFavorites = Array.isArray(favoriteState) 
      ? [...favoriteState] 
      : (typeof favoriteState === 'object' && favoriteState !== null) 
        ? Object.values(favoriteState) 
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
  }, [favoriteState]);

  // Ensure favoriteState is always an array before using it
  const safeFavoriteState = Array.isArray(favoriteState) 
    ? favoriteState 
    : (typeof favoriteState === 'object' && favoriteState !== null) 
      ? Object.values(favoriteState) 
      : [];

  // Load more products
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchKidsProducts(page + 1);
    }
  }, [loading, hasMore, page, fetchKidsProducts]);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kids' Collection</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm">Discover our latest collection of premium products</p>
          </div>
          
          <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 bg-gray-50">
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
            <HeartOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <SectionHeader title="Kids' Collection" count={products.length} />
          <p className="text-gray-600 text-sm">
            Browse our premium selection of kids' products
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 bg-gray-50">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onAddToFavorites={handleFavoriteClick}
              isFav={safeFavoriteState.includes(product.id)}
            />
          ))}
        </div>

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

        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Kids;