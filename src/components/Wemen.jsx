import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const Wemen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWomenProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => p.category === "wemen"); // ✅ filter by category
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching women products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWomenProducts();
  }, []);

  if (loading) return <p>Loading women products...</p>;
  if (products.length === 0) return <p>No products found in women category.</p>;

  return (
    <div>
      <h2>Women Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <img
              src={product.image}
              alt={product.name}
              style={{ width: "80px", height: "80px", objectFit: "cover" }}
            />
            <p>
              <strong>{product.name}</strong> - ${product.price.toFixed(2)} (
              {product.quantity} pcs)
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Wemen;
