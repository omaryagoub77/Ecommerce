// src/pages/CartPurchasePage.jsx
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import '../App.css';

const CartPurchasePage = ({
  cart = [],
  increaseQty,
  decreaseQty,
  removeItem,
  clearCart,
}) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, "orders"), {
        client: form,
        items: cart,
        total,
        timestamp: new Date(),
      });
      setMessage(`Order placed! ID: ${docRef.id}`);
      clearCart();
      setForm({ name: "", email: "", phone: "", address: "" });
    } catch (error) {
      console.error("Error placing order:", error);
      setMessage("Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: "20px" }}>
      <h2>rrrrrrrrrrrrrrrrrrrrrrrrrrrr</h2>

      {message && <p>{message}</p>}

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div
                key={item.id}
                className="cart-item"
                style={{
                  marginBottom: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                />
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
                <div className="quantity-controls">
                  <button className="encrease" onClick={() => decreaseQty(item.id)}>−</button>
                  <span style={{ margin: "0 10px" }}>{item.qty}</span>
                  <button className="decrease"  onClick={() => increaseQty(item.id)}>+</button>
                </div>
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px" }}>
            <p>
              <strong>Total:</strong> ${total.toFixed(2)}
            </p>
          </div>

          <hr style={{ margin: "20px 0" }} />

          <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
            <h3>Enter Your Details</h3>
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              style={{ display: "block", marginBottom: 10, width: "100%" }}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              style={{ display: "block", marginBottom: 10, width: "100%" }}
            />
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              style={{ display: "block", marginBottom: 10, width: "100%" }}
            />
            <textarea
              name="address"
              placeholder="Shipping Address"
              value={form.address}
              onChange={handleChange}
              style={{
                display: "block",
                marginBottom: 10,
                width: "100%",
                height: 80,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#b32806",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

export default CartPurchasePage;
