import { ShoppingCart, List, X, House, Heart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function Header({ cartItemCount, onCartClick, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = ["Home", "Men", "Favorites", "Wemen", "Kids"];

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Nav */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-red-700">Small Shop</h1>

              {/* Desktop Nav */}
              <nav className="hidden md:flex space-x-6">
                {links.map((label) => (
                  <NavLink
                    key={label}
                    to={`/${label === "Home" ? "" : label.toLowerCase()}`}
                    className={({ isActive }) =>
                      isActive
                        ? "text-red-700 font-semibold transition-colors"
                        : "text-gray-600 hover:text-gray-900 transition-colors"
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Search + Cart + Mobile Toggle */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search products..."
                onChange={(e) => onSearch && onSearch(e.target.value)}
                className="hidden md:block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
              />

              <div className="relative">
                <button
                  onClick={onCartClick}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-700 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay (click to close) */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-red-700">Menu</h2>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex flex-col mt-4 space-y-2 px-4">
          {links.map((label) => (
            <NavLink
              key={label}
              to={`/${label === "Home" ? "" : label.toLowerCase()}`}
              className={({ isActive }) =>
                isActive
                  ? "block px-3 py-2 rounded-md text-red-700 font-semibold"
                  : "block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900"
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="flex  w-full justify-around items-center py-3 fixed bottom-0 left-0 bg-red-300 md:hidden z-40">
        <NavLink to={"/"}>
          <House />
        </NavLink>
        <NavLink to={"/favorites"}>
          <Heart />
        </NavLink>
        <NavLink to={"/cart"}>
          <ShoppingCart />
        </NavLink>
      </nav>
    </>
  );
}
