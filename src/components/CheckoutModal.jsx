
import React, { useState, useEffect, useCallback } from "react";
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
import { db } from "../firebaseConfig";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";

// Map config
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};
const center = { lat: -1.983367, lng: 30.054846 }; // Rwanda center
const options = { disableDefaultUI: true, zoomControl: true };

function LocationPicker({ onLocationSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY, // add key in .env
  });

  const [marker, setMarker] = useState(null);

  const onMapClick = useCallback(
    (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setMarker({ lat, lng });
      onLocationSelect({ lat, lng });
    },
    [onLocationSelect]
  );

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={10}
      center={center}
      options={options}
      onClick={onMapClick}
    >
      {marker && <Marker position={marker} />}
    </GoogleMap>
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
  const [selectedLocation, setSelectedLocation] = useState(null);

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
      !/^\+?[0-9\s\-\(\)]{10,15}$/.test(form.phone.replace(/\s/g, ""))
    ) {
      errors.phone = "Please enter a valid phone number";
    }
    if (!form.address.trim()) errors.address = "Address is required";
    if (!selectedLocation)
      errors.location = "Please select your home location on the map";

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
      await addDoc(collection(db, "orders"), {
        client: form,
        items: cart,
        total,
        status: "pending",
        location: selectedLocation, // lat/lng saved here
        timestamp: new Date().toISOString(),
      });
      setMessage("Order placed successfully!");
      setForm({ name: "", email: "", phone: "", address: "" });
      setSelectedLocation(null);
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
      {message && (
        <div className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none">
          <div
            className={`p-6 rounded-xl shadow-2xl max-w-md w-[80%] flex items-center space-x-3 pointer-events-auto transform transition-all duration-300 scale-100 animate-scaleIn ${
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-95 animate-scaleIn">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-gray-600 hover:text-red-600 rounded-full shadow-md transition-all duration-300 backdrop-blur-sm"
            aria-label="Close Checkout Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-gradient-to-r from-red-700 to-red-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8" />
              <h2 id="checkout-modal-title" className="text-2xl font-bold">
                Checkout
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Order Summary */}
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
                      <div className="relative">
                        <img
                          src={
                            item.image ||
                            (Array.isArray(item.images)
                              ? item.images[0]
                              : item.images)
                          }
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        {item.selectedSize && (
                          <span className="absolute bottom-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {item.selectedSize}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            Qty: {item.qty}
                          </span>
                          {item.selectedSize && (
                            <span className="text-xs text-gray-500">
                              Size: {item.selectedSize}
                            </span>
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

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    formErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-red-600 focus:border-red-600"
                  }`}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    formErrors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-red-600 focus:border-red-600"
                  }`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    formErrors.phone
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-red-600 focus:border-red-600"
                  }`}
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-600" />
                  Shipping Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
                    formErrors.address
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-red-600 focus:border-red-600"
                  }`}
                  placeholder="Enter your shipping address"
                  disabled={loading}
                />
                {formErrors.address && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.address}
                  </p>
                )}
              </div>

              {/* Interactive Map */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-600" />
                  Select Home Location
                </label>
                <LocationPicker onLocationSelect={setSelectedLocation} />
                {formErrors.location && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.location}
                  </p>
                )}
                {selectedLocation && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {selectedLocation.lat.toFixed(5)},{" "}
                    {selectedLocation.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing Order...
                  </>
                ) : (
                  <>Place Order</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

