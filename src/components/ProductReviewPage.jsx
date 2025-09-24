import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ShoppingCart, Heart, ArrowLeft } from "lucide-react";

const ProductReviewPage = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);

  const isFavorited = favorites.some((p) => p.id === id);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() };
          setProduct(productData);
          setSelectedImage(productData.images?.[0] || null);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const hasSizes = product?.sizes && product.sizes.length > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setMessage("⚠️ Please select a size before adding to cart.");
      return;
    }

    setMessage("✅ Added to cart!");
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.newprice || product.price,
      image: product.images?.[0] || "",
      selectedSize,
      quantity: 1,
    });

    setTimeout(() => setMessage(""), 3000);
  };

  const handleFavorite = () => {
    if (!isFavorited) {
      onAddToFavorites(product);
      setMessage("❤️ Added to favorites!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">This product may have been removed or doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-red-600 hover:text-red-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side: Images */}
          <div className="lg:w-1/2 p-6 lg:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Main Image */}
              <div className="flex-1">
                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  {selectedImage && !imageError ? (
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="text-5xl mb-2">🖼️</div>
                      <p className="text-gray-500">Image not available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-w-full md:max-w-[100px] lg:max-w-[120px]">
                {product.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img);
                      setImageError(false);
                    }}
                    className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === img
                        ? "border-red-500 scale-105 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Info */}
          <div className="lg:w-1/2 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200">
            <div className="flex flex-col h-full">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600 mb-6">{product.category}</p>

                {/* Size Selection */}
                {hasSizes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                            selectedSize === size
                              ? "bg-red-600 text-white border-red-600 shadow-md"
                              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          {size.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {hasSizes && !selectedSize && (
                      <p className="mt-2 text-sm text-red-500">Please select a size</p>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      ${product.newprice || product.price}
                    </span>
                    {product.newprice && product.newprice < product.price && (
                      <span className="text-lg text-gray-500 line-through">
                        ${product.price}
                      </span>
                    )}
                    {product.newprice && product.newprice < product.price && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                        Save ${(product.price - product.newprice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>

                  <button
                    onClick={handleFavorite}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      isFavorited
                        ? "bg-red-50 text-red-600 border-red-200 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 hover:shadow-sm"
                    }`}
                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      className={`w-6 h-6 transition-all duration-300 ${
                        isFavorited ? "fill-red-600 text-red-600 scale-110" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Friendly message */}
                {message && (
                  <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 animate-fadeIn">
                    {message}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.det || "No description available for this product."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewPage;