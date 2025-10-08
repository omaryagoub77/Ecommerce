import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ShoppingCart, Heart, ArrowLeft, Plus, Minus } from "lucide-react";

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

const ProductReviewPage = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [favoriteProductIds, setFavoriteProductIds] = useState([]);

  // Initialize favorites from localStorage
  useEffect(() => {
    const savedFavorites = getFavoritesFromStorage();
    setFavoriteProductIds(savedFavorites);
  }, []);

  // Check if product is favorited using localStorage state
  const isFavorited = favoriteProductIds.includes(id);

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
          // Set default color if available
          if (productData.colors && productData.colors.length > 0) {
            setSelectedColor(productData.colors[0]);
          }
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
  const hasColors = product?.colors && product.colors.length > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setMessage("⚠️ Please select a size before adding to cart.");
      return;
    }

    if (hasColors && !selectedColor) {
      setMessage("⚠️ Please select a color before adding to cart.");
      return;
    }

    setMessage("✅ Added to cart!");
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.newPrice || product.price,
      image: product.images?.[0] || "",
      selectedSize,
      selectedColor,
      quantity,
    });

    setTimeout(() => setMessage(""), 3000);
  };

  const handleFavorite = () => {
    const currentFavorites = [...favoriteProductIds];
    const productId = product.id;

    if (isFavorited) {
      // Remove from favorites
      const updatedFavorites = currentFavorites.filter(id => id !== productId);
      saveFavoritesToStorage(updatedFavorites);
      setFavoriteProductIds(updatedFavorites);
      setMessage("💔 Removed from favorites!");
    } else {
      // Add to favorites
      const updatedFavorites = [...currentFavorites, productId];
      saveFavoritesToStorage(updatedFavorites);
      setFavoriteProductIds(updatedFavorites);
      // Also call the prop function to maintain existing behavior
      onAddToFavorites(product);
      setMessage("❤️ Added to favorites!");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!product.newPrice || product.newPrice >= product.price) return 0;
    return Math.round(((product.price - product.newPrice) / product.price) * 100);
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
        <div className="max-w-md mx-auto bg-white rounded-xl p-8">
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
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back
        </button>
      </div>

      <div className="px-4 pb-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 py-4">
          {/* Left Side: Images */}
          <div className="w-full md:flex-1 lg:w-1/2">
            <div className="flex gap-4">
              {/* Main Image */}
              <div className="w-[80%] h-90 md:w-full md:h-96 lg:w-96 lg:h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {selectedImage && !imageError ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="text-5xl mb-2">🖼️</div>
                    <p className="text-gray-500">Image not available</p>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex flex-col gap-2 py-2">
                {product.images?.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img);
                      setImageError(false);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === img
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-300"
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
          <div className="w-full md:w-80 md:flex-shrink-0 lg:w-1/2">
            <div className="flex flex-col gap-4">
              {/* Product Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>

              {/* Price Section */}
              <div className="flex items-baseline gap-3">
                <span className="text-xl md:text-2xl font-bold text-gray-900">
                  ${product.newPrice || product.price}
                </span>
                {product.newPrice && product.newPrice < product.price && (
                  <>
                    <span className="text-base md:text-lg text-gray-500 line-through">
                      ${product.price}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                      {calculateDiscount()}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Color Selection */}
              {hasColors && (
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === color
                            ? "border-black scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {hasSizes && (
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-2 rounded-full border font-medium transition-all duration-200 text-sm ${
                          selectedSize === size
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {hasSizes && !selectedSize && (
                    <p className="mt-1 text-sm text-red-500">Please select a size</p>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Quantity</h3>
                <div className="flex items-center border border-gray-300 rounded-lg w-28">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-2 text-gray-600 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-2 text-gray-600 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all duration-300 text-sm"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </button>

                <button
                  onClick={handleFavorite}
                  className={`p-2.5 rounded-lg border transition-all duration-300 ${
                    isFavorited
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
                  }`}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`w-5 h-5 transition-all duration-300 ${
                      isFavorited ? "fill-red-600 text-red-600" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Short Description */}
              <div>
                <h2 className="text-base md:text-lg font-medium text-gray-900 mb-2">Product description</h2>
                <p className="text-gray-700 break-words text-sm leading-relaxed">
                  {product.shortDescription || product.det?.substring(0, 150) + "..." || "No description available."}
                </p>
              </div>

              {/* Friendly message */}
              {message && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewPage;