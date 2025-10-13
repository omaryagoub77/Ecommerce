import { X, ShoppingCart, Trash2, Minus, Plus, CheckCircle } from "lucide-react";
import React, { useState , useEffect} from "react";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";



export default function CartSlideout({
  isOpen,
  onClose,
  cart,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onClearCart,
  onCheckout,
  total
}) {
  const [actionMessage, setActionMessage] = useState(null);
  const [shippingPrices, setShippingPrices] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle showing action feedback
  const showActionMessage = (message, type = 'success') => {
    setActionMessage({ text: message, type });
    setTimeout(() => setActionMessage(null), 2000);
  };
  
  useEffect(() => {
    const fetchShippingPrices = async () => {
      const prices = {};
      for (const item of cart) {
        try {
          const snap = await getDoc(doc(db, "products", item.id));
          if (snap.exists()) {
            prices[item.id] = snap.data().shippingPrice || 0;
          }
        } catch (err) {
          console.error("Error fetching shipping price:", err);
        }
      }
      setShippingPrices(prices);
    };
  
    if (cart.length > 0) fetchShippingPrices();
  }, [cart]);

  // Handle quantity changes with feedback
  const handleDecreaseQty = (id) => {
    onDecreaseQty(id);
    // showActionMessage("Item quantity decreased");
  };
  
  const handleIncreaseQty = (id) => {
    onIncreaseQty(id);
    // showActionMessage("Item quantity increased");
  };

  // Handle item removal with feedback
  const handleRemoveItem = (id, name) => {
    onRemoveItem(id);
    showActionMessage(`${name} removed from cart`);
  };

  // Handle cart clearing with feedback
  const handleClearCart = () => {
    onClearCart();
    showActionMessage("Cart cleared");
  };

  // Handle checkout with loading state
  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      await onCheckout();
      showActionMessage("Checkout successful!");
    } catch (error) {
      showActionMessage("Checkout failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate subtotal, discount, and shipping
  const subtotal = total;
  const discount = subtotal * 0.2; // Assuming 20% discount like in the image
  const shipping = subtotal > 0 ? 15 : 0; // $15 shipping fee if cart is not empty
  const finalTotal = subtotal - discount + shipping;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop with blur effect */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      ></div>
      
      {/* Cart slideout panel */}
      <div className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="flex items-center justify-between p-5 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">YOUR CART</h2>
              {cart.length > 0 && (
                <span className="bg-gray-900 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Action message notification */}
          {actionMessage && (
            <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
              actionMessage.type === 'error' 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              <CheckCircle className="w-5 h-5" />
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-4 px-5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <ShoppingCart className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6 max-w-xs">Add some products to get started with your shopping</p>
                
                <button 
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-300"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div 
                    key={`${item.id}-${item.selectedSize || 'default'}`} 
                    className="flex items-start p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="relative">
                      <img 
                        src={item.image || (Array.isArray(item.images) ? item.images[0] : item.images)} 
                        alt={item.name} 
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 ml-4">
                      <h4 className="text-base font-medium text-gray-900">
                        {item.name}
                      </h4>
                      {item.selectedSize && (
                        <p className="text-sm text-gray-600 mt-1">
                          Size: <span className="font-medium">{item.selectedSize}</span>
                        </p>
                      )}
                      {/* ✅ Display multiple colors */}
                      {item.selectedColors && Array.isArray(item.selectedColors) && item.selectedColors.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                          Colors: 
                          <div className="flex ml-2">
                            {item.selectedColors.map((color, index) => (
                              <span
                                key={index}
                                className="w-5 h-5 rounded-full border ml-1"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </p>
                      )}
                      {/* Fallback for single color (backward compatibility) */}
                      {item.selectedColor && (!item.selectedColors || !Array.isArray(item.selectedColors)) && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                          Color: 
                          <span
                            className="ml-2 w-5 h-5 rounded-full border"
                            style={{ backgroundColor: item.selectedColor }}
                            title={item.selectedColor}
                          />
                        </p>
                      )}
                      <div className="flex items-center mt-2">
                        <span className="text-gray-900 font-medium">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            ${parseFloat(item.originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-2 border border-gray-300 rounded-md p-1">
                        <button 
                          onClick={() => handleDecreaseQty(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.qty}
                        </span>
                        <button 
                          onClick={() => handleIncreaseQty(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors duration-200"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-5 bg-white">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Subtotal</span>
                  <span className="text-gray-900 font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
{/*                 
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Discount</span>
                  <span className="text-red-600 font-medium">
                    -${discount.toFixed(2)}
                  </span>
                </div> */}
                
           <div className="flex justify-between items-center">
  <span className="text-gray-700 font-medium">Shipping</span>
  <span className="text-gray-900 font-medium">
    ${cart.reduce((sum, item) => sum + (shippingPrices[item.id] || 0), 0).toFixed(2)}
  </span>
</div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                  isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gray-900 hover:bg-gray-800'
                } text-white`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </>
                )}
              </button>
              
              <button 
                onClick={onClose}
                className="w-full mt-3 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-300 text-sm font-medium"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}