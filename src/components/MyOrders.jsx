import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Calendar, Package, X, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig"; // make sure path is correct

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Calculate total price for each order
  const calculateOrderTotal = (products) => {
    if (!products) return 0;
    return products.reduce((total, product) => total + (Number(product.price) * Number(product.qty || product.quantity || 1)), 0);
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> };
      case 'In Transit':
      case 'Shipped':
        return { bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: <Truck className="w-4 h-4" /> };
      case 'Delivered':
        return { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
      case 'Cancelled':
        return { bgColor: 'bg-red-100', textColor: 'text-red-800', icon: <X className="w-4 h-4" /> };
      default:
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: <Package className="w-4 h-4" /> };
    }
  };

  // Format Firestore timestamp or date string
  const formatDate = (date) => {
    if (!date) return "No date";
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-red-700">My Orders</h1>
          <div className="w-24 h-1 bg-red-600 mx-auto mt-4 rounded-full"></div>
        </motion.div>

        {/* Orders Grid */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 bg-white rounded-2xl shadow-lg"
          >
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <Link
              to="/shop"
              className="inline-block px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-md hover:shadow-lg"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order, index) => {
              const statusStyle = getStatusStyle(order.status);
              const orderTotal = calculateOrderTotal(order.items || order.products);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Order Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Order {order.id}</h3>
                        <div className="flex items-center text-gray-500 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className="text-sm">{formatDate(order.timestamp || order.date)}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bgColor} ${statusStyle.textColor}`}>
                        {statusStyle.icon}
                        <span className="ml-1">{order.status || "Pending"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="p-5">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Products Ordered</h4>
                    <div className="space-y-4">
                      {(order.items || []).map((product, idx) => (
                        <div key={product.id || idx} className="flex items-center">
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={product.image || (Array.isArray(product.images) ? product.images[0] : product.images)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                            />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-900 truncate">{product.name}</h5>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-gray-500">Qty: {product.qty || product.quantity}</span>
                              <span className="text-sm font-medium text-gray-900">
                                ${(Number(product.price) * (product.qty || product.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium text-gray-900">Grand Total</span>
                      <span className="text-lg font-bold text-red-700">
                        ${orderTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Continue Shopping Button */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              to="/shop"
              className="inline-block px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              Continue Shopping
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
