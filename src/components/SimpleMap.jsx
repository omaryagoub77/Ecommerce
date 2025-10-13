// SimpleMap.jsx - A fallback map component that doesn't rely on Leaflet
import React, { useState, useEffect } from "react";

const SimpleMap = ({ center, setAddress, initialPosition, address }) => {
  const [coordinates, setCoordinates] = useState(
    initialPosition || center || [-1.9577, 30.1127]
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // If we have address coordinates, use them
    if (address && address.includes(",")) {
      const [lat, lng] = address.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoordinates([lat, lng]);
      }
    }
  }, [address, initialPosition, center]);

  const handleMapClick = (e) => {
    // In a real implementation, you would get the actual coordinates from the click
    // For this simple version, we'll just use the center coordinates
    const [lat, lng] = coordinates;
    const newLat = lat + (Math.random() - 0.5) * 0.01;
    const newLng = lng + (Math.random() - 0.5) * 0.01;
    const coords = `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
    setCoordinates([newLat, newLng]);
    setAddress(coords);
  };

  if (!isClient) {
    return (
      <div className="w-full h-64 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border relative">
      <div 
        className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center cursor-pointer relative"
        onClick={handleMapClick}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="text-center p-4 bg-white/80 rounded-lg backdrop-blur-sm">
          <p className="text-gray-700 font-medium">Interactive Map</p>
          <p className="text-sm text-gray-500 mt-1">Click to select location</p>
          <p className="text-xs text-gray-400 mt-2">
            {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
          </p>
        </div>
      </div>
      <div className="absolute bottom-2 left-2 bg-white/80 px-2 py-1 rounded text-xs text-gray-600">
        Map Placeholder
      </div>
    </div>
  );
};

export default SimpleMap;