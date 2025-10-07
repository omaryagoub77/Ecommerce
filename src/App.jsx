import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

// Lazy load components for better initial load time
const ShopPage = lazy(() => import("./components/Shop"));
const Men = lazy(() => import("./components/Men"));
const Wemen = lazy(() => import("./components/Wemen"));
const Kids = lazy(() => import("./components/Kids"));
const FavoritesPage = lazy(() => import("./components/Favourite"));
const ProductReviewPage = lazy(() => import("./components/ProductReviewPage"));
const ContactPage = lazy(() => import("./components/ContactPage"));
const MyOrders = lazy(() => import("./components/Myorders"));

// Import frequently used components normally to avoid flash
import Header from "./components/Header";
import CartSlideout from "./components/CartSlideout";
import CheckoutModal from "./components/CheckoutModal";
import Footer from "./components/Footer";

import "./App.css";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
  </div>
);

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  // const [user, setUser] = useState(null);
  // const [loading, setLoading] = useState(true);

  // ✅ Track logged in user
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     setUser(currentUser);
  //     setLoading(false);
  //   });
  //   return () => unsubscribe();
  // }, []);

  // --- Cart handlers ---
  const addToCart = useCallback((product) => {
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
  }, []);

  const increaseQty = useCallback((id) =>
    setCart(cart =>
      cart.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    ), []);

  const decreaseQty = useCallback((id) =>
    setCart(cart =>
      cart.map((item) =>
        item.id === id ? { ...item, qty: item.qty > 1 ? item.qty - 1 : 1 } : item
      )
    ), []);

  const removeItem = useCallback((id) => setCart(cart => cart.filter((item) => item.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);
  
  // Memoized calculations
  const cartStats = useMemo(() => ({
    totalItems: cart.reduce((sum, item) => sum + item.qty, 0),
    totalPrice: cart.reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0)
  }), [cart]);

  // Optimized handlers
  const handleCartClick = useCallback(() => setIsCartOpen(true), []);
  const handleCartClose = useCallback(() => setIsCartOpen(false), []);
  const handleCheckoutOpen = useCallback(() => {
    setIsCheckoutOpen(true);
    setIsCartOpen(false);
  }, []);
  const handleCheckoutClose = useCallback(() => setIsCheckoutOpen(false), []);
  
  const handleFavoriteAdd = useCallback((product) => {
    setFavorites(prev => [...prev, product]);
  }, []);
  
  const handleFavoriteRemove = useCallback((id) => {
    setFavorites(prev => prev.filter((f) => f.id !== id));
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // if (loading) return <p>Loading...</p>;

  return (
    <HashRouter>
      <Header
        cartItemCount={cartStats.totalItems}
        onCartClick={handleCartClick}
        onSearch={handleSearch}
      />

      <CartSlideout
        isOpen={isCartOpen}
        onClose={handleCartClose}
        cart={cart}
        onIncreaseQty={increaseQty}
        onDecreaseQty={decreaseQty}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={handleCheckoutOpen}
        total={cartStats.totalPrice}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        cart={cart}
        total={cartStats.totalPrice}
        onOrderSuccess={clearCart}
        // user={user} // ✅ pass user to modal
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <ShopPage
                onAddToCart={addToCart}
                onAddToFavorites={handleFavoriteAdd}
                onRemoveFromFavorites={handleFavoriteRemove}
                favorites={favorites}
                searchQuery={searchQuery}
              />
            }
          />
          <Route path="/men" element={<Men onAddToCart={addToCart} />} />
          <Route path="/orders" element={<MyOrders onAddToCart={addToCart} />} />
          <Route path="/women" element={<Wemen onAddToCart={addToCart} />} />
          <Route path="/kids" element={<Kids onAddToCart={addToCart} />} />
          <Route path="/favorites" element={<FavoritesPage favorites={favorites} onAddToCart={addToCart} />} />
          <Route path="/product/:id" element={<ProductReviewPage onAddToCart={addToCart} />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Suspense>

      <Footer />
    </HashRouter>
  );
}

export default App;
