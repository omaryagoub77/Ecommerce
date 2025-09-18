import React from "react";
import { ShoppingCart, Heart, Trash2, HeartOff } from "lucide-react";

const FavoritesPage = ({ favorites = [], onRemoveFromFavorites, onAddToCart }) => {
  const handleRemoveFavorite = (productId) => {
    if (onRemoveFromFavorites) {
      onRemoveFromFavorites(productId);
    }
  };

  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

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
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition-colors"
            >
              <Heart className="w-5 h-5 mr-2" />
              Start Shopping
            </a>
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
                <img
                  src={product.images[0] || "https://via.placeholder.com/300x300?text=No+Image"}
                  alt={product.name}
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Remove from Favorites Button */}
                <button
                  onClick={() => handleRemoveFavorite(product.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300 opacity-0 group-hover:opacity-100"
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
                <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
                  {product.det || "No description available"}
                </p>

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
