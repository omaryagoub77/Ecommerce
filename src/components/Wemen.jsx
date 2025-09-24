import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebaseConfig";
import { ShoppingCart, Heart, WifiOff, Expand } from "lucide-react";
import fallbackImg from "../public/women.jpg";

const Wemen = ({ onAddToCart, onAddToFavorites, favorites = [], searchQuery }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch women products
  useEffect(() => {
    const fetchWomenProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => p.category === "women");
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching women products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWomenProducts();
  }, []);

  // Search filter
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  // Favorites helpers
  const isFavorite = (productId) => favorites.some((fav) => fav.id === productId);
  const handleFavoriteClick = (product) => {
    if (onAddToFavorites) onAddToFavorites(product);
  };
  const handleAddToCart = (product) => {
    if (onAddToCart) onAddToCart(product);
  };

  // Loading skeleton
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Women Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {renderSkeleton()}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Women Products</h1>
          <p className="text-gray-600 text-lg mb-8">
            No women products found matching your search.
          </p>
    
        </div>
      </div>
    );
  }

  // Main grid
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Women Products</h1>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const originalPrice = parseFloat(product.price) || 0;
            const discountedPrice = parseFloat(product.newprice || product.newPrice) || originalPrice;

            return (
              <div
                key={product.id}
                className="bg-white w-full rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={product.images[0] || fallbackImg}
                    alt={product.name}
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Favorite Button */}
                  <button
                    onClick={() => handleFavoriteClick(product)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                      isFavorite(product.id)
                        ? "bg-pink-100 text-pink-600 scale-110"
                        : "bg-white/80 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${
                        isFavorite(product.id) ? "fill-current" : ""
                      }`}
                    />
                  </button>
                  {/* View product Details  */}
               <Link to={`/product/${product.id}`}>
        <button
         className={"absolute bg-white/80 top-[13px] sm:top-3 right-15 sm:right-15 p-2 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300 "}
         >
          <Expand
                      className={"w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200"} size={40}/>
        </button>
                      </Link>
                  {/* Discount Badge */}
                  {originalPrice > discountedPrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                      {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
                    </div>
                  )}
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

                  {/* Price & Add to Cart */}
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
                      onClick={() => handleAddToCart(product)}
                      className="bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-1 sm:space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

   
      </div>
    </div>
  );
};

export default Wemen;
