import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ShoppingCart, WifiOff, Heart, Search ,Expand} from "lucide-react";
import HeroSlider from "./HeroSlider";
import "./shop.css";
import womenImage from "../public/women.jpg";
import manImage from "../public/man.jpg";
import kidImage from "../public/kid.jpg";

const EnhancedProducts = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteState, setFavoriteState] = useState({}); // ✅ renamed

  // ✅ Toggle favorite for specific product
  const handleFavoriteClick = (productId) => {
    setFavoriteState((prev) => ({
      ...prev,
      [productId]: !prev[productId], // only flips clicked product
    }));

    if (onAddToFavorites) {
      const product = products.find((p) => p.id === productId);
      if (product) onAddToFavorites(product);
    }
  };

  // ✅ Fetch products once
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Skeleton loader
  const renderSkeleton = () =>
    Array(6)
      .fill(0)
      .map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
        >
          <div className="w-full h-64 bg-gray-300"></div>
          <div className="p-4">
            <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-gray-300 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      ));

  // Product Card
const renderProductCard = (product) => {
  const isFav = favoriteState[product.id] || false; 
  const originalPrice = parseFloat(product.price);
  const discountedPrice = parseFloat(product.newprice);

  return (
    <div
      key={product.id}
      className=" bg-white w-full sm:w-[300px] rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-48 sm:h-64">
  {product.images?.map((img, idx) => (
    <img key={idx} src={img} alt={`${product.name} ${idx}`} className="exist-product-img" />
  ))}

        {/* Favorite Button */}
        <button
          onClick={() => handleFavoriteClick(product.id)}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isFav
              ? "bg-pink-100 text-pink-600 scale-110"
              : "bg-white/80 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
          }`}
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${
              isFav ? "fill-current" : ""
            }`}
          />
        </button>
            {/* Expand Button */}
  <Link to={`/product/${product.id}`}>
        <button
         className={"absolute top-5 right-2 bg-gray-300 top-[8px] sm:top-3 right-15 sm:right-15 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300 "}
         >
          <Expand
                      className={"w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200"} size={40}/>
        </button>
                      </Link>

        {/* Discount Badge */}
        {originalPrice > discountedPrice && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
            {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Info */}
      <div className="h-[130px] sm:h-[150px] p-3 sm:p-5">
        <h3 className="font-semibold text-sm sm:text-lg text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm mb-1">{product.det}</p>
        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium capitalize">
          {product.category}
        </span>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="line-through text-sm sm:text-lg text-red-400">
              ${originalPrice.toFixed(2)}
            </span>
            <span className="text-base sm:text-xl font-bold text-gray-900">
              ${discountedPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => onAddToCart && onAddToCart(product)}
            className="bg-red-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-1 sm:space-x-2"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};


  // ✅ Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products
  const men = filteredProducts.filter((p) => p.category === "men");
  const women = filteredProducts.filter((p) => p.category === "women");
  const kids = filteredProducts.filter((p) => p.category === "kids");

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Loading Products...
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderSkeleton()}
          </div>
        </div>
      </div>
    );
  }

  // Empty
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No products available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSlider />


{/* Categories */}
<div className="max-w-7xl mt-8 mx-auto px-4 py-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>
  <div className="flex justify-center gap-[10%]">
    {[
      { name: "men", img: womenImage },
      { name: "women", img: manImage },
      { name: "kids", img: kidImage },
    ].map((cat) => (
      <div>
      <button
      
      key={cat.name}
      onClick={() => {
        const section = document.getElementById(`${cat.name}-section`);
        section?.scrollIntoView({ behavior: "smooth" });
      }}
      className="flex flex-col items-  justify-center w-24 h-24 rounded-full bg-white shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-transform duration-300 overflow-hidden"
      >
        <img
          src={cat.img}
          alt={cat.name}
          className="w-full h-full  rounded-[50%] object-cover "
          />
      </button>
        <span className="capitalize ml-6 text-gray-700 font-medium text-sm">
          {cat.name}
        </span>
          </div>
    ))}
  </div>
</div>

      {/* Search Bar */}
  <div className="w-[80%] mb-5 h-9 mx-auto px-4 py-6">
  <div className="flex items-center bg-white rounded-2xl shadow-md border border-gray-200 px-4 py-2 transition-all duration-300 hover:shadow-lg ">
    <Search className="w-7 h-7 text-gray-400 mr-3" />
    <input
      type="text"
      placeholder="Search products..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full bg-transparent h-9  outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
    />
  </div>
</div>



   {/* Men */}
{men.length > 0 && (
  <div id="men-section" className="max-w-7xl mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold text-gray-900 mb-8">Men Products</h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
      {men.map((product) => renderProductCard(product))}
    </div>
  </div>
)}


      {/* Women */}
      {women.length > 0 && (
        <div id="women-section" className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Women Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {women.map((product) => renderProductCard(product))}
          </div>
        </div>
      )}

      {/* Kids */}
      {kids.length > 0 && (
        <div id="kids-section" className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Kids Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {kids.map((product) => renderProductCard(product))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProducts;
