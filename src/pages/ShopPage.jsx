import React, { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import CartSlideout from "../components/CartSlideout";
import CheckoutModal from "../components/CheckoutModal";
import { ShoppingCart } from 'lucide-react';
import '../App.css';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === productId ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const increaseQty = (id) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  };

  const decreaseQty = (id) => {
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, qty: item.qty > 1 ? item.qty - 1 : 1 }
        : item
    ));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        console.log("Snapshot received:", snapshot.docs.length);
        const productData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productData);
      },
      (error) => {
        console.error("onSnapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        cartItemCount={getTotalItems()}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
<div className="hero-section flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-8 rounded-lg  mb-12">
  {/* Text Content */}
  <div className="hero-text flex-1">
    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
      Featured Products
    </h2>
    <p className="text-gray-600 mb-6">
      Discover our curated collection of premium items. Handpicked for quality and style.
    </p>
    <button className="hero-btn bg-[transparent] border-2 text-gray px-6 py-3 rounded-[30px] font-semibold hover:bg-amber-700 hover:border-amber-200 transition-colors">
      Shop Now
    </button>
  </div>

  {/* Image */}
  <div className="hero-image flex-1">
    <img
      src="../public/image.jpg"
      alt="Featured Product"
      className="w-full h-auto rounded-lg shadow-lg"
    />
  </div>
</div>

     <h1>Men</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => addToCart(product.id)}
            />
          ))}
        </div>
      </main>

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
    </div>
  );
};

export default ShopPage;