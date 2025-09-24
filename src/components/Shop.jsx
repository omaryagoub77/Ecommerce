import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, limit, startAfter } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ShoppingCart, WifiOff, Heart, Search, Expand, X, Filter, Grid, List } from "lucide-react";
import HeroSlider from "./HeroSlider";
import "./shop.css";
import womenImage from "../public/women.jpg";
import manImage from "../public/man.jpg";
import kidImage from "../public/kid.jpg";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-3">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We're experiencing technical difficulties. Please try again later.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Product Card Component - Smaller card with bigger fonts and icons
const ProductCard = ({ product, onAddToCart, onAddToFavorites, isFav }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const originalPrice = parseFloat(product.price);
  const discountedPrice = parseFloat(product.newprice);

  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 flex flex-col h-full">
      {/* Image Container - Fixed aspect ratio but smaller height */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[1/2]">
        {product.images?.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`${product.name} - Image ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ))}
        
        {/* Image Loading Placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          </div>
        )}
        
        {/* Image Error Fallback */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-2">
            <WifiOff className="w-8 h-8 text-gray-400 mb-1" />
            <p className="text-gray-500 text-xs">Image unavailable</p>
          </div>
        )}
        
        {/* Action Buttons - Bigger icons */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2 z-10">
          {/* Favorite Button */}
          <button
            onClick={() => onAddToFavorites(product)}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 shadow-sm ${
              isFav
                ? "bg-pink-100 text-pink-600"
                : "bg-white/80 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isFav ? "fill-current" : ""
              }`}
            />
          </button>
          
          {/* Expand Button */}
          <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>
            <button
              className="p-2 rounded-full backdrop-blur-sm transition-all duration-300 bg-white/80 text-gray-600 hover:bg-gray-100 shadow-sm"
            >
              <Expand className="w-5 h-5" />
            </button>
          </Link>
        </div>

        {/* Discount Badge */}
        {originalPrice > discountedPrice && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md z-10">
            {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Product Info - More compact */}
      <div className="p-2 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-base text-gray-900 line-clamp-1">
            {product.name}
          </h3>
          <span className="inline-block bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full text-xs font-medium capitalize">
            {product.category}
          </span>
        </div>
        
        <p className="text-gray-600 text-xs mb-2 line-clamp-2 flex-grow">
          {product.det}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-1">
            {originalPrice > discountedPrice && (
              <span className="line-through text-xs text-gray-500">
                ${originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold text-red-700">
              ${discountedPrice.toFixed(2)}
            </span>
          </div>
          
          <button
            onClick={() => onAddToCart(product)}
            className="p-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Component - Matching the smaller card
const SkeletonLoader = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse border border-gray-100 flex flex-col h-full">
    <div className="relative bg-gray-200 aspect-[3/4]">
      <div className="absolute top-2 left-2 bg-gray-300 rounded-full w-12 h-5"></div>
      <div className="absolute top-2 right-2 flex flex-col space-y-2">
        <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
        <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
      </div>
    </div>
    <div className="p-2 flex flex-col flex-grow">
      <div className="flex justify-between mb-1">
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        <div className="h-5 bg-gray-300 rounded w-14"></div>
      </div>
      <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6 mb-2 flex-grow"></div>
      <div className="flex justify-between">
        <div className="flex space-x-1">
          <div className="h-4 bg-gray-300 rounded w-10"></div>
          <div className="h-5 bg-gray-300 rounded w-12"></div>
        </div>
        <div className="h-9 w-9 bg-gray-300 rounded-lg"></div>
      </div>
    </div>
  </div>
);

// Search Bar Component
const SearchBar = ({ searchQuery, setSearchQuery, filteredCount }) => {
  // Debounce search input
  const debouncedSearch = useCallback(
    debounce((value) => setSearchQuery(value), 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  return (
    <div className="w-full mb-10 mx-auto px-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-9 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 text-sm"
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {searchQuery.trim() !== "" && (
          <div className="mt-2 text-center">
            <p className="text-gray-700 text-sm">
              Searching for <span className="font-semibold text-red-700">"{searchQuery}"</span>
            </p>
            <p className="text-gray-600 text-xs">
              Found <span className="font-bold">{filteredCount}</span> result{filteredCount !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Category Navigation Component
const CategoryNav = () => {
  const categories = [
    { name: "men", img: manImage },
    { name: "women", img: womenImage },
    { name: "kids", img: kidImage },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Shop by Category</h2>
        <p className="text-gray-600 text-sm max-w-2xl mx-auto">Browse our collections and find the perfect items for you</p>
      </div>
      
      <div className="flex justify-center gap-4 sm:gap-8 md:gap-16">
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center group">
            <button
              onClick={() => {
                const section = document.getElementById(`${cat.name}-section`);
                section?.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border-4 border-white shadow-lg"
              aria-label={`View ${cat.name} products`}
            >
              <img
                src={cat.img}
                alt={`${cat.name} category`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <span className="mt-2 text-sm sm:text-base font-medium text-gray-800 capitalize group-hover:text-red-700 transition-colors">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Section Header Component
const SectionHeader = ({ title, count }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
    <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
      {count} {count === 1 ? "item" : "items"}
    </span>
  </div>
);

// Main Component
const EnhancedProducts = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteState, setFavoriteState] = useState({});
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const pageSize = 12;

  // Fetch products with pagination
  const fetchProducts = async (pageNum = 1) => {
    if (pageNum === 1) {
      setLoading(true);
      setProducts([]);
    }
    
    try {
      let q = collection(db, "products");
      
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
      
      setProducts(prev => pageNum === 1 ? productList : [...prev, ...productList]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === pageSize);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Load more products
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  // Toggle favorite for specific product
  const handleFavoriteClick = (productId) => {
    setFavoriteState((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));

    if (onAddToFavorites) {
      const product = products.find((p) => p.id === productId);
      if (product) onAddToFavorites(product);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products
  const men = filteredProducts.filter((p) => p.category === "men");
  const women = filteredProducts.filter((p) => p.category === "women");
  const kids = filteredProducts.filter((p) => p.category === "kids");

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm">Discover our latest collection of premium products</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">No Products Available</h2>
          <p className="text-gray-600 mb-6 text-sm">We couldn't find any products at the moment. Please check back later.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section */}
        <HeroSlider />

        {/* Categories */}
        <CategoryNav />

        {/* Search Bar */}
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          filteredCount={filteredProducts.length}
        />

        {/* View Mode Toggle - Hidden on very small screens */}
        <div className="max-w-7xl mx-auto px-4 mb-4 hidden sm:flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === "grid"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === "list"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Men Section */}
        {men.length > 0 && (
          <div id="men-section" className="max-w-7xl mx-auto px-4 py-4">
            <SectionHeader title="Men's Collection" count={men.length} />
            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {men.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={handleFavoriteClick}
                  isFav={favoriteState[product.id] || false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Women Section */}
        {women.length > 0 && (
          <div id="women-section" className="max-w-7xl mx-auto px-4 py-4">
            <SectionHeader title="Women's Collection" count={women.length} />
            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {women.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={handleFavoriteClick}
                  isFav={favoriteState[product.id] || false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Kids Section */}
        {kids.length > 0 && (
          <div id="kids-section" className="max-w-7xl mx-auto px-4 py-4">
            <SectionHeader title="Kids' Collection" count={kids.length} />
            <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {kids.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onAddToFavorites={handleFavoriteClick}
                  isFav={favoriteState[product.id] || false}
                />
              ))}
            </div>
          </div>
        )}

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
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedProducts;