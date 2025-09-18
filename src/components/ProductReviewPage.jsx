// src/components/ProductReviewPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ShoppingCart, Heart } from "lucide-react";

const ProductReviewPage = ({ onAddToCart, onAddToFavorites, favorites = [] }) => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // For large display

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
          setSelectedImage(productData.images?.[0] || null); // Set first image by default
        } else {
          console.log("No such product!");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!product) return <div className="text-center py-20">Product not found</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="text-blue-600 mb-4">← Back</button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* imag container */}
        <div className="flex flex-col md:flex-row gap-8">
            
        {/* Left side: Images */}
        <div className=" flex  gap-4">
          {/* Large Image */}
          {selectedImage && (
              <div className="w-full h-[400px]  md:h-[400px] bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
              <img
                src={selectedImage}
                alt={product.name}
                className="object-cover w-[300px] rounded-2xl h-full"
                />
            </div>
          )}

          {/* Thumbnails */}
          <div className="flex-col gap-2 mt-2 overflow-x-auto">
            {product.images?.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.name} ${idx}`}
                className={`w-[80px] h-[80px] rounded-lg cursor-pointer border-2 ${
                    selectedImage === img ? "border-blue-500" : "border-gray-300"
                }`}
                onClick={() => setSelectedImage(img)}
                />
            ))}
          </div>
        </div>
                </div>

        {/* Right side: Details */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.det}</p>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="font-semibold">Sizes:</span>
              {product.sizes.map((size) => (
                <span key={size} className="px-2 py-1 border rounded">{size}</span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">${product.newprice || product.price}</span>
            {product.newprice && product.newprice < product.price && (
              <span className="line-through text-gray-400">${product.price}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
            >
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>

            <button
              onClick={() => onAddToFavorites(product)}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                isFavorited ? "bg-pink-100 text-pink-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Heart className="w-5 h-5" /> {isFavorited ? "Favorited" : "Add to Favorites"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewPage;
