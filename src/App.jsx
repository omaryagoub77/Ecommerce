import React, { useState } from "react";
import { Routes, Route, HashRouter , BrowserRouter } from "react-router-dom";

import ShopPage from "./components/Shop";
import Men from "./components/Men";
import Wemen from "./components/Wemen";
import Kids from "./components/Kids";
import FavoritesPage from "./components/Favourite"; // ✅ Import FavoritesPage
import Header from "./components/Header";
import CartSlideout from "./components/CartSlideout";
import CheckoutModal from "./components/CheckoutModal";
        import ProductReviewPage from "./components/ProductReviewPage";
import "./App.css";

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Favorite handlers
  const handleAddToFavorites = (product) => {
    setFavorites((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev; // already favorited
      return [...prev, product];
    });
  };

  const handleRemoveFromFavorites = (productId) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  // Cart handlers
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, qty: item.qty > 1 ? item.qty - 1 : 1 } : item
      )
    );
  };

  const removeItem = (id) => setCart(cart.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.qty, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0);

  return (
    <BrowserRouter>
      <Header
        cartItemCount={getTotalItems()}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={setSearchQuery}
      />

      <CartSlideout
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onIncreaseQty={increaseQty}
        onDecreaseQty={decreaseQty}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={() => {
          setIsCheckoutOpen(true);
          setIsCartOpen(false);
        }}
        total={getTotalPrice()}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        total={getTotalPrice()}
        onOrderSuccess={clearCart}
      />

      <Routes>
        <Route
          path="/"
          element={
            <ShopPage
              onAddToCart={addToCart}
              onAddToFavorites={handleAddToFavorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              favorites={favorites}
              searchQuery={searchQuery}
            />
          }
        />
        <Route
          path="/Ecommerce"
          element={
            <ShopPage
              onAddToCart={addToCart}
              onAddToFavorites={handleAddToFavorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              favorites={favorites}
              searchQuery={searchQuery}
            />
          }
        />
        <Route
          path="/men"
          element={
            <Men
              onAddToCart={addToCart}
              onAddToFavorites={handleAddToFavorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              favorites={favorites}
              searchQuery={searchQuery}
            />
          }
        />
        <Route
          path="/women"
          element={
            <Wemen
              onAddToCart={addToCart}
              onAddToFavorites={handleAddToFavorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              favorites={favorites}
              searchQuery={searchQuery}
            />
          }
        />
        <Route
          path="/kids"
          element={
            <Kids
              onAddToCart={addToCart}
              onAddToFavorites={handleAddToFavorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              favorites={favorites}
              searchQuery={searchQuery}
            />
          }
        />
        {/* ✅ Favorites Page Route */}
        <Route
          path="/favorites"
          element={
            <FavoritesPage
              favorites={favorites}
              onRemoveFromFavorites={handleRemoveFromFavorites}
              onAddToCart={addToCart}
            />
          }
        />
<Route
  path="/product/:id"
  element={
    <ProductReviewPage
      onAddToCart={addToCart}
      onAddToFavorites={handleAddToFavorites}
      favorites={favorites}
    />
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
