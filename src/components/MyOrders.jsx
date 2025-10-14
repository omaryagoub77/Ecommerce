import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Calendar,
  Package,
  X,
  CheckCircle,
  Truck,
  AlertCircle,
} from "lucide-react";
import { addDoc, collection, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [removeOrderId, setRemoveOrderId] = useState(null);
  
  // Add these state variables near the top of the component
  const [orderMessages, setOrderMessages] = useState({});
  // Change isSending from boolean to an object to track sending state per order
  const [isSending, setIsSending] = useState({});

  // Add this function to handle sending messages
  const handleSendMessage = async (orderId) => {
    const message = orderMessages[orderId];
    if (!message || !message.trim()) {
      setErrorMessage("Message cannot be empty");
      return;
    }

    // Set sending state for this specific order
    setIsSending(prev => ({ ...prev, [orderId]: true }));
    
    try {
      await addDoc(collection(db, "orderMessages"), {
        orderId,
        message: message.trim(),
        timestamp: serverTimestamp(),
        sender: "customer"
      });

      // Clear the message for this order
      setOrderMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[orderId];
        return newMessages;
      });

      setMessage("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage("Failed to send message.");
    } finally {
      // Clear sending state for this order
      setIsSending(prev => {
        const newSendingState = { ...prev };
        delete newSendingState[orderId];
        return newSendingState;
      });
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  // Add this function to handle message input changes
  const handleMessageChange = (orderId, value) => {
    setOrderMessages(prev => ({
      ...prev,
      [orderId]: value
    }));
  };

  // store active firestore listeners keyed by local order id
  const listenersRef = useRef({});

  // --- LocalStorage helpers ---
  const getOrdersFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem("orders");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Error reading orders from localStorage:", err);
      return [];
    }
  }, []);

  const saveOrdersToStorage = useCallback((ordersArr) => {
    try {
      localStorage.setItem("orders", JSON.stringify(Array.isArray(ordersArr) ? ordersArr : []));
    } catch (err) {
      console.error("Error saving orders to localStorage:", err);
    }
  }, []);

  // Get cancellation requests from localStorage
  const getCancellationsFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem("cancellationRequests");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Error reading cancellation requests from localStorage:", err);
      return [];
    }
  }, []);

  // Save cancellation requests to localStorage
  const saveCancellationsToStorage = useCallback((cancellationsArr) => {
    try {
      localStorage.setItem("cancellationRequests", JSON.stringify(Array.isArray(cancellationsArr) ? cancellationsArr : []));
    } catch (err) {
      console.error("Error saving cancellation requests to localStorage:", err);
    }
  }, []);

  // --- Fetch local orders on mount ---
  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const saved = getOrdersFromStorage();
      setOrders(saved);
    } catch (err) {
      console.error("Error fetching local orders:", err);
      setError("Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  }, [getOrdersFromStorage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Setup/teardown Firestore listeners for each local order ---
  useEffect(() => {
    // Ensure we only create listeners for orders we don't already listen to
    const localIds = orders.map((o) => o.id).filter(Boolean);
    const existingListenerIds = Object.keys(listenersRef.current);

    // add listeners for new orders
    localIds.forEach((id) => {
      if (listenersRef.current[id]) return; // already listening

      // Query the orders collection where a document field 'id' equals our local order id
      const q = query(collection(db, "orders"), where("id", "==", id));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            // assume the first match is the corresponding document
            const docData = snapshot.docs[0].data();

            // Update only status & timestamp in local state (rest remains from localStorage)
            setOrders((prev) =>
              prev.map((o) =>
                o.id === id
                  ? {
                      ...o,
                      status: docData.status ?? o.status,
                      timestamp: docData.timestamp ?? o.timestamp,
                    }
                  : o
              )
            );

            // Also persist updated status/timestamp back to localStorage so it's consistent
            try {
              const stored = getOrdersFromStorage();
              const updatedStored = stored.map((o) =>
                o.id === id
                  ? {
                      ...o,
                      status: docData.status ?? o.status,
                      timestamp: docData.timestamp ?? o.timestamp,
                    }
                  : o
              );
              saveOrdersToStorage(updatedStored);
            } catch (e) {
              console.error("Failed to persist updated order status to localStorage:", e);
            }
          }
        },
        (err) => {
          console.error(`Firestore listener error for order ${id}:`, err);
        }
      );

      listenersRef.current[id] = unsubscribe;
    });

    // remove listeners for orders that no longer exist locally
    existingListenerIds.forEach((id) => {
      if (!localIds.includes(id)) {
        // unsubscribe and remove from map
        try {
          listenersRef.current[id]?.();
        } catch (e) {
          /* ignore */
        }
        delete listenersRef.current[id];
      }
    });

    // NOTE: Do not unsubscribe all listeners here — we keep listeners for current orders.
    // Cleanup of all listeners is handled on unmount below.
  }, [orders, getOrdersFromStorage, saveOrdersToStorage]);

  // cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(listenersRef.current).forEach((unsub) => {
        try {
          unsub?.();
        } catch (e) {
          /* ignore */
        }
      });
      listenersRef.current = {};
    };
  }, []);

  // --- Remove order (local only) ---
  const handleRemoveOrder = useCallback(
    (orderId) => {
      try {
        // unsubscribe that order's listener (if any)
        if (listenersRef.current[orderId]) {
          try {
            listenersRef.current[orderId]();
          } catch (e) {}
          delete listenersRef.current[orderId];
        }

        const current = getOrdersFromStorage();
        const updated = current.filter((o) => o.id !== orderId);
        saveOrdersToStorage(updated);
        setOrders(updated);
        setMessage("Order removed successfully!");
        setShowRemoveModal(false);
        setRemoveOrderId(null);
      } catch (err) {
        console.error("Error removing order:", err);
        setErrorMessage("Failed to remove order.");
      }
    },
    [getOrdersFromStorage, saveOrdersToStorage]
  );

  const openRemoveModal = (orderId) => {
    setRemoveOrderId(orderId);
    setShowRemoveModal(true);
  };

  // Cancel request (send message to admin)
  const handleCancelOrder = async (orderId) => {
    if (!orderId) {
      console.error("❌ Order ID is missing, cannot send cancellation");
      setErrorMessage("Order ID not found. Please try again.");
      return;
    }

    try {
      // Send cancellation request to Firestore
      await addDoc(collection(db, "cancellations"), {
        orderId, 
        message: `User requested to cancel order #${orderId}`,
        timestamp: serverTimestamp(),
      });

      // Save cancellation request to localStorage
      const currentCancellations = getCancellationsFromStorage();
      const newCancellation = {
        orderId,
        message: `User requested to cancel order #${orderId}`,
        timestamp: new Date().toISOString(),
      };
      saveCancellationsToStorage([...currentCancellations, newCancellation]);

      // Update the order in localStorage to mark it as cancellation requested
      const currentOrders = getOrdersFromStorage();
      const updatedOrders = currentOrders.map(order => 
        order.id === orderId 
          ? { ...order, cancellationRequested: true } 
          : order
      );
      saveOrdersToStorage(updatedOrders);
      setOrders(updatedOrders);

      setMessage("✅ Your cancel request has been sent to admin.");
      setShowCancelModal(false);
      setCancelOrderId(null);
    } catch (error) {
      console.error("Error sending cancel request:", error);
      setErrorMessage("❌ Failed to send cancel request.");
    }
  };

  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  };

  // --- Helpers for display ---
  const calculateOrderTotal = (items) =>
    (items || []).reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { bgColor: "bg-yellow-100", textColor: "text-yellow-800", icon: <AlertCircle className="w-4 h-4" /> };
      case "In Transit":
      case "Shipped":
        return { bgColor: "bg-blue-100", textColor: "text-blue-800", icon: <Truck className="w-4 h-4" /> };
      case "Delivered":
        return { bgColor: "bg-green-100", textColor: "text-green-800", icon: <CheckCircle className="w-4 h-4" /> };
      case "Cancelled":
        return { bgColor: "bg-red-100", textColor: "text-red-800", icon: <X className="w-4 h-4" /> };
      default:
        return { bgColor: "bg-gray-100", textColor: "text-gray-800", icon: <Package className="w-4 h-4" /> };
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (message || errorMessage) {
      const timer = setTimeout(() => {
        setMessage(null);
        setErrorMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, errorMessage]);

  // --- Render states ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex flex-col justify-center items-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Oops!</h1>
        <p className="text-gray-600 text-lg mb-8">{error}</p>
        <button onClick={fetchOrders} className="px-6 py-3 bg-red-700 text-white rounded-lg">
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex flex-col justify-center items-center">
        <ShoppingCart className="w-24 h-24 text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Orders</h1>
        <p className="text-gray-600 text-lg mb-8">You haven't placed any orders yet.</p>
        <Link to="/" className="px-6 py-3 bg-red-700 text-white rounded-lg">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Messages */}
      {(message || errorMessage) && (
        <div className="fixed top-4 right-4 z-50">
          {message && (
            <div className="mb-2 p-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {message}
            </div>
          )}
          {errorMessage && (
            <div className="mb-2 p-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {errorMessage}
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-red-700">My Orders</h1>
          <div className="w-24 h-1 bg-red-600 mx-auto mt-4 rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order, index) => {
            const statusStyle = getStatusStyle(order.status);
            const orderTotal = calculateOrderTotal(order.items || []);
            const isCancellable = order.status !== "Cancelled" && order.status !== "Delivered" && !order.cancellationRequested;

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.08 }} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Order {order.id}</h3>
                      <div className="flex items-center text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="text-sm">{formatDate(order.timestamp)}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bgColor} ${statusStyle.textColor}`}>
                      {statusStyle.icon}
                      <span className="ml-1">{order.status}</span>
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Products Ordered</h4>
                  <div className="space-y-4">
                    {(order.items || []).map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img src={item.image || (Array.isArray(item.images) ? item.images[0] : item.images)} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-gray-900 truncate">{item.name}</h5>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-500">Qty: {item.qty}</span>
                            <span className="text-sm font-medium text-gray-900">${(Number(item.price) * Number(item.qty)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">Grand Total</span>
                    <span className="text-lg font-bold text-red-700">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center px-5 py-3">
                  {isCancellable ? (
                    <button 
                      onClick={() => openCancelModal(order.id)} 
                      className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium"
                    >
                      <X className="w-4 h-4" /> Cancel order
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm flex items-center gap-2 cursor-not-allowed">
                      <X className="w-4 h-4" /> 
                      {order.cancellationRequested ? "Cancellation Requested" : "The order is cancelled"}
                    </span>
                  )}
                  
                  <button 
                    onClick={() => openRemoveModal(order.id)} 
                    className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>

              
                <div className="p-5 border-t border-gray-100 w-full">
                  <div className="mb-2">
                    <label htmlFor={`message-${order.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Message to Delivery
                    </label>
                    <textarea
                      id={`message-${order.id}`}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Type your message here..."
                      value={orderMessages[order.id] || ''}
                      onChange={(e) => handleMessageChange(order.id, e.target.value)}
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={() => handleSendMessage(order.id)}
                    // Check if this specific order is sending and if message is empty
                    disabled={isSending[order.id] || !orderMessages[order.id]?.trim()}
                    className="mt-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSending[order.id] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Cancellation</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to request cancellation for order #{cancelOrderId}? The admin will review your request.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                No, Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancelOrderId)}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
              >
                Yes, Request Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Removal</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to remove order #{removeOrderId} from your orders list? This will only remove it from your view.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveOrder(removeOrderId)}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
              >
                Remove Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;