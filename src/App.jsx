import React, { useState, useEffect } from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

import ShopPage from "./components/Shop";
import Men from "./components/Men";
import Wemen from "./components/Wemen";
import Kids from "./components/Kids";
import FavoritesPage from "./components/Favourite";
import Header from "./components/Header";
import CartSlideout from "./components/CartSlideout";
import CheckoutModal from "./components/CheckoutModal";
import ProductReviewPage from "./components/ProductReviewPage";
import Footer from "./components/Footer";
import ContactPage from "./components/ContactPage";
import MyOrders from "./components/Myorders";

import "./App.css";

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

  const increaseQty = (id) =>
    setCart(cart.map((item) =>
      item.id === id ? { ...item, qty: item.qty + 1 } : item
    ));

  const decreaseQty = (id) =>
    setCart(cart.map((item) =>
      item.id === id ? { ...item, qty: item.qty > 1 ? item.qty - 1 : 1 } : item
    ));

  const removeItem = (id) => setCart(cart.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.qty, 0);
  const getTotalPrice = () =>
    cart.reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0);

  // if (loading) return <p>Loading...</p>;

  return (
    <HashRouter>
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
        // user={user} // ✅ pass user to modal
      />

      <Routes>
        <Route
          path="/"
          element={
            <ShopPage
              onAddToCart={addToCart}
              onAddToFavorites={(p) => setFavorites([...favorites, p])}
              onRemoveFromFavorites={(id) =>
                setFavorites(favorites.filter((f) => f.id !== id))
              }
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

      <Footer />
    </HashRouter>
  );
}

export default App;
