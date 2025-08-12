import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ShopPage from "./pages/ShopPage";
import Cart from "./components/Cart";
// import './index.css';
import './App.css';
import { ShoppingCart } from "lucide-react";

function App() {
  const [cart, setCart] = useState([]);

  const clearCart = () => setCart([]);

  return (
    <Router>
      <header>
          
        <nav>
        <div className="nav">
          <h1 className="logo">Small Shop</h1>
          <div className="links">
            <Link className="link" to="/shop">Shop</Link>
            <br />
            
          </div>
        </div>
        </nav>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <ShopPage cart={cart} setCart={setCart} clearCart={clearCart} />
          }
        />
        <Route
          path="/shop"
          element={
            <ShopPage  cart={cart} setCart={setCart} clearCart={clearCart} />
          }
        />
        <Route
          path="/cart"
          element={
            <Cart cart={cart} clearCart={clearCart} />
          }
        />
        
      </Routes>
    </Router>
  );
}

export default App;
