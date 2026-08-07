//  src/pages/CartPage.js


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import '../css/CartSlider.css';

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const CartPage = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    cart: { items },
    updateCartItem,
    cartTotal
  } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
    onClose();
  };

  return (
    <>
      {/* The backdrop is still rendered conditionally */}
      {isOpen && <div className="cart-backdrop" onClick={onClose}></div>}

      <div className={`cart-slider ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="cart-slider-header">
          <h2>Your cart</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="cart-slider-body">
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', fontWeight: 300 }}>Your cart is empty.</p>
          ) : (
            items.map(({ product, quantity }) => {
              let imageSrc = '/images/placeholder.jpg';
              if (product.images) {
                const keyWithImage = Object.keys(product.images).find(
                  (k) => product.images[k]?.data
                );
                if (keyWithImage) {
                  const { contentType, data } = product.images[keyWithImage];
                  imageSrc = `data:${contentType};base64,${data}`;
                }
              }
              const discountedPrice = Math.floor((product.price * (100 - (product.discount || 0))) / 100);

              return (
                <div className="cart-slider-item" key={product._id}>
                  <img src={imageSrc} alt={product.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <div className="cart-item-info">
                      <div>
                        <h4>{product.name}</h4>
                        <p className="cart-item-subtext">{product.subtext}</p>
                      </div>
                    </div>
                    <div className='quantity-price'>
                      <div className="quantity-controls">
                        <button onClick={() => updateCartItem(product._id, quantity - 1)}>-</button>
                        <span>{quantity}</span>
                        <button onClick={() => updateCartItem(product._id, quantity + 1)}>+</button>
                      </div>

                      <div className="cart-item-price">{formatPrice(discountedPrice * quantity)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-slider-footer">
            <div className="subtotal">
              <span>Subtotal</span>
              <span className="price">{formatPrice(cartTotal)}</span>
            </div>
            <button onClick={handleCheckout} className="checkout-btn">Checkout</button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPage;