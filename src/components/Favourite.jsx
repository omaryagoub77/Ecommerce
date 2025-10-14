import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Heart, Trash2, HeartOff } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { collection, getDocs, query, where, documentId } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Section Header Component
const SectionHeader = React.memo(({ title, count }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
    <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
      {count} {count === 1 ? "item" : "items"}
    </span>
  </div>
));

// Memoized Product Card Component
const ProductCard = React.memo(({ product, onAddToCart, onRemoveFavorite, isFav }) => {
  const originalPrice = parseFloat(product.price) || 0;
  const discountedPrice = parseFloat(product.newprice || product.newPrice) || originalPrice;

  // Get the primary image URL (first image in the array)
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[1/1]">
        {primaryImage ? (
          <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Image</span>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2 z-10">
          <button
            onClick={() => onRemoveFavorite(product.id)}
            aria-label="Remove from favorites"
            className="p-1 sm:p-1.5 max-[450px]:p-1 rounded-full backdrop-blur-sm transition-all duration-300 shadow-sm bg-pink-100 text-pink-600"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-[450px]:w-3 max-[450px]:h-3" />
          </button>
        </div>

        {/* Discount Badge */}
        {originalPrice > discountedPrice && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-1 py-0.5 sm:px-1.5 sm:py-0.5 max-[450px]:px-1 max-[450px]:py-0.5 rounded-full text-xs font-bold shadow-md z-10">
            {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
          </div>
        )}
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

const FavoritesPage = ({ onAddToCart }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch favorite products from Firebase based on IDs in localStorage
  const fetchFavoriteProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get favorite product IDs from localStorage
      const favoriteIds = getFavoritesFromStorage();
      
      if (favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      
      // Fetch products from Firebase
      const q = query(collection(db, "products"), where(documentId(), "in", favoriteIds));
      const querySnapshot = await getDocs(q);
      
      const favoriteProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFavorites(favoriteProducts);
    } catch (err) {
      console.error("Error fetching favorite products:", err);
      setError("Failed to load your favorites. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove product from favorites
  const handleRemoveFavorite = useCallback((productId) => {
    try {
      // Get current favorites from localStorage
      const currentFavorites = getFavoritesFromStorage();
      
      // Remove the product ID from favorites
      const updatedFavorites = currentFavorites.filter(id => id !== productId);
      
      // Save back to localStorage
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      
      // Update local state by removing the product
      setFavorites(prev => prev.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }, []);

  // Add product to cart
  const handleAddToCart = useCallback((product) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  }, [onAddToCart]);

  // Fetch favorites on component mount
  useEffect(() => {
    fetchFavoriteProducts();
  }, [fetchFavoriteProducts]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Favorites</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm">Loading your favorite items</p>
          </div>
          
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 bg-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} />
            ))}
          </div>
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
            <HeartOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Oops!</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button 
            onClick={fetchFavoriteProducts}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HeartOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">No Favorites Yet</h2>
          <p className="text-gray-600 mb-6 text-sm">You haven't added any items to your favorites yet.</p>
          <NavLink
            to={"/"}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
          >
            <Heart className="w-5 h-5 mr-2" />
            Start Shopping
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <SectionHeader title="Your Favorites" count={favorites.length} />
          <p className="text-gray-600 text-sm">
            Browse your favorite items
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 bg-gray-50">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onRemoveFavorite={handleRemoveFavorite}
              isFav={true}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <NavLink
            to={"/Ecommerce"}
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;