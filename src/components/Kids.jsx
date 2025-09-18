// src/components/Kids.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, HeartOff, Trash2 , Expand } from "lucide-react";

const Kids = ({ onAddToCart, favorites = [], onAddToFavorites }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch kids products
  useEffect(() => {
    const fetchKidsProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => p.category === "kids");
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching kids products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchKidsProducts();
  }, []);

  // Favorite helpers
  const isFavorite = (id) => favorites.some((p) => p.id === id);
  const handleFavoriteClick = (product) => {
    if (onAddToFavorites) onAddToFavorites(product);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Kids Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
              <div className="w-full h-64 bg-gray-300"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
                <div className="h-6 w-16 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <HeartOff className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Kids Products</h1>
          <p className="text-gray-600 mb-6">You haven't added any items to your kids section yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kids Products</h1>
          <p className="text-gray-600">You have {products.length} item{products.length !== 1 ? "s" : ""} in the kids section</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => {
            const originalPrice = parseFloat(product.price) || 0;
            const discountedPrice = parseFloat(product.newPrice || product.newprice) || originalPrice;

            return (
              <div key={product.id} className="bg-white w-full rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={product.images[0] || "https://via.placeholder.com/300x300?text=No+Image"}
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
                    <Heart className={`w-5 h-5 transition-all duration-200 ${isFavorite(product.id) ? "fill-current" : ""}`} />
                  </button>
                  {/* View product Details  */}
             <Link to={`/product/${product.id}`}>
        <button
         className={"absolute bg-white/80 top-[13px] sm:top-3 right-15 sm:right-15 p-2 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300 "}
         >
          <Expand
                      className={"w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200"}/>
        </button>
                      </Link>

                  {/* Discount Badge */}
                  {originalPrice > discountedPrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                      {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-sm sm:text-lg text-gray-900 mb-1 truncate">{product.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">{product.det || "No description available"}</p>
                  <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium capitalize">{product.category}</span>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      {originalPrice > discountedPrice && (
                        <span className="line-through text-sm sm:text-base text-red-400">${originalPrice.toFixed(2)}</span>
                      )}
                      <span className="text-base sm:text-lg font-bold text-gray-900">${discountedPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => onAddToCart(product)}
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
            className="inline-flex mb-8 items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
};

export default Kids;
