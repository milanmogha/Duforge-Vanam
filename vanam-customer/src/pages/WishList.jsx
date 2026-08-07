// src/pages/WishList.js

import React, { useState } from "react";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import CustomAlert from "../components/CustomAlert";
import "../css/WishList.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Link } from "react-router-dom";

// Accept openCart as a prop
const WishList = ({ openCart }) => {
  const { cart: { items }, addToCart } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();

  // Use an object to manage toast state for each item individually
  const [toastStates, setToastStates] = useState({});
  const [showAlert, setShowAlert] = useState(false);

  const handleCartButtonClick = (item) => {
    // Check if the item is already in the cart
    const isInCart = items.some(cartItem => cartItem.product?._id === item._id);

    if (isInCart) {
      // If it is, open the cart slider
      if (typeof openCart === 'function') {
        openCart();
      }
    } else {
      // Check if product is out of stock
      if (!item.stock || item.stock <= 0) {
        setShowAlert(true);
        return;
      }
      
      // If not, add it to the cart
      addToCart(item, 1);
      
      // Show a toast message for this specific item
      setToastStates(prev => ({ ...prev, [item._id]: true }));
      setTimeout(() => {
        setToastStates(prev => ({ ...prev, [item._id]: false }));
      }, 3000); // Hide toast after 3 seconds
      
      // Remove from wishlist after adding to cart
      removeFromWishlist(item._id); 
    }
  };
  
  const handleRemoveFromWishlist = (itemId) => {
    removeFromWishlist(itemId);
  };

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title">WISHLIST</h1>
      <div className="wishlist-grid">
        {wishlistItems.length === 0 ? (
          <p className="empty-text">Your wishlist is empty.</p>
        ) : (
          wishlistItems.map((item) => {
            const imageSrc = item.images?.image1?.data 
              ? `data:${item.images.image1.contentType};base64,${item.images.image1.data}` 
              : "/images/placeholder.jpg";
            
            const isInCart = items.some(cartItem => cartItem.product?._id === item._id);

            return (
              <div key={item._id} className="wishlist-card">
                {toastStates[item._id] && (
                  <div className="wishlist-toast">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Item added to cart</span>
                  </div>
                )}
                 <Link to={`/products/${item._id}`} className="image-link">
                          <img
                            src={imageSrc}
                            alt={item.name}
                            className="product-image"
                            onError={(e) => (e.target.src = "/images/placeholder.jpg")}
                          />
                        </Link>
                <div className="wishlist-card-content">
                  <Link to={`/products/${item._id}`} className="name-link">
                            <h4 className="product-name">{item.name}</h4>
                          </Link>
                  <p className="category-link">{item.category}</p>
                  <p className="price">₹{item.price}</p>
                  <div className="wishlist-action-row">
                    <button 
                      className={`add-cart-btn ${isInCart ? 'in-cart' : ''}`}
                      onClick={() => handleCartButtonClick(item)}
                    >
                      {isInCart ? 'VIEW CART' : 'ADD TO CART'}
                    </button>
                    <button
                      className="remove-icon-btn"
                      onClick={() => handleRemoveFromWishlist(item._id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAlert && (
        <CustomAlert
          message="This product is currently out of stock"
          onClose={() => setShowAlert(false)}
          type="warning"
        />
      )}
    </div>
  );
};

export default WishList;