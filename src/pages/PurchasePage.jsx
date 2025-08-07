// import React, { useState } from "react";
// import { collection, addDoc } from "firebase/firestore";
// import { db } from "../firebaseConfig";

// const PurchasePage = ({ cart = [], clearCart = () => {} }) => {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: ""
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   // Update form fields on input change
//   const handleChange = (e) => {
//     setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.name || !form.email || !form.phone || !form.address) {
//       setMessage("Please fill in all fields.");
//       return;
//     }
//     if (cart.length === 0) {
//       setMessage("Your cart is empty.");
//       return;
//     }

//     try {
//       setLoading(true);
//       // Save order with client info + cart items
//       const docRef = await addDoc(collection(db, "orders"), {
//         client: form,
//         items: cart,
//         timestamp: new Date()
//       });
//       setMessage(`Order placed! Your order ID is ${docRef.id}`);
//       clearCart();  // clear cart after successful purchase
//       setForm({ name: "", email: "", phone: "", address: "" });
//     } catch (error) {
//       console.error("Error placing order:", error);
//       setMessage("Failed to place order. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
//       <h2>Complete Your Purchase</h2>
//       {message && <p>{message}</p>}
//       <form onSubmit={handleSubmit}>
//         <input
//           // name="name"
//           placeholder="Full Name"
//           value={form.name}
//           onChange={handleChange}
//           style={{ display: "block", marginBottom: 10, width: "100%" }}
//         />
//         <input
//           name="email"
//           type="email"
//           placeholder="Email Address"
//           value={form.email}
//           onChange={handleChange}
//           style={{ display: "block", marginBottom: 10, width: "100%" }}
//         />
//         <input
//           name="phone"
//           placeholder="Phone Number"
//           value={form.phone}
//           onChange={handleChange}
//           style={{ display: "block", marginBottom: 10, width: "100%" }}
//         />
//         <textarea
//           name="address"
//           placeholder="Shipping Address"
//           value={form.address}
//           onChange={handleChange}
//           style={{ display: "block", marginBottom: 10, width: "100%", height: 80 }}
//         />
//         <button
//           type="submit"
//           disabled={loading}
//           style={{
//             padding: "10px 20px",
//             backgroundColor: "#007bff",
//             color: "#fff",
//             border: "none",
//             borderRadius: 4,
//             cursor: "pointer"
//           }}
//         >
//           {loading ? "Processing..." : "Place Order"}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default PurchasePage;
