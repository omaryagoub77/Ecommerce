import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import React from "react";

const Cart = ({ cart = [], increaseQty, decreaseQty, removeItem, clearCart }) => {
  // Safe default fallback for cart
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePurchase = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "orders"), {
        items: cart,
        timestamp: new Date().toISOString()
      });
      alert("Order placed successfully! ID: " + docRef.id);
      clearCart(); // Optional: clear cart after order
    } catch (error) {
      console.error("Error adding order: ", error);
      alert("Failed to place order.");
    }
  };

  return (
    <section id="cart" style={{ padding: "20px", backgroundColor: "#f9f9f9" }}>
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item" style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={item.image} alt={item.name} style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
                <div>
                  <button onClick={() => decreaseQty(item.id)}>−</button>
                  <span style={{ margin: "0 10px" }}>{item.qty}</span>
                  <button onClick={() => increaseQty(item.id)}>+</button>
                </div>
                <button onClick={() => removeItem(item.id)} className="remove-btn">Remove</button>
              </div>
            ))}
          </div>
          <div className="cart-total" style={{ marginTop: "20px" }}>
            <p><strong>Total:</strong> ${total.toFixed(2)}</p>
            <button className="add-to-cart" onClick={handlePurchase}>Purchase</button>
          </div>
        </>
      )}
    </section>
  );
};

export default Cart;
