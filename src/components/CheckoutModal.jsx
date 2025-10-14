import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  X,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  User,
  Locate,
  LocateFixed,
  MapPinHouse
} from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import SignUp from "../Auth/SignUp";
import SignIn from "../Auth/SignIn";

// Fix default marker icon issue in Leaflet
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to update map view when address changes
function MapUpdater({ address }) {
  const map = useMap();
  
  useEffect(() => {
    if (address && address.includes(",")) {
      const [lat, lng] = address.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 15);
      }
    }
  }, [address, map]);
  
  return null;
}

function LocationPicker({ setAddress, initialPosition }) {
  const [position, setPosition] = useState(initialPosition);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setAddress(`${e.latlng.lat}, ${e.latlng.lng}`);
    },
  });

  return position ? <Marker position={position} icon={markerIcon} /> : null;
}

function MapComponent({ center, setAddress, initialPosition, address }) {
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
        />
        <LocationPicker
          setAddress={setAddress}
          initialPosition={initialPosition}
        />
        <MapUpdater address={address} />
      </MapContainer>
    </div>
  );
}

// Helper function to safely get image URL
const getImageUrl = (item) => {
  if (!item) return "/placeholder.jpg";
  
  if (item.image && typeof item.image === 'string') {
    return item.image;
  }
  
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  
  if (item.images && typeof item.images === 'string') {
    return item.images;
  }
  
  if (item.url && typeof item.url === 'string') {
    return item.url;
  }
  
  if (item.src && typeof item.src === 'string') {
    return item.src;
  }
  
  return "/placeholder.jpg";
};

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
  const [mapCenter, setMapCenter] = useState([-1.9577, 30.1127]); // Kigali default center
  const [isMounted, setIsMounted] = useState(false);
  
  // New state for location search
  const [addressInput, setAddressInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState("");
  // Changed variable name to avoid conflict with imported component
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeoutRef = useRef(null);
  const addressInputRef = useRef(null);

  // Debug log
  useEffect(() => {
    console.log("CheckoutModal mounted with props:", { isOpen, total, cart });
    setIsMounted(true);
    return () => setIsMounted(false);
  }, [isOpen, total, cart]);

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Update map center when address changes
  useEffect(() => {
    if (form.address && form.address.includes(",")) {
      const [lat, lng] = form.address.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    }
  }, [form.address]);

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

  // Handle address input change with debouncing
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddressInput(value);
    setLocationError("");
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchLocation(value);
      }
    }, 500);
  };

  // Handle Enter key press in address input
  const handleAddressKeyPress = (e) => {
    if (e.key === "Enter") {
      // Clear any pending timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      if (addressInput.trim()) {
        searchLocation(addressInput);
      }
    }
  };

  // Search for location using OpenStreetMap Nominatim API
  const searchLocation = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setLocationError("");
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) throw new Error("Failed to fetch location");
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const coordinates = `${lat},${lon}`;
        
        // Update form with coordinates but keep the address input unchanged
        setForm((prev) => ({ ...prev, address: coordinates }));
        
        // Map center will be updated via the useEffect above
      } else {
        setLocationError("Location not found");
      }
    } catch (err) {
      console.error("Error searching location:", err);
      setLocationError("Failed to search location");
    } finally {
      setIsSearching(false);
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
        setAddressInput(coords); // Show coordinates when using my location
        // Map center will be updated via the useEffect above
      },
      (err) => {
        alert("Failed to get location: " + err.message);
      }
    );
  };

  // const validateForm = () => {
  //   const errors = {};
  //   if (!form.name.trim()) errors.name = "Name is required";
  //   if (!form.email.trim()) {
  //     errors.email = "Email is required";
  //   } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
  //     errors.email = "Please enter a valid email address";
  //   }
  //   if (!form.phone.trim()) {
  //     errors.phone = "Phone number is required";
  //   } else if (
  //     !/^\+?[0-9\s\-()]{7,20}$/.test(form.phone.replace(/\s/g, ""))
  //   ) {
  //     errors.phone = "Please enter a valid phone number";
  //   }
  //   if (!form.address.trim()) errors.address = "Address is required";

  //   setFormErrors(errors);
  //   return Object.keys(errors).length === 0;
  // };

 // In CheckoutModal component, update the handleSubmit function:

const handleSubmit = async (e) => {
  e.preventDefault();
  // if (!validateForm()) {
  //   setMessage("Please correct the errors in the form.");
  //   return;
  // }
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

    // Process cart items to ensure color data is properly formatted
    const processedCart = cart.map(item => ({
      ...item,
      // Ensure we have a colors field (array) for each item
      selectedColors: item.selectedColors || (item.selectedColor ? [item.selectedColor] : [])
    }));

    // Build order object
    const newOrder = {
      id: Date.now().toString(), // unique ID for localStorage
      client: form,
      items: processedCart, // Use processed cart with proper color data
      total,
      status: "Pending", // match MyOrders styling
      timestamp: new Date().toISOString(),
      location,
      userId: user?.uid || null,
    };

    // Save to Firestore
    await addDoc(collection(db, "orders"), newOrder);

    // Save also to localStorage
    const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];
    localStorage.setItem("orders", JSON.stringify([...existingOrders, newOrder]));

    setMessage("Order placed successfully!");
    setForm({ name: "", email: "", phone: "", address: "" });
    setAddressInput("");
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

  // Don't render anything if not mounted or not open
  if (!isMounted || !isOpen) return null;

  return (
    <>
      {/* Flash message */}
      {message && (
        <div className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none">
          <div
            className={`p-6 rounded-xl shadow-2xl max-w-md w-[80%] flex items-center space-x-3 pointer-events-auto transition-all duration-300 ${
              message.includes("success")
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
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

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[98vh] overflow-hidden flex flex-col">
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
              // Show login/signup instead of form
              <div>
                {showSignUp ? <SignUp /> : <SignIn />}
                <p className="mt-4 text-center text-sm text-gray-600">
                  {showSignUp
                    ? "Already have an account?"
                    : "Don't have an account?"}{" "}
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
                {/* Order Summary + Form */}
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
                            src={getImageUrl(item)}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {item.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>Qty: {item.qty}</span>
                              {item.selectedSize && (
                                <span>Size: {item.selectedSize}</span>
                              )}
                              {/* Display multiple colors */}
                              {item.selectedColors && Array.isArray(item.selectedColors) && item.selectedColors.length > 0 && (
                                <span className="flex items-center">
                                  Colors: 
                                  <div className="flex ml-1">
                                    {item.selectedColors.map((color, colorIndex) => (
                                      <span
                                        key={colorIndex}
                                        className="w-4 h-4 rounded-full border ml-1"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      />
                                    ))}
                                  </div>
                                </span>
                              )}
                              {/* Fallback for single color */}
                              {item.selectedColor && (!item.selectedColors || !Array.isArray(item.selectedColors)) && (
                                <span className="flex items-center">
                                  Color: 
                                  <span
                                    className="ml-1 w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: item.selectedColor }}
                                    title={item.selectedColor}
                                  />
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
                      <div className="flex-1 relative">
                        <input
                          ref={addressInputRef}
                          type="text"
                          name="addressInput"
                          value={addressInput}
                          onChange={handleAddressChange}
                          onKeyPress={handleAddressKeyPress}
                          className="w-full px-4 py-3 border rounded-lg"
                          placeholder="Type a city or country name..."
                          disabled={loading}
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          useMyLocation();
                          setIsLocating(true);
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm whitespace-nowrap"
                      >
                        {isLocating ? <LocateFixed className="w-4 h-4 inline-block mr-1" /> : <  MapPinHouse
 className="w-4 h-4 inline-block mr-1" />} 
 

                      </button>
                    </div>
                    {locationError && (
                      <p className="text-sm text-red-600">{locationError}</p>
                    )}
                    {formErrors.address && (
                      <p className="text-sm text-red-600">
                        {formErrors.address}
                      </p>
                    )}
                    {form.address && form.address.includes(",") && (
                      <p className="text-xs text-gray-600 mt-1">
                        Coordinates: {form.address}
                      </p>
                    )}
                  </div>

                  {/* Map Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-red-600" />
                      Select Location on Map
                    </label>
                    <div className="text-xs text-gray-500 mb-2">
                      Click on the map to select your location
                    </div>
                    <MapComponent
                      center={mapCenter}
                      setAddress={(coords) => {
                        setForm((prev) => ({ ...prev, address: coords }));
                        setAddressInput(coords); // Show coordinates when clicking on map
                      }}
                      initialPosition={form.address && form.address.includes(",") 
                        ? form.address.split(",").map(Number) 
                        : mapCenter}
                      address={form.address}
                    />
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