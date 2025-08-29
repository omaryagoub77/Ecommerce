import { ShoppingCart } from "lucide-react";

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3">
          {product.det || product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-red-700">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <button 
            onClick={onAddToCart}
            className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}