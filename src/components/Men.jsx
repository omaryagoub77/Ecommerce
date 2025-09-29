import React, { useEffect, useState, useCallback, useReducer } from "react";
import { collection, getDocs, query, limit, startAfter, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, WifiOff, Expand } from "lucide-react";

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

const Men = ({ onAddToCart, searchQuery }) => {
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

  // Fetch men products with server-side filtering
  const fetchMenProducts = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'RESET_PAGINATION' });
    }
    
    try {
      let q = collection(db, "products");
      
      // Add category filter
      q = query(q, where("category", "==", "men"));
      
      // Add search filter if provided
      if (searchQuery && searchQuery.trim() !== "") {
        q = query(q, 
          where("name", ">=", searchQuery),
          where("name", "<=", searchQuery + "\uf8ff")
        );
      }
      
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
      console.error("Error fetching men products:", error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [searchQuery, lastVisible, products, pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchMenProducts();
  }, []);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery) {
      fetchMenProducts(1);
    }
  }, [searchQuery]);

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
      fetchMenProducts(page + 1);
    }
  }, [loading, hasMore, page, fetchMenProducts]);

  // Skeleton loader
  const renderSkeleton = () =>
    Array(6)
      .fill(0)
      .map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
        >
          <div className="w-full h-48 bg-gray-300"></div>
          <div className="p-4">
            <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
            <div className="flex items-center justify-between">
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      ));

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Men Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {renderSkeleton()}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Men Products</h1>
          <p className="text-gray-600 text-lg mb-8">No products found matching your search.</p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition-colors"
          >
            <Heart className="w-5 h-5 mr-2" />
            Start Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Men Products</h1>
          <p className="text-gray-600">
            {products.length} product{products.length !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => {
            const originalPrice = parseFloat(product.price) || 0;
            const discountedPrice = parseFloat(product.newprice || product.newPrice) || originalPrice;

            return (
              <div
                key={product.id}
                className="bg-white w-full rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images?.[0] || "/fallback.jpg"}
                    alt={product.name}
                    className="w-full h-40  sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <button
                    onClick={() => handleFavoriteClick(product.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                      safeFavoriteState.includes(product.id)
                        ? "bg-pink-100 text-pink-600 scale-110"
                        : "bg-white/80 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                    }`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${safeFavoriteState.includes(product.id) ? "fill-current" : ""}`} />
                  </button>
                  
                  {/* View product Details */}
                  <Link to={`/product/${product.id}`}>
                    <button
                      className="absolute top-3 right-15 p-2 rounded-full backdrop-blur-sm transition-all duration-300 bg-white/80 text-gray-600 hover:bg-gray-100"
                    >
                      <Expand className="w-4 h-4 transition-all duration-200" />
                    </button>
                  </Link>
                  
                  {originalPrice > discountedPrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                      {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-lg text-gray-900 mb-1 truncate">{product.name}</h3>
                  {/* <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">{product.det || "No description available"}</p> */}
                  <div className="mb-3">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium capitalize">{product.category}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {originalPrice > discountedPrice && (
                        <span className="line-through text-sm sm:text-base text-red-400">
                          ${originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        ${discountedPrice.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-1 sm:space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm"></span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
};

export default Men;