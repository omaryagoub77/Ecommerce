import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, WifiOff, Expand } from "lucide-react";

const Men = ({ onAddToCart, favorites = [], onAddToFavorites, searchQuery }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch men products
  useEffect(() => {
    const fetchMenProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => p.category === "men");
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching men products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenProducts();
  }, []);

  const isFavorite = (id) => favorites.some((p) => p.id === id);
  const handleFavoriteClick = (product) => {
    if (onAddToFavorites) onAddToFavorites(product);
  };
  const handleAddToCart = (product) => {
    if (onAddToCart) onAddToCart(product);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

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

  if (loading) {
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

  if (filteredProducts.length === 0) {
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
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
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
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <button
                    onClick={() => handleFavoriteClick(product)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                      isFavorite(product.id)
                        ? "bg-pink-100 text-pink-600 scale-110"
                        : "bg-white/80 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                    }`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${isFavorite(product.id) ? "fill-current" : ""}`} />
                  </button>
                  {/* View product Details  */}
  <Link to={`/product/${product.id}`}>
        <button
         className={"absolute  bg-gray-100 top-[13px] sm:top-3 right-15 sm:right-15 p-2 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300 "}
         >
          <Expand
                      className={"w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200"} size={40}/>
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
                  <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">{product.det || "No description available"}</p>
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
