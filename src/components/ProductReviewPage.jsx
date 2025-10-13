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
  const [selectedColors, setSelectedColors] = useState([]);
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
            setSelectedColors([productData.colors[0]]);
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

  const handleColorToggle = (color) => {
    setSelectedColors((prevColors) => {
      if (prevColors.includes(color)) {
        return prevColors.filter((c) => c !== color);
      } else {
        return [...prevColors, color];
      }
    });
  };

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setMessage("⚠️ Please select a size before adding to cart.");
      return;
    }

    if (hasColors && selectedColors.length === 0) {
      setMessage("⚠️ Please select at least one color before adding to cart.");
      return;
    }

    setMessage("✅ Added to cart!");
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.newPrice || product.price,
      image: product.images?.[0] || "",
      selectedSize,
      selectedColors,
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
    if (!product || !product.newPrice || product.newPrice >= product.price) return 0;
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
      {/* Mobile Layout (< md breakpoint) */}
      <div className="md:hidden">
        {/* Back Button - Mobile */}
        <div className="px-4 pt-4 pb-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
          </button>
        </div>

        {/* Main Product Image - Mobile */}
        <div className="px-4 mb-4">
          <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center">
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
        </div>

        {/* Thumbnails - Mobile */}
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images?.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImage(img);
                  setImageError(false);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === img ? "border-black" : "border-gray-200"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info - Mobile */}
        <div className="px-4 pb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex text-yellow-400">
              {'★★★★☆'}
            </div>
            <span className="text-sm text-gray-600">4.5/5</span>
          </div>

          {/* Price - Mobile */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">
              ${product.newPrice || product.price}
            </span>
            {product.newPrice && product.newPrice < product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ${product.price}
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                  -{calculateDiscount()}%
                </span>
              </>
            )}
          </div>

          {/* Description - Mobile */}
          <p className="text-sm text-gray-600 mb-4 break-words leading-relaxed">
            {product.shortDescription || product.det?.substring(0, 150) + "..." || "No description available."}
          </p>

          {/* Colors - Mobile */}
          {hasColors && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Select Colors</h3>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorToggle(color)}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      selectedColors.includes(color) ? "border-black ring-2 ring-offset-2 ring-black" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes - Mobile */}
          {hasSizes && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Choose Size</h3>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                      selectedSize === size
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

          {/* Quantity - Mobile */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center bg-gray-100 rounded-full">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="p-3 text-gray-600 hover:text-gray-900"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-medium">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="p-3 text-gray-600 hover:text-gray-900"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button - Mobile */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-black text-white py-3.5 rounded-full font-medium hover:bg-gray-800 transition-all"
            >
              Add to Cart
            </button>

            <button
              onClick={handleFavorite}
              className={`p-3.5 rounded-full border transition-all ${
                isFavorited
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  isFavorited ? "fill-red-600 text-red-600" : ""
                }`}
              />
            </button>
          </div>

          {/* Message - Mobile */}
          {message && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout (>= md breakpoint) */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Back Button - Desktop */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>

          <div className="flex gap-8">
            {/* Left: Images */}
            <div className="flex-1">
              <div className="flex gap-4">
                {/* Thumbnails - Desktop */}
                <div className="flex flex-col gap-3">
                  {product.images?.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(img);
                        setImageError(false);
                      }}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === img ? "border-black" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Main Image - Desktop */}
                <div className="flex-1 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center" style={{ maxHeight: '500px' }}>
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
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="w-96 flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {'★★★★☆'}
                </div>
                <span className="text-sm text-gray-600">4.5/5</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.newPrice || product.price}
                </span>
                {product.newPrice && product.newPrice < product.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.price}
                    </span>
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded-full">
                      -{calculateDiscount()}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-6 leading-relaxed border-b pb-6">
                {product.shortDescription || product.det?.substring(0, 150) + "..." || "No description available."}
              </p>

              {/* Colors */}
              {hasColors && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Select Colors</h3>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorToggle(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColors.includes(color) ? "border-black ring-2 ring-offset-2 ring-black" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {hasSizes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Choose Size</h3>
                  <div className="flex gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                          selectedSize === size
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

              {/* Quantity & Actions */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center bg-gray-100 rounded-full">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-3 text-gray-600 hover:text-gray-900"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-6 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-3 text-gray-600 hover:text-gray-900"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white py-3.5 rounded-full font-medium hover:bg-gray-800 transition-all"
                >
                  Add to Cart
                </button>

                <button
                  onClick={handleFavorite}
                  className={`p-3.5 rounded-full border transition-all ${
                    isFavorited
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
                  }`}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`w-5 h-5 transition-all ${
                      isFavorited ? "fill-red-600 text-red-600" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Message */}
              {message && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">
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