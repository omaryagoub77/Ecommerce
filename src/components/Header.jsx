import { ShoppingCart, List, X, House, Heart, Search } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import React from "react";

export default function Header({ cartItemCount, onCartClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpenTab, setCartOpenTab] = useState(false);

  const location = useLocation();

  // Fix typo: "Wemen" should be "Women"
  const links = ["Home", "Men", "Women", "Kids","Favorites" ,"contact" ,"Orders"];

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Nav */}
            <div className="flex items-center space-x-8">
              <NavLink to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-700 rounded-full flex items-center  justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <h1 className="text-2xl font-bold text-red-700 ml-[-7px]">-commerce</h1>
              </NavLink>

              {/* Desktop Nav */}
              <nav className="hidden md:flex space-x-1">
                {links.map((label) => (
                  <NavLink
                    key={label}
                    to={`/${label === "Home" ? "" : label.toLowerCase()}`}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                        isActive
                          ? "text-white bg-red-700 shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Cart Button */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => {
                    onCartClick();
                    setCartOpenTab(true);
                  }}
                  className="relative p-2 text-gray-600 hover:text-red-700 transition-colors duration-300 rounded-full hover:bg-red-50"
                >
                  <ShoppingCart className="w-6 h-6" />
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
              const Icon = label === "Home" ? House : label === "Favorites" ? Heart : null;
              return (
                <NavLink
                  key={label}
                  to={`/${label === "Home" ? "" : label.toLowerCase()}`}
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
      <nav className="md:hidden flex justify-around items-center py-3 fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-40">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all duration-300 px-4 py-1 rounded-lg ${
              isActive ? "text-red-700 scale-110" : "text-gray-500"
            }`
          }
        >
          <House className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </NavLink>

      

        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all duration-300 px-4 py-1 rounded-lg ${
              isActive ? "text-red-700 scale-110" : "text-gray-500"
            }`
          }
        >
          <Heart className="w-6 h-6" />
          <span className="text-xs mt-1">Favorites</span>
        </NavLink>

        <button
          onClick={() => {
            onCartClick();
            setCartOpenTab(true);
          }}
          className={`relative flex flex-col items-center justify-center transition-all duration-300 px-4 py-1 rounded-lg ${
            cartOpenTab ? "text-red-700 scale-110" : "text-gray-500"
          }`}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="text-xs mt-1">Cart</span>
          {cartItemCount > 0 && (
            <span className="absolute top-0 right-3 bg-red-700 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
        </button>
      </nav>
    </>
  );
}