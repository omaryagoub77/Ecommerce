import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import OrderManagement from './components/OrderManagement';
import AddProduct from "./pages/addProduct";
import ShopPage from "./pages/ShopPage";
import './index.css';

function App() {
  const [cart, setCart] = useState([]);

  const styles = {
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 20px',
      backgroundColor: '#f4f4f4',
      borderBottom: '1px solid #ccc',
    },
    logo: {
      margin: 0,
      fontSize: '20px',
      color: '#333',
    },
    links: {
      display: 'flex',
      gap: '15px',
    },
    link: {
      textDecoration: 'none',
      color: '#007bff',
      fontWeight: 'bold',
    },
  };

  return (
    <Router>
      <header>
        <nav style={styles.nav}>
          <h2 style={styles.logo}>Small Shop</h2>
          <div style={styles.links}>
            <Link to="/shop" style={styles.link}>Shop</Link>
            <Link to="/orders" style={styles.link}>Order Management</Link>
            <Link to="/add-product" style={styles.link}>Add Product</Link>
          </div>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ShopPage />} />
<Route
  path="/"
  element={<ShopPage cart={cart} setCart={setCart} />}
/>
<Route
  path="/shop"
  element={<ShopPage cart={cart} setCart={setCart} />}
/>

        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/orders" element={<OrderManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
