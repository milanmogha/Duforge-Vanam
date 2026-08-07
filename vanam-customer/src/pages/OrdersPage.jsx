// src/pages/OrdersPage.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from './CartContext';
import { getMyOrders } from '../api/orderApi';
import { getProductById } from '../api/productApi';
import socket from '../sockets';
import '../css/OrdersPage.css';

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

// Helper function to filter orders by tab
const filterOrdersByTab = (ordersList, tab) => {
  if (tab === 'all') {
    return ordersList.filter(o =>
      ['pending', 'shipped', 'confirmed'].includes(o.status.toLowerCase())
    );
  } else if (tab === 'delivered') {
    return ordersList.filter(o => o.status.toLowerCase() === 'delivered');
  } else if (tab === 'cancelled') {
    return ordersList.filter(o => o.status.toLowerCase() === 'cancelled');
  }
  return ordersList;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth();
  const { user } = auth;
  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const token = await auth.getToken();
        const data = await getMyOrders(token);
        setOrders(data);
        setFilteredOrders(data);
      } catch (err) {
        console.error('Failed to load orders', err);
        setError(err.message || 'Could not load your orders.');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();

    // Listen for real-time order status updates
    const handleOrderStatusUpdate = (data) => {
      console.log('🔔 Order status updated:', data);
      
      // Update the orders list with the new status
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order._id === data.orderId) {
            // Merge the complete updated order
            return { ...order, ...data.order, status: data.status };
          }
          return order;
        });
        
        // Also update filtered orders immediately based on current tab
        const newFiltered = filterOrdersByTab(updatedOrders, activeTab);
        setFilteredOrders(newFiltered);
        
        return updatedOrders;
      });

      // Show a toast notification
      setToastMessage(`Order status updated to: ${data.status}`);
      setTimeout(() => setToastMessage(''), 3000);
    };

    socket.on('order-status-updated', handleOrderStatusUpdate);

    return () => {
      socket.off('order-status-updated', handleOrderStatusUpdate);
    };
  }, [user, activeTab]);

  // Filter orders based on active tab
  useEffect(() => {
    const filtered = filterOrdersByTab(orders, activeTab);
    setFilteredOrders(filtered);
  }, [activeTab, orders]);

  const handleTabClick = (tabName) => setActiveTab(tabName);

  // Memoize filtered orders to prevent recalculation on every render
  const displayOrders = useMemo(() => filteredOrders, [filteredOrders]);

  // Memoize product image rendering function
  const renderProductItem = useCallback((product, quantity) => {
    let imageSrc = "/images/placeholder.jpg";

    if (product.imageUrl) {
      imageSrc = product.imageUrl;
    }

    const discountedPrice =
      (product.price * (100 - (product.discount || 0))) / 100;

    return { imageSrc, discountedPrice };
  }, []);

  if (loading) return <p className="center">Loading your orders…</p>;
  if (error) return <p className="center error">{error}</p>;
  if (!orders.length) return <p className="center">You have no orders yet.</p>;

  return (
    <>
      {toastMessage && <div className="order-toast">{toastMessage}</div>}

      <div className="orders-container">
        <h1>My Orders</h1>

        {/* Tabs */}
        <div className="status-tabs">
          <button
            className={`status-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabClick('all')}
          >
            On Shipping
          </button>
          <button
            className={`status-tab ${activeTab === 'delivered' ? 'active' : ''}`}
            onClick={() => handleTabClick('delivered')}
          >
            Arrived
          </button>
          <button
            className={`status-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => handleTabClick('cancelled')}
          >
            Canceled
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="center">No orders found.</p>
        ) : (
          displayOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-header-info">
                  <div>
                    <strong>Order ID</strong>
                    <span className="order-id">{order.orderId}</span>
                  </div>
                  <div>
                    <strong>Estimated arrival</strong>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <strong>Status</strong>
                    <span className={`status status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <strong>Total</strong>
                    <span className="order-total">
                      {formatPrice(order.paymentBreakdown.total)}
                    </span>
                  </div>
                </div>

                <div className="order-header-actions">
                  <button
                    className="buy-again-btn"
                    onClick={async () => {
                      try {
                        // Filter out products that no longer exist (null or undefined)
                        const validProducts = order.products
                          .filter(({ product }) => product && product._id)
                          .map(({ product, quantity }) => ({
                            product,
                            quantity
                          }));
                        
                        if (validProducts.length === 0) {
                          setToastMessage('No available products in this order');
                          setTimeout(() => setToastMessage(''), 3000);
                          return;
                        }
                        
                        // Check current stock for each product
                        const stockChecks = await Promise.all(
                          validProducts.map(async ({ product, quantity }) => {
                            try {
                              const currentProduct = await getProductById(product._id);
                              return {
                                product,
                                quantity,
                                availableStock: currentProduct.stock,
                                name: currentProduct.name
                              };
                            } catch (err) {
                              return {
                                product,
                                quantity,
                                availableStock: 0,
                                name: product.name,
                                error: true
                              };
                            }
                          })
                        );
                        
                        // Check if any products have insufficient stock
                        const insufficientStock = stockChecks.filter(
                          item => item.quantity > item.availableStock
                        );
                        
                        if (insufficientStock.length > 0) {
                          const outOfStockItems = insufficientStock
                            .map(item => `${item.name} (Need: ${item.quantity}, Available: ${item.availableStock})`)
                            .join(', ');
                          setToastMessage(`Insufficient stock: ${outOfStockItems}`);
                          setTimeout(() => setToastMessage(''), 5000);
                          return;
                        }
                        
                        // Navigate to checkout with order products
                        navigate('/checkout', { 
                          state: { 
                            buyAgainProducts: validProducts
                          } 
                        });
                      } catch (err) {
                        console.error('Error navigating to checkout:', err);
                        setToastMessage('Failed to proceed to checkout');
                        setTimeout(() => setToastMessage(''), 3000);
                      }
                    }}
                  >
                    Buy Again
                  </button>
                  <Link to={`/orders/${order._id}`} className="view-order-btn">
                    Details
                  </Link>
                </div>
              </div>

              {/* Product Rendering */}
              {order.products.length < 3 ? (
                <div className="order-products-list">
                  {order.products.filter(p => p.product).map(({ product, quantity }) => {
                    const { imageSrc, discountedPrice } = renderProductItem(product, quantity);
                    return (
                      <Link 
                        key={product._id} 
                        to={`/products/${product._id}`} 
                        className="list-item"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="list-item-image"
                          onError={(e) => (e.target.src = "/images/placeholder.jpg")}
                        />
                        <div className="list-item-details">
                          <div className="list-item-info">
                            <h3 className="list-item-name">{product.name}</h3>
                            <p className="list-item-price-info">
                              Price: {formatPrice(product.price)}
                              {product.discount > 0 && (
                                <span className="list-item-discount"> ({product.discount}% off)</span>
                              )}
                            </p>
                            <p className="list-item-qty">Quantity: {quantity}</p>
                            {product.description && (
                              <p className="list-item-description">
                                {product.description.length > 100 
                                  ? `${product.description.substring(0, 100)}...` 
                                  : product.description}
                              </p>
                            )}
                          </div>
                          <div className="list-item-total">
                            <strong>Total: {formatPrice(discountedPrice * quantity)}</strong>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="order-products-grid">
                  {order.products.filter(p => p.product).map(({ product, quantity }) => {
                    const { imageSrc, discountedPrice } = renderProductItem(product, quantity);
                    return (
                      <Link 
                        key={product._id} 
                        to={`/products/${product._id}`} 
                        className="product-cell"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="product-thumb"
                          onError={(e) => (e.target.src = "/images/placeholder.jpg")}
                        />
                        <div className="product-info">
                          <h3 className="product-name">{product.name}</h3>
                          <p className="product-price-info">
                            Price: {formatPrice(product.price)}
                            {product.discount > 0 && (
                              <span className="product-discount"> ({product.discount}% off)</span>
                            )}
                          </p>
                          <p className="product-qty">Quantity: {quantity}</p>
                          {product.description && (
                            <p className="product-description">
                              {product.description.length > 80 
                                ? `${product.description.substring(0, 80)}...` 
                                : product.description}
                            </p>
                          )}
                          <p className="product-total">
                            <strong>Total: {formatPrice(discountedPrice * quantity)}</strong>
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
