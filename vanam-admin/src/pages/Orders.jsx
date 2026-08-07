// src/pages/Orders.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders } from '../api/orderApi';
import '../css/Orders.css';
import AdminNavbar from './Navbar';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('Not authenticated as admin');

        const data = await fetchAllOrders(token);
        
        // --- DEBUG LOG: Check what the backend is actually sending ---
        console.log("Admin Orders Data:", data); 
        if(data && data.length > 0 && data[0].products && data[0].products.length > 0) {
           console.log("Sample Product Image Data:", data[0].products[0].product?.images);
        }
        // -------------------------------------------------------------

        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load orders (admin):', err);
        const msg =
          err.response?.data?.message || err.message || 'Could not load orders';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Memoize helper to safely get image source - prevents recreation on every render
  const getProductImage = useCallback((product) => {
    if (!product) return "https://placehold.co/100x100?text=No+Product";
    
    // 1. Check for imageUrl (optimized format from backend)
    if (product.imageUrl) return product.imageUrl;
    
    // 2. Check if we have the binary data (Buffer) from MongoDB
    if (product.images?.image1?.data) {
      const bufferData = product.images.image1.data;
      const contentType = product.images.image1.contentType || 'image/jpeg';
      
      // If it's already a base64 string, use it directly
      if (typeof bufferData === 'string') {
        return `data:${contentType};base64,${bufferData}`;
      }
      
      // If it's a Buffer object with data property, convert it
      if (bufferData.data && Array.isArray(bufferData.data)) {
        try {
          const uint8Array = new Uint8Array(bufferData.data);
          let binary = '';
          const chunkSize = 8192;
          
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
          }
          
          const base64String = btoa(binary);
          return `data:${contentType};base64,${base64String}`;
        } catch (error) {
          console.error('Error converting image buffer:', error);
          return "https://placehold.co/100x100?text=Error";
        }
      }
    }

    // 3. Fallback
    return "https://placehold.co/100x100?text=No+Image";
  }, []);

  // Memoize orders list to prevent unnecessary re-renders
  const memoizedOrders = useMemo(() => orders, [orders]);

  return (
    <>
      <AdminNavbar />

      <div className="orders-container">
        <h1>All Orders</h1>

        {loading && <p className="center">Loading all orders…</p>}
        {error && <p className="center error">{error}</p>}
        
        {!loading && !error && orders.length === 0 && (
          <p className="center">No orders found.</p>
        )}

        {!loading &&
          memoizedOrders.map((order) => (
            <div key={order._id || order.orderId} className="order-card">
              <div className="order-card-header">
                <div>
                  <strong>Order ID:</strong> {order.orderId}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#555' }}>
                  {new Date(order.createdAt).toLocaleDateString()}{' '}
                  {new Date(order.createdAt).toLocaleTimeString()}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`order-status status-${order.status?.toLowerCase() || 'unknown'}`}>
                    {order.status || 'Unknown'}
                  </span>
                </div>
                <button
                  className="view-order-btn"
                  onClick={() => navigate(`/admin/orders/${order._id}`)}
                >
                  View Details
                </button>
              </div>

              <div className="order-products-grid">
                {(order.products || []).map(({ product, quantity }, idx) => (
                  <div key={idx} className="product-cell">
                    <img
                      // FIXED: Using helper function to render Base64
                      src={getProductImage(product)}
                      alt={product?.name || 'Unnamed'}
                      className="product-thumb"
                      onError={(e) => e.target.src = "https://placehold.co/100x100?text=Error"}
                    />
                    <div className="product-info">
                      <h3 className="product-name">{product?.name || 'Product Removed'}</h3>
                      <p className="product-price">
                        Price: ₹{product?.price?.toLocaleString() || 'N/A'}
                        {product?.discount > 0 && (
                          <span className="product-discount"> ({product.discount}% off)</span>
                        )}
                      </p>
                      <p className="product-qty">Quantity: x{quantity}</p>
                      {product?.description && (
                        <p className="product-description">
                          {product.description.length > 100 
                            ? `${product.description.substring(0, 100)}...` 
                            : product.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
}