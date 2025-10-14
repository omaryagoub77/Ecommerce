import { ShoppingCart, List, X, House, Heart, Search, Package } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Header({ cartItemCount, onCartClick, isCartOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Navigation links
  const links = ["Home", "Men", "Women", "Kids", "contact", "Orders"];

  // Helper function to check if a link is active
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo + Nav */}
            <div className="flex items-center space-x-3 md:space-x-6 lg:space-x-8">
              <NavLink to="/" className="flex items-center space-x-1.5 sm:space-x-2 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg sm:text-xl">E</span>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent ml-[-2px] sm:ml-[-3px] md:ml-[-4px] group-hover:from-red-600 group-hover:to-red-700 transition-all duration-300 whitespace-nowrap">-commerce</h1>
              </NavLink>

              {/* Desktop Nav */}
              <nav className="hidden md:flex space-x-1">
                {links.map((label) => {
                  const path = label === "Home" ? "/" : `/${label.toLowerCase()}`;
                  return (
                    <NavLink
                      key={label}
                      to={path}
                      end={label === "Home"}
                      className={({ isActive }) =>
                        `relative px-4 py-3 font-medium transition-all duration-300 group ${
                          isActive
                            ? "text-red-700"
                            : "text-gray-600 hover:text-gray-900"
                        }`
                      }
                    >
                      {label}
                      {/* Red underline for active state */}
                      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-red-700 transform transition-transform duration-300 ${
                        isActive(path) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
                      }`} />
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Favorites Heart Button */}
              <div className="hidden md:block">
                <NavLink
                  to="/favorites"
                  className={({ isActive }) =>
                    `relative p-2 transition-colors duration-300 rounded-full ${
                      isActive
                        ? "text-red-700"
                        : "text-gray-600 hover:text-red-700"
                    }`
                  }
                >
                  <Heart className={`w-6 h-6 transition-all duration-300 ${
                    location.pathname === "/favorites" ? "fill-red-700" : "hover:scale-110"
                  }`} />
                </NavLink>
              </div>

              {/* Cart Button */}
              <div className="relative">
                <button
                  onClick={onCartClick}
                  className="relative p-2 text-gray-600 hover:text-red-700 transition-colors duration-300 rounded-full hover:bg-red-50"
                >
                  <ShoppingCart className="w-6 h-6 hover:scale-110 transition-transform duration-300" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-700 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-red-700 transition-colors duration-300 rounded-full hover:bg-red-50 ml-2"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
          <h2 className="text-lg font-bold text-red-700">Menu</h2>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 text-red-700 hover:bg-red-200 rounded-full transition-colors duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <nav className="flex flex-col space-y-1">
            {links.map((label) => {
              const getIcon = (label) => {
                switch(label) {
                  case "Home": return House;
                  case "Favorites": return Heart;
                  case "Orders": return Package;
                  case "contact": return Search;
                  default: return null;
                }
              };
              const Icon = getIcon(label);
              const path = label === "Home" ? "/" : `/${label.toLowerCase()}`;
              return (
                <NavLink
                  key={label}
                  to={path}
                  end={label === "Home"}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-red-100 text-red-700 font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {Icon && <Icon className="w-5 h-5 mr-3" />}
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-2 left-2 right-2 bg-white rounded-[40px] shadow-lg border border-gray-200 z-40">
        <div className="flex justify-around items-center py-1 px-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-all duration-300 px-2 py-1 rounded-xl ${
                isActive ? "text-red-400 bg-red-50 scale-105" : "text-gray-500 hover:text-red-400"
              }`
            }
          >
            <House className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-all duration-300 px-2 py-1 rounded-xl ${
                isActive ? "text-red-400 bg-red-50 scale-105" : "text-gray-500 hover:text-red-400"
              }`
            }
          >
            <Heart className={`w-5 h-5 ${
              location.pathname === "/favorites" ? "fill-red-400" : ""
            }`} />
            <span className="text-[10px] mt-0.5 font-medium">Favorites</span>
          </NavLink>
       
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-all duration-300 px-2 py-1 rounded-xl ${
                isActive ? "text-red-400 bg-red-50 scale-105" : "text-gray-500 hover:text-red-400"
              }`
            }
            onClick={() => setMenuOpen(false)}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Orders</span>
          </NavLink>

          <button
            onClick={onCartClick}
            className={`relative flex flex-col items-center justify-center transition-all duration-300 px-2 py-1 rounded-xl ${
              isCartOpen ? "text-red-400 bg-red-50 scale-105" : "text-gray-500 hover:text-red-400"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md animate-pulse">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}