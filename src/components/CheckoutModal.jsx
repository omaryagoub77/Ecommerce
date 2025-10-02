import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import SignUp from "../Auth/SignUp";
// If you have a SignIn component, import it here:
// import SignIn from "../Auth/SignIn";

function LocationPreview({ address }) {
  if (!address) {
    return (
      <p className="text-gray-500 p-4 text-center">
        Enter your address or use location to preview on map.
      </p>
    );
  }

  const encoded = encodeURIComponent(address);
  return (
    <iframe
      title="map-preview"
      src={`https://www.google.com/maps?q=${encoded}&t=k&z=15&output=embed`}
      width="100%"
      height="250"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
    ></iframe>
  );
}

export default function CheckoutModal({
  isOpen,
  onClose,
  total,
  cart,
  onOrderSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [user, setUser] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);

  // ✅ Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (formErrors[e.target.name]) {
      setFormErrors((prev) => ({
        ...prev,
        [e.target.name]: null,
      }));
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = `${latitude},${longitude}`;
        setForm((prev) => ({ ...prev, address: coords }));
      },
      (err) => {
        alert("Failed to get location: " + err.message);
      }
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (
      !/^\+?[0-9\s\-()]{7,20}$/.test(form.phone.replace(/\s/g, ""))
    ) {
      errors.phone = "Please enter a valid phone number";
    }
    if (!form.address.trim()) errors.address = "Address is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage("Please correct the errors in the form.");
      return;
    }
    if (!cart || cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);

      let location = null;
      if (form.address.includes(",")) {
        const [lat, lng] = form.address.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          location = { lat, lng };
        }
      }

      // ✅ Build order object
      const newOrder = {
        id: Date.now().toString(), // unique ID for localStorage
        client: form,
        items: cart,
        total,
        status: "Pending", // match MyOrders styling
        timestamp: new Date().toISOString(),
        location,
        userId: user?.uid || null,
      };

      // Save to Firestore
      await addDoc(collection(db, "orders"), newOrder);

      // ✅ Save also to localStorage
      const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];
      localStorage.setItem("orders", JSON.stringify([...existingOrders, newOrder]));

      setMessage("Order placed successfully!");
      setForm({ name: "", email: "", phone: "", address: "" });
      onOrderSuccess?.();
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error("Error placing order:", error);
      setMessage("Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isOpen) return null;

  return (
    <>
      {/* Flash message */}
      {message && (
        <div className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none">
          <div
            className={`p-6 rounded-xl shadow-2xl max-w-md w-[80%] flex items-center space-x-3 pointer-events-auto transition-all duration-300 ${
              message.includes("success")
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.includes("success") ? (
              <CheckCircle className="w-8 h-8 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 flex-shrink-0" />
            )}
            <span className="text-lg font-medium">{message}</span>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-gray-600 hover:text-red-600 rounded-full shadow-md transition-all"
            aria-label="Close Checkout Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-gradient-to-r from-red-700 to-red-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Checkout</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!user ? (
              // 🔑 Show login/signup instead of form
              <div>
                {showSignUp ? <SignUp /> : <SignUp />}
                {/* Replace <SignUp /> with <SignIn /> if you have a login form */}
                <p className="mt-4 text-center text-sm text-gray-600">
                  {showSignUp
                    ? "Already have an account?"
                    : "Don’t have an account?"}{" "}
                  <button
                    onClick={() => setShowSignUp(!showSignUp)}
                    className="text-red-600 hover:underline"
                  >
                    {showSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>
            ) : (
              <>
                {/* ✅ Order Summary + Form */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-red-600" />
                    Order Summary
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              item.image ||
                              (Array.isArray(item.images)
                                ? item.images[0]
                                : item.images)
                            }
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>Qty: {item.qty}</span>
                              {item.selectedSize && (
                                <span>Size: {item.selectedSize}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          ${(item.qty * item.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">
                      Total:
                    </span>
                    <span className="text-xl font-bold text-red-700">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2 text-red-600" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-red-600" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-red-600" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="Enter your phone number"
                      disabled={loading}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-600">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-red-600" />
                      Shipping Address
                    </label>
                    <div className="flex gap-2 mb-2">
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        rows={2}
                        className="flex-1 px-4 py-3 border rounded-lg resize-none"
                        placeholder="Enter your shipping address or coords"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={useMyLocation}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm"
                      >
                        Use My Location
                      </button>
                    </div>
                    {formErrors.address && (
                      <p className="text-sm text-red-600">
                        {formErrors.address}
                      </p>
                    )}
                  </div>

                  {/* Map Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-red-600" />
                      Location Preview
                    </label>
                    <div className="w-full h-64 rounded-lg overflow-hidden border">
                      <LocationPreview address={form.address} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg font-medium"
                  >
                    {loading ? "Processing Order..." : "Place Order"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
