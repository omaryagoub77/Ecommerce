// src/pages/CartPurchasePage.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./CartPurchasePage.css";
import '../App.css';

const CartPurchasePage = ({
  cart = [],
  increaseQty,
  decreaseQty,
  removeItem,
  clearCart,
  showWhiteBackground 
}) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errormessage, setErrormessage] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Basic email format validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setErrormessage("Please fill in all fields.");
      return;
    }

    if (!validateEmail(form.email)) {
      setErrormessage("Please enter a valid email address.");
      return;
    }

    if (cart.length === 0) {
      setErrormessage("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, "orders"), {
        client: form,
        items: cart,
        total,
        timestamp: new Date().toISOString(),
      });
      setMessage(`Order placed! `);
      clearCart();
      setForm({ name: "", email: "", phone: "", address: "" });
    } catch (error) {
      console.error("Error placing order:", error);
      setMessage("Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear message after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
    useEffect(() => {
    if (errormessage ) {
      const timer = setTimeout(() => setErrormessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errormessage]);

  return (
    <section className="purchase-container"   style={{
        display: showWhiteBackground ? "block" : "none",
      }}>
      <h2 className="purchase-title">🛒 Your Cart & Checkout</h2>

      {message && (
        <p className="message" aria-live="polite">
          {message}
        </p>
      )}
         {errormessage && (
        <p className="error-message" aria-live="polite">
          {errormessage}
        </p>
      )}

      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <span className="cart-item-name">{item.name}</span>
                <span className="cart-item-price">${item.price.toFixed(2)}</span>
                <div className="cart-item-qty">
                  <button
                    type="button"
                    onClick={() => decreaseQty(item.id)}
                    className="qty-btn"
                    disabled={loading}
                  >
                    −
                  </button>
                  <span className="qty">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => increaseQty(item.id)}
                    className="qty-btn"
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="remove-btn"
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-total">
            Total: <strong>${total.toFixed(2)}</strong> 
          </div>

          <hr className="divider" />
          <h1 className="purchase" style={{textAlign: "center",color:"white ",backgroundColor: '#b32806'}}>Purchase</h1>

          <form onSubmit={handleSubmit} className="checkout-form">
            <h3>Enter Your Details</h3>
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
            <textarea
              name="address"
              placeholder="Shipping Address"
              value={form.address}
              onChange={handleChange}
              className="form-textarea"
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

CartPurchasePage.propTypes = {
  cart: PropTypes.array.isRequired,
  increaseQty: PropTypes.func.isRequired,
  decreaseQty: PropTypes.func.isRequired,
  removeItem: PropTypes.func.isRequired,
  clearCart: PropTypes.func.isRequired,
};

export default CartPurchasePage;
