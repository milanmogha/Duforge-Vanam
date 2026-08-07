// src/pages/OrderDetailsPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getOrder, updateOrderStatus } from '../api/orderApi';
import axios from 'axios';
import socket from '../sockets';
import ProductReview from './ProductReview';
import OrderTracker from '../components/OrderTracker';
import '../css/OrderDetailsPage.css';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const { user } = auth;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const location = useLocation();

  useEffect(() => {
    // If the order was passed via navigation state (from checkout), use it and skip network fetch.
    const preloaded = location?.state?.order;
    if (preloaded) {
      setOrder(preloaded);
      setLoading(false);
      return;
    }

    if (!user) return;

    (async () => {
      try {
        const token = await auth.getToken();
        const data = await getOrder(token, id);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order', err);
        setError(err.message || 'Could not load order');
      } finally {
        setLoading(false);
      }
    })();

    // Listen for real-time order status updates
    const handleOrderStatusUpdate = (data) => {
      console.log('🔔 Order status updated (details page):', data);

      // Only update if this is the current order
      if (data.orderId !== id) return;

      setOrder(prevOrder => {
        if (!prevOrder) return data.order || { status: data.status };

        // If server sent a full order object, merge carefully to preserve heavy fields like images
        const incoming = data.order || {};

        // Merge products: preserve image data from prevOrder when incoming lacks it
        let mergedProducts = prevOrder.products;
        console.debug('Socket incoming.products:', Array.isArray(incoming.products) ? incoming.products.length : incoming.products);
        console.debug('Existing prevOrder.products:', Array.isArray(prevOrder.products) ? prevOrder.products.length : prevOrder.products);
        if (Array.isArray(incoming.products) && incoming.products.length > 0) {
          // Build a map of incoming items by product id for quick lookup
          const incomingById = new Map();
          incoming.products.forEach(it => {
            const pid = it.product && (it.product._id || it.product);
            if (pid) incomingById.set(String(pid), it);
          });

          mergedProducts = prevOrder.products.map((prevItem, idx) => {
            const prevProd = prevItem.product || {};
            const prevId = prevProd._id || prevProd;
            let incomingItem = prevId ? incomingById.get(String(prevId)) : null;

            // Fallback: if no incoming match by id, try by index
            if (!incomingItem && Array.isArray(incoming.products) && incoming.products[idx]) {
              incomingItem = incoming.products[idx];
            }

            if (!incomingItem) {
              // No incoming update for this item — preserve previous
              return prevItem;
            }

            // Normalize incoming product to object when it's just an id
            let inProd = incomingItem.product;
            if (typeof inProd === 'string' || typeof inProd === 'number') inProd = { _id: inProd };
            inProd = inProd || {};

            const hasPrevImages = !!(prevProd.images && Object.keys(prevProd.images).length) || !!prevProd.imageUrl;
            const hasIncomingImages = !!(inProd.images && Object.keys(inProd.images).length) || !!inProd.imageUrl;
            console.debug(`Merging product ${prevId || inProd._id} — prevHasImages:${hasPrevImages} incomingHasImages:${hasIncomingImages}`);

            const mergedProduct = {
              _id: inProd._id || prevProd._id,
              name: inProd.name || prevProd.name,
              price: inProd.price ?? prevProd.price,
              discount: inProd.discount ?? prevProd.discount,
              stock: inProd.stock ?? prevProd.stock,
              description: inProd.description || prevProd.description,
              images: (inProd.images && Object.keys(inProd.images).length) ? inProd.images : prevProd.images,
              imageUrl: inProd.imageUrl || prevProd.imageUrl
            };

            return {
              product: mergedProduct,
              quantity: incomingItem.quantity ?? prevItem.quantity
            };
          });

          // If merge produced no items, keep previous list to avoid UI loss
          if (!Array.isArray(mergedProducts) || mergedProducts.length === 0) {
            console.warn('Merged products empty — preserving previous products to avoid image loss');
            mergedProducts = prevOrder.products;
          }
        }

        return {
          ...prevOrder,
          ...incoming,
          status: data.status || incoming.status || prevOrder.status,
          products: mergedProducts
        };
      });
    };

    socket.on('order-status-updated', handleOrderStatusUpdate);

    return () => {
      socket.off('order-status-updated', handleOrderStatusUpdate);
    };
  }, [id, user]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(true);
    try {
      const token = await auth.getToken();
      const updated = await updateOrderStatus(token, id, 'Cancelled');
      setOrder(updated);
    } catch (err) {
      alert(err.message || 'Unable to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const token = await auth.getToken();
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/orders/${id}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${order.orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice');
      console.error(err);
    }
  };

  if (loading) return <p className="center">Loading order details…</p>;
  if (error) return <p className="center error">{error}</p>;
  if (!order) return <p className="center">Order not found.</p>;

  const canCancel = order.status !== 'Cancelled' && order.status !== 'Delivered';
  const canDownload = order.status === 'Delivered';

  return (
    <div className="order-details-page">

      <div className="order-info">
        <h2>Order #{order.orderId}</h2>
        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></p>
        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
      </div>

      <div className="payment-breakdown">
        <h3>Payment Breakdown</h3>
        <div><span>Items Total:</span><span>₹{order.paymentBreakdown.itemsTotal.toLocaleString()}</span></div>
        <div><span>Tax:</span><span>₹{order.paymentBreakdown.tax.toLocaleString()}</span></div>
        <div><span>Shipping:</span><span>₹{order.paymentBreakdown.shipping.toLocaleString()}</span></div>
        {order.paymentBreakdown.discount > 0 && (
          <div><span>Discount:</span><span>-₹{order.paymentBreakdown.discount.toLocaleString()}</span></div>
        )}
        <hr />
        <div className="grand-total">
          <strong>Total:</strong>
          <strong>₹{order.paymentBreakdown.total.toLocaleString()}</strong>
        </div>
      </div>

      <div className="order-products">
        <h3>Products</h3>
        <div className="products-grid">
          {order.products.filter(item => item.product).map(({ product, quantity }) => {
            
                // Build image source: prefer in-memory image (images.image1), then imageUrl, then placeholder
            let imageSrc = "/images/placeholder.jpg";
            if (product.images && product.images.image1 && product.images.image1.data) {
              const img = product.images.image1;
              try {
                imageSrc = `data:${img.contentType};base64,${img.data.toString('base64')}`;
              } catch (e) {
                console.warn('Failed to build base64 image for product', product._id, e);
                imageSrc = product.imageUrl || "/images/placeholder.jpg";
              }
            } else if (product.imageUrl) {
              imageSrc = product.imageUrl;
            }
            const discountedPrice = Math.floor((product.price * (100 - (product.discount || 0))) / 100);

            return (
              <div key={product._id} className="product-tab">
                <Link 
                  to={`/products/${product._id}`} 
                  className="product-tab-link"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <img
                    src={imageSrc}
                    alt={product.name}
                    onError={(e) => (e.target.src = "/images/placeholder.jpg")}
                  />
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <p className="product-price-detail">
                      Price: ₹{product.price.toLocaleString()}
                      {product.discount > 0 && (
                        <span className="product-discount-detail"> ({product.discount}% off)</span>
                      )}
                    </p>
                    <p>Quantity: {quantity}</p>
                    {product.description && (
                      <p className="product-desc">{product.description}</p>
                    )}
                    <p className="product-subtotal">
                      <strong>Subtotal: ₹{(discountedPrice * quantity).toLocaleString()}</strong>
                    </p>
                  </div>
                </Link>

                {order.status === 'Delivered' && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ProductReview productId={product._id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <OrderTracker 
        status={order.status} 
        trackingLink={order.trackingLink} 
        createdAt={order.createdAt}
      />

      <div className="order-address">
        <h3>Delivery Address</h3>
        <p>{order.userAddress.fullName}</p>
        <p>{order.userAddress.flat}, {order.userAddress.area}</p>
        <p>{order.userAddress.city} – {order.userAddress.pincode}</p>
        <p>{order.userAddress.state}</p>
        <p>Phone: {order.userAddress.phone}</p>
      </div>

      <div className="order-actions">
        {canCancel && (
          <button className="cancel-btn" onClick={handleCancel} disabled={actionLoading}>
            {actionLoading ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}

        <button
          className={`invoice-btn ${!canDownload ? 'disabled' : ''}`}
          onClick={handleDownloadInvoice}
          disabled={!canDownload}
        >
          Download Invoice
        </button>
      </div>
    </div>
  );
}
