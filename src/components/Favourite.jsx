import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Heart, Trash2, HeartOff } from "lucide-react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, documentId } from "firebase/firestore";
import { db } from "../firebaseConfig";

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
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-700"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Oops!</h1>
            <p className="text-gray-600 text-lg mb-8">{error}</p>
            <button
              onClick={fetchFavoriteProducts}
              className="inline-flex items-center px-6 py-3 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <HeartOff className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Favorites</h1>
            <p className="text-gray-600 text-lg mb-8">
              You haven't added any items to your favorites yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition-colors"
            >
              <Heart className="w-5 h-5 mr-2" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Favorites</h1>
          <p className="text-gray-600">
            You have {favorites.length} item{favorites.length !== 1 ? "s" : ""} in your favorites
          </p>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favorites.map((product) => (
            <div
              key={product.id}
              className="bg-white w-full rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                 <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>
                <img
                  src={product.images && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/300x300?text=No+Image"}
                  alt={product.name}
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  </Link>

                {/* Remove from Favorites Button */}
                <button
                  onClick={() => handleRemoveFavorite(product.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300 opacity-100 group-hover:opacity-100"
                  aria-label={`Remove ${product.name} from favorites`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Discount Badge */}
                {parseFloat(product.price) > parseFloat(product.newprice || product.newPrice) && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {Math.round(
                      (1 - (parseFloat(product.newprice || product.newPrice) / parseFloat(product.price))) * 100
                    )}
                    % OFF
                  </div>
                )}

                {/* Favorite Icon Overlay */}
                <div className="absolute bottom-3 left-3 bg-pink-100 text-pink-600 p-1 rounded-full">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-lg text-gray-900 mb-1 truncate">
                  {product.name}
                </h3>
             

                {/* Category Badge */}
                <div className="mb-3">
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium capitalize">
                    {product.category}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="line-through text-sm sm:text-base text-red-400">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      ${parseFloat(product.newprice || product.newPrice).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-1 sm:space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex mb-8 items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;