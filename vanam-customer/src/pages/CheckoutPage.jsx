// /src/pages/CheckoutPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useCart } from './CartContext';
import { createOrder, calculateDeliveryCharges } from '../api/orderApi';
import { fetchAddresses, createAddress } from '../api/addressApi';
import { fetchAvailableCoupons, applyCoupon as applyCouponAPI } from '../api/couponApi';
import { useAuth } from '../hooks/useAuth';
import BRAND from '../config/brand';
import '../css/CheckoutPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faPlus } from '@fortawesome/free-solid-svg-icons';

const openRazorpayCheckout = (options, onFail) => {
  console.log('🔍 Razorpay Checkout Debug:');
  console.log('   - Key from env:', import.meta.env.VITE_RAZORPAY_KEY_ID);
  console.log('   - Key in options:', options.key);
  console.log('   - Amount:', options.amount);
  console.log('   - Order ID:', options.order_id);
  
  if (!options.key) {
    console.error('❌ Razorpay key is missing!');
    if (onFail) onFail({ error: { description: 'Payment gateway configuration error' } });
    return;
  }
  
  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', onFail);
  rzp.open(); // 🔥 MUST be synchronous
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const BLANK_ADDRESS_FORM = {
  fullName: '', phone: '', flat: '', area: '', landmark: '', pincode: '', city: '', state: '', isDefault: false,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { user } = auth;
  const { cart, clearCart, cartTotal } = useCart();

  // Get buyAgainProducts from location state if coming from Buy Again button
  const buyAgainProducts = location.state?.buyAgainProducts || null;

  // Use buyAgainProducts if available, otherwise use cart
  // Ensure checkoutItems always has the correct structure with product and quantity
  const checkoutItems = buyAgainProducts || cart.items || [];

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState(BLANK_ADDRESS_FORM);

  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  // --- Coupon State ---
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [customCouponInput, setCustomCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [discountValue, setDiscountValue] = useState(0);

  // --- Delivery Charges State ---
  const [deliveryInfo, setDeliveryInfo] = useState({ zone: '', totalWeight: 0, deliveryCharge: 0 });
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  // --- Fetch Addresses and Coupons on User Load ---
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoadingAddresses(true);
        try {
          const token = await auth.getToken();
          const [fetchedAddresses, fetchedCoupons] = await Promise.all([
            fetchAddresses(token),
            fetchAvailableCoupons()
          ]);

          setAddresses(fetchedAddresses);
          if (fetchedAddresses.length > 0) {
            const defaultAddress = fetchedAddresses.find(a => a.isDefault) || fetchedAddresses[0];
            setSelectedAddressId(defaultAddress._id);
            setShowAddressForm(false);
          } else {
            setShowAddressForm(true);
          }

          if (Array.isArray(fetchedCoupons)) {
            setAvailableCoupons(fetchedCoupons);
          }

        } catch (err) {
          setError("Could not load page data.");
          console.error(err);
        } finally {
          setLoadingAddresses(false);
        }
      };
      loadData();
    }
  }, [user]);

  useEffect(() => {
    const onErr = (e) => {
      try { console.error('Global error caught:', e); } catch (err) { }
    };
    const onRej = (e) => {
      try { console.error('Unhandled rejection:', e); } catch (err) { }
    };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  // --- Fetch Dynamic Delivery Charges ---
  useEffect(() => {
    const fetchDeliveryCharges = async () => {
      if (!selectedAddressId || checkoutItems.length === 0 || !user) return;

      setLoadingDelivery(true);
      try {
        const token = await auth.getToken();
        const productDetails = checkoutItems.map(item => {
          const productId = typeof item.product === 'object' ? item.product._id : item.product;
          return { product: productId, quantity: item.quantity };
        });

        const deliveryData = await calculateDeliveryCharges(token, productDetails, selectedAddressId);
        setDeliveryInfo(deliveryData);
      } catch (err) {
        console.error('Failed to fetch delivery charges:', err);
        setDeliveryInfo({ zone: 'ROI', totalWeight: 0, deliveryCharge: 500 });
      } finally {
        setLoadingDelivery(false);
      }
    };

    fetchDeliveryCharges();
  }, [selectedAddressId, checkoutItems, user]);

  // --- Price Calculation ---
  // Calculate total from checkoutItems instead of cart
  const itemsTotal = checkoutItems.reduce((sum, item) => {
    // Ensure item and item.product exist before calculating
    if (!item || !item.product) return sum;
    const discountedPrice = (item.product.price * (100 - (item.product.discount || 0))) / 100;
    // Floor individual item price to avoid rounding up
    return sum + Math.floor(discountedPrice) * item.quantity;
  }, 0);

  const tax = Math.round(itemsTotal * 0.1);
  const deliveryFee = deliveryInfo.deliveryCharge || 0;
  const subtotal = itemsTotal + tax + deliveryFee;
  const grandTotal = subtotal - discountValue;

  const handleInputChange = (e) => {
    setError('');
    setNewAddressForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCancelAddNew = () => {
    setShowAddressForm(false);
    setNewAddressForm(BLANK_ADDRESS_FORM);
    setError('');
    if (addresses.length > 0) {
      const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress._id);
    }
  };

  const getFinalAddressId = async (token) => {
    if (showAddressForm) {
      if (!newAddressForm.fullName || !newAddressForm.flat || !newAddressForm.pincode) {
        throw new Error('Please fill in all required fields for the new address.');
      }
      const newAddress = await createAddress(token, newAddressForm);
      return newAddress._id;
    }
    if (!selectedAddressId) {
      throw new Error('Please select a delivery address.');
    }
    return selectedAddressId;
  };

  // --- Coupon Logic ---
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || customCouponInput).trim().toUpperCase();
    if (!code) return;
    setCouponError('');

    try {
      const token = await auth.getToken();
      const { discount } = await applyCouponAPI(code, subtotal, token);
      setDiscountValue(discount);
      setSelectedCouponCode(code);
      setCustomCouponInput('');
    } catch (err) {
      setCouponError(err.message || "Invalid Coupon");
      setDiscountValue(0);
      setSelectedCouponCode('');
    }
  };

  // --- Place Order Logic ---
  const handlePlaceOrder = async () => {
    setError('');

    if ((!selectedAddressId && !showAddressForm)) {
      setError('Please select or add a shipping address.');
      return;
    }
    // Only block checkout if user is trying to use a coupon that failed
    if (couponError && selectedCouponCode) {
      setError('Please remove the invalid coupon or proceed without it.');
      return;
    }

    setPlacingOrder(true);

    try {
      // 1. Get Token & Address
      const token = await auth.getToken();
      const finalAddressId = await getFinalAddressId(token);

      // 2. Prepare Common Payload
      const productDetails = checkoutItems.map(item => {
        // Handle both cart items and buy again products
        const productId = typeof item.product === 'object' ? item.product._id : item.product;
        return {
          product: productId,
          quantity: item.quantity
        };
      });

      const orderPayload = {
        userAddress: finalAddressId,
        paymentMethod,
        products: productDetails,
        paymentBreakdown: { 
          itemsTotal, 
          tax, 
          shipping: deliveryFee, 
          discount: discountValue, 
          total: grandTotal 
        },
        couponCode: selectedCouponCode || null,
      };

      // =========================================================
      // OPTION 1: ONLINE PAYMENT (Razorpay)
      // =========================================================
      if (paymentMethod === 'Online') {
        // A. Create Order on Backend
        console.debug(
          'Creating razorpay order, payload amount (INR):',
          grandTotal,
          'Amount in paise:',
          Math.round(grandTotal * 100)
        );

        let razorpayOrder;
        try {
          // Server recomputes the authoritative amount from these references —
          // the client no longer sends a price. See docs/PAYMENT_ARCHITECTURE.md.
          const resp = await axios.post(`${API_URL}/api/payment/create-order`,
            {
              items: productDetails,
              addressId: finalAddressId,
              couponCode: selectedCouponCode || null,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          razorpayOrder = resp && resp.data;
        } catch (createErr) {
          console.error('Create-order failed:', createErr, createErr.response?.data);
          setError(createErr.response?.data?.message || createErr.message || 'Failed to create payment order');
          setPlacingOrder(false);
          return;
        }

        // B. Open Razorpay Modal
        if (!razorpayOrder || !razorpayOrder.id) {
          throw new Error('Failed to create payment order. Please try again.');
        }

        console.debug('Razorpay order created:', razorpayOrder);

        const loadRazorpayScript = () => new Promise((resolve, reject) => {
          if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
          const existing = document.querySelector('script[data-razorpay-loader]');
          if (existing) {
            existing.addEventListener('load', () => resolve(true));
            existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load')));
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.defer = true;
          script.setAttribute('data-razorpay-loader', 'true');
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error('Razorpay script failed to load'));
          document.head.appendChild(script);
          setTimeout(() => reject(new Error('Razorpay script load timeout')), 8000);
        });

        try {
          const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
          console.debug('Client razorpay key:', razorpayKey);
          
          // Validate Razorpay key is configured
          if (!razorpayKey) {
            throw new Error('Razorpay key not configured. Please contact support.');
          }
          
          if (typeof window === 'undefined') throw new Error('window is undefined');
          if (!window.Razorpay) {
            console.debug('Razorpay not present, loading script...');
            await loadRazorpayScript();
            console.debug('Razorpay script loaded');
          } else {
            console.debug('Razorpay already present on window');
          }
        } catch (scriptErr) {
          console.error('Razorpay script load error:', scriptErr);
          setError(scriptErr.message || 'Razorpay checkout script not loaded. Please check your network and try again.');
          setPlacingOrder(false);
          return;
        }

        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        
        if (!razorpayKey) {
          console.error('❌ VITE_RAZORPAY_KEY_ID not found in environment');
          setError('Payment gateway not configured. Please contact support.');
          setPlacingOrder(false);
          return;
        }

        console.debug('🔑 Using Razorpay key:', razorpayKey);
        console.debug('📦 Order details:', {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
        });

        const options = {
          key: razorpayOrder.keyId || razorpayKey,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: BRAND.name,
          description: `${BRAND.name} Order`,
          order_id: razorpayOrder.id,

          // C. Handle Payment Success
          handler: async function (response) {
            setPlacingOrder(true);
            try {
              // Get Fresh Token
              const freshToken = await auth.getToken(true);

              // Send only the Razorpay proof + the server-signed draft token.
              // The order contents and amount live in the draft, not here.
              const verificationPayload = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: razorpayOrder.id,
                razorpay_signature: response.razorpay_signature,
                draftToken: razorpayOrder.draftToken,
              };

              // D. Verify & Save Order
              const result = await axios.post(
                `${API_URL}/api/payment/verify`,
                verificationPayload,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${freshToken}`,
                  }
                }
              );

              if (result.data.success) {
                // Only clear cart if not using Buy Again flow
                if (!buyAgainProducts) {
                  await clearCart();
                }

                // Remove one-time coupon from available coupons list
                if (selectedCouponCode) {
                  const usedCoupon = availableCoupons.find(c => c.code === selectedCouponCode);
                  if (usedCoupon && usedCoupon.usageLimit === 1) {
                    setAvailableCoupons(prev => prev.filter(c => c.code !== selectedCouponCode));
                  }
                }

                const confirmedOrder = result.data.order;
                const orderId = confirmedOrder._id || confirmedOrder.orderId;

                if (!orderId) throw new Error("Order ID missing in response");

                // Navigate to order details and pass the confirmed order in location state
                // to avoid an immediate protected fetch that might trigger a 401 and auto-logout.
                navigate(`/orders/${orderId}`, { state: { order: confirmedOrder } });
              } else {
                throw new Error(result.data.message || "Payment verification failed on server.");
              }

            } catch (err) {
              console.error("❌ Verification Failed. Full Error:", err);

              // 🔍 DEBUGGING: Show the exact error message from backend
              let backendMsg = "Payment successful, but order creation failed.";
              if (err.response && err.response.data) {
                console.error("Backend Response Data:", err.response.data);
                backendMsg += `\nReason: ${err.response.data.message || err.response.data.error}`;
              } else {
                backendMsg += `\nReason: ${err.message}`;
              }

              alert(backendMsg);
              setError(backendMsg);
              setPlacingOrder(false);
            }
          },
          prefill: {
            name: user.displayName || '',
            email: user.email || '',
            contact: user.phoneNumber || ''
          },
          theme: { color: "#C9A66B" },
          modal: {
            ondismiss: function () {
              console.log('⚠️ Razorpay modal dismissed by user');
              setPlacingOrder(false);
            }
          }
        };

        console.debug('🚀 Opening Razorpay checkout with options:', {
          key: options.key,
          amount: options.amount,
          currency: options.currency,
          order_id: options.order_id
        });

        openRazorpayCheckout(
          options,
          (response) => {
            console.error("❌ Razorpay Payment Failure:", response);
            const errorMsg = response?.error?.description || 
                           response?.error?.reason || 
                           'Payment failed. Please try again.';
            setError(`Payment Failed: ${errorMsg}`);
            setPlacingOrder(false);
          }
        );


      }

      // =========================================================
      // OPTION 2: CASH ON DELIVERY
      // =========================================================
      else if (paymentMethod === 'CashOnDelivery') {
        const response = await createOrder(token, orderPayload);
        const createdOrder = response.order || response;
        const orderId = createdOrder._id || createdOrder.orderId;

        if (orderId) {
          // Only clear cart if not using Buy Again flow
          if (!buyAgainProducts) {
            await clearCart();
          }

          // Remove one-time coupon from available coupons list
          if (selectedCouponCode) {
            const usedCoupon = availableCoupons.find(c => c.code === selectedCouponCode);
            if (usedCoupon && usedCoupon.usageLimit === 1) {
              setAvailableCoupons(prev => prev.filter(c => c.code !== selectedCouponCode));
            }
          }

          navigate(`/orders/${orderId}`);
        } else {
          throw new Error("Order placed but ID returned was invalid.");
        }
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'An error occurred while placing order.');
      setPlacingOrder(false);
    }
  };

  // --- JSX Rendering ---
  if (auth.loading || loadingAddresses) {
    return <div className="loading-full-page">Loading Checkout...</div>;
  }

  // Check if there are items to checkout (either from cart or Buy Again)
  if (!checkoutItems.length) {
    return (
      <div className="checkout-container empty">
        <h2>Your cart is empty</h2>
        <p className="empty-cart-message">
          Add some items to your cart to checkout. <Link to="/products">Shop Now</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-content">
        <div className="checkout-left">
          {/* --- Shipping Address Section --- */}
          <section className="section-block shipping-address">
            <div className="card-header">
              <h3>Shipping Address</h3>
              <hr className="card-divider" />
            </div>
            {addresses.length > 0 && !showAddressForm
              ? (
                <div className="address-section-wrapper">
                  <div className="address-selection">
                    {addresses.map(addr => (
                      <div
                        key={addr._id}
                        className={`address-card-select ${selectedAddressId === addr._id ? 'selected' : ''}`}
                        onClick={() => { setSelectedAddressId(addr._id); setShowAddressForm(false); setError(''); }}
                      >
                        <div className="radio-circle">{selectedAddressId === addr._id && <div className="dot" />}</div>
                        <div className="address-details">
                          <strong>{addr.fullName}</strong> <span style={{ fontSize: '0.85rem' }}>({addr.phone})</span>
                          <p>{addr.flat}, {addr.area}</p>
                          <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="add-address-btn" onClick={() => { setShowAddressForm(true); setSelectedAddressId(''); }}>
                    <FontAwesomeIcon icon={faPlus} /> Add a New Address
                  </button>
                </div>
              )
              : (
                <div className="address-card">
                  <form className="checkout-address-form" onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }}>
                    <div className="address-form-grid">
                      <div className="field full">
                        <label htmlFor="fullName" className="field-label">Full name</label>
                        <input id="fullName" name="fullName" className="field-input" value={newAddressForm.fullName} onChange={handleInputChange} required />
                      </div>

                      <div className="field full">
                        <label htmlFor="flat" className="field-label">Flat / House No. / Building</label>
                        <input id="flat" name="flat" className="field-input" value={newAddressForm.flat} onChange={handleInputChange} required />
                      </div>

                      <div className="field full">
                        <label htmlFor="area" className="field-label">Area, Street, Sector</label>
                        <input id="area" name="area" className="field-input" value={newAddressForm.area} onChange={handleInputChange} />
                      </div>

                      <div className="field half">
                        <label htmlFor="pincode" className="field-label">PIN Code</label>
                        <input id="pincode" name="pincode" className="field-input" value={newAddressForm.pincode} onChange={handleInputChange} required />
                      </div>

                      <div className="field half">
                        <label htmlFor="phone" className="field-label">Mobile</label>
                        <input id="phone" name="phone" type="tel" className="field-input" value={newAddressForm.phone} onChange={handleInputChange} required />
                      </div>

                      <div className="field half">
                        <label htmlFor="city" className="field-label">Town / City</label>
                        <input id="city" name="city" className="field-input" value={newAddressForm.city} onChange={handleInputChange} required />
                      </div>

                      <div className="field half">
                        <label htmlFor="state" className="field-label">State</label>
                        <input id="state" name="state" className="field-input" value={newAddressForm.state} onChange={handleInputChange} required />
                      </div>

                      <div className="field full">
                        <label htmlFor="landmark" className="field-label">Landmark (optional)</label>
                        <input id="landmark" name="landmark" className="field-input" value={newAddressForm.landmark} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="save-btn primary-btn">Save & Continue</button>
                      <button type="button" className="cancel-btn secondary-btn" onClick={handleCancelAddNew}>Cancel</button>
                    </div>
                  </form>
                </div>
              )
            }
          </section>

          {/* --- Coupon Section --- */}
          <section className="section-block coupon-section">
            <h2>Apply Coupon</h2>
            <div className="custom-coupon-input-group">
              <input
                type="text" className="coupon-input-field" placeholder="Enter coupon code"
                value={customCouponInput}
                onChange={(e) => setCustomCouponInput(e.target.value)}
                disabled={!!selectedCouponCode}
              />
              {selectedCouponCode ? (
                <button onClick={() => { setSelectedCouponCode(''); setDiscountValue(0); setCouponError(''); }} className="apply-coupon-button">Remove</button>
              ) : (
                <button onClick={() => handleApplyCoupon()} className="apply-coupon-button">Apply</button>
              )}
            </div>
            {couponError && (
              <div className="coupon-error-message">
                {couponError}
                <button
                  className="dismiss-error-btn"
                  onClick={() => { setCouponError(''); setCustomCouponInput(''); }}
                  title="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}
            {selectedCouponCode && !couponError && (
              <p className="coupon-success-message">
                ✓ Coupon "{selectedCouponCode}" applied! You saved ₹{discountValue}
              </p>
            )}

            {availableCoupons.length > 0 && (
              <div className="available-coupons-list">
                <p style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#333' }}>Available Coupons:</p>
                {availableCoupons.map((c) => (
                  <div 
                    key={c.code} 
                    className={`coupon-card ${selectedCouponCode === c.code ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedCouponCode === c.code) {
                        // Deselect if clicking again
                        setSelectedCouponCode('');
                        setDiscountValue(0);
                      } else {
                        // Select this coupon
                        handleApplyCoupon(c.code);
                      }
                    }}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {selectedCouponCode === c.code && (
                      <div style={{ 
                        position: 'absolute', 
                        left: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid #2563eb',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginRight: '0.5rem'
                      }}>
                        ✓
                      </div>
                    )}
                    <span className="coupon-code-tag" style={{ marginLeft: selectedCouponCode === c.code ? '2.5rem' : '0' }}>{c.code}</span>
                    <div className="coupon-details">
                      <p className="coupon-heading">{c.heading}</p>
                      <p className="coupon-desc">{c.description || 'Click to apply'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* --- Payment Method Section --- */}
          <section className="section-block delivery-method">
            <h3>Payment Method</h3>
            <div className="payment-options">
              <div className={`payment-option ${paymentMethod === 'Online' ? 'selected' : ''}`} onClick={() => setPaymentMethod('Online')}>
                <input type="radio" name="payment" value="Online" checked={paymentMethod === 'Online'} onChange={() => { }} />
                <span>Online Payment (Card, UPI, NetBanking)</span>
              </div>
              
              <div className="payment-option disabled" style={{ opacity: 0.6, cursor: 'not-allowed', position: 'relative' }}>
                <input type="radio" name="payment" value="CashOnDelivery" disabled style={{ cursor: 'not-allowed' }} />
                <span>Cash On Delivery</span>
                <span style={{ fontSize: '12px', color: '#000000 !important', marginLeft: '8px', fontStyle: 'italic' }}>(Coming Soon)</span>
              </div>
            </div>
          </section>
        </div>

        {/* --- Right Column: Order Summary --- */}
        <div className="checkout-right">
          <div className="order-summary">
            <h2>Order Summary</h2>

            {/* --- Products List --- */}
            <div className="cart-items-summary">
              {checkoutItems.map((item) => {
                // Safety check for item and product
                if (!item || !item.product) return null;

                const product = item.product;
                const imageSrc = product.images?.image1?.data
                  ? `data:${product.images.image1.contentType};base64,${product.images.image1.data}`
                  : product.imageUrl || "/images/placeholder.jpg";
                const discountedPrice = Math.floor((product.price * (100 - (product.discount || 0))) / 100);

                return (
                  <div key={product._id} className="summary-product-item">
                    <img src={imageSrc} alt={product.name} className="summary-product-image" />
                    <div className="summary-product-info">
                      <h4>{product.name}</h4>
                      <p className="summary-product-price">
                        {formatPrice(discountedPrice)} × {item.quantity}
                      </p>
                    </div>
                    <div className="summary-product-total">
                      {formatPrice(discountedPrice * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <hr style={{ margin: '1.5rem 0', borderColor: '#e0e0e0' }} />

            <div className="price-breakdown">
              <div className="price-row"><span>Items total</span><span>{formatPrice(itemsTotal)}</span></div>
              <div className="price-row"><span>Tax (10%)</span><span>{formatPrice(tax)}</span></div>
              <div className="price-row">
                <span>Delivery {deliveryInfo.zone && `(${deliveryInfo.zone})`}</span>
                <span>{loadingDelivery ? 'Calculating...' : (deliveryFee > 0 ? formatPrice(deliveryFee) : 'FREE')}</span>
              </div>
              <hr />
              <div className="price-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discountValue > 0 && <div className="price-row savings"><span>Coupon Discount</span><span>-{formatPrice(discountValue)}</span></div>}
              <hr />
              <div className="price-row total-amount"><span>Total amount</span><span>{formatPrice(grandTotal)}</span></div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="checkout-securely-btn" onClick={handlePlaceOrder} disabled={placingOrder || auth.loading || loadingAddresses}>
              <FontAwesomeIcon icon={faLock} />
              {placingOrder ? 'Processing...' : (paymentMethod === 'Online' ? 'Proceed to Pay' : 'Place Order')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}