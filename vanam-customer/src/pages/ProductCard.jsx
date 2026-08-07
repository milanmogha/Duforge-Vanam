
/// src/pages/ProductCard.js
import ReactDOM from "react-dom"; // <--- NEW IMPORT
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { formatPrice } from "../utils/formatters";
import CustomAlert from "../components/CustomAlert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as solidHeart,
  faStar as solidStar,
  faStarHalfAlt,
  faCartShopping,
  faComment,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  faHeart as regularHeart,
  faStar as regularStar,
} from "@fortawesome/free-regular-svg-icons";
import "../css/ProductCard.css";

export default function ProductCard({ product, openCart }) {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const { cart: { items }, addToCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const [showToast, setShowToast] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const itemId = product._id;
  const isWished = wishlistItems.some((item) => item?._id === itemId);
  const isInCart = items.some((item) => item.product?._id === itemId);
  
  // Track previous product ID to avoid unnecessary resets
  const prevProductIdRef = useRef(product._id);

  // Memoize image source to prevent flickering on re-renders
  // Only recreate if the actual data changes, not on every render
  const imageSrc = useMemo(() => {
    // Check if image data exists in the expected format
    if (product.images?.image1?.data) {
      const contentType = product.images.image1.contentType || 'image/jpeg';
      return `data:${contentType};base64,${product.images.image1.data}`;
    }
    
    // Fallback for imageUrl format (used in some endpoints)
    if (product.imageUrl) {
      return product.imageUrl;
    }
    
    // No image on the product — show a furniture-themed fallback.
    return "/images/product-fallback.jpg";
  }, [product._id, product.images?.image1?.data]); // Only depend on ID and image data

  // Reset loading state ONLY when product ID actually changes
  useEffect(() => {
    if (prevProductIdRef.current !== product._id) {
      setImageLoaded(false);
      prevProductIdRef.current = product._id;
    }
  }, [product._id, product.name]);

  const handleWishlistToggle = () => {
    isWished ? removeFromWishlist(itemId) : addToWishlist(product);
  };

  const handleCartButtonClick = () => {
    if (isInCart) {
      // Open cart when item is already in cart
      if (typeof openCart === "function") {
        openCart();
      }
      return;
    }
    if (showToast) return;
    // Guests can add to cart too — the guest cart merges on login.

    // Check if product is out of stock
    if (!product.stock || product.stock <= 0) {
      setShowAlert(true);
      return;
    }

    addToCart(product, 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const discount = product.discount || 0;
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? Math.floor((product.price * (100 - discount)) / 100)
    : Math.floor(product.price);
  const avgRating = product.rating?.average || 0;
  const reviewCount = product.rating?.count || 0;
  const starElements = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1;
    if (avgRating >= starValue) {
      return <FontAwesomeIcon key={i} icon={solidStar} className="star" />;
    } else if (avgRating >= starValue - 0.5) {
      return <FontAwesomeIcon key={i} icon={faStarHalfAlt} className="star" />;
    } else {
      return <FontAwesomeIcon key={i} icon={regularStar} className="star" />;
    }
  });


  return (
    <div className="product-card">
      <div className="image-section">
        <Link to={`/products/${itemId}`} className="image-link">
          {!imageLoaded && (
            <div className="image-shimmer">
              <div className="shimmer-wave"></div>
            </div>
          )}
          <img
            src={imageSrc}
            alt={product.name}
            className={`product-image ${imageLoaded ? 'image-loaded' : 'image-loading'}`}
            loading="lazy"
            onLoad={() => {
              setImageLoaded(true);
            }}
            onError={(e) => {
              e.target.src = "/images/product-fallback.jpg";
              setImageLoaded(true);
            }}
          />
          {product.stock === 0 && (
            <div className="stock-badge out-of-stock-badge">Out of Stock</div>
          )}
          {product.stock > 0 && product.stock <= 10 && (
            <div className="stock-badge low-stock-badge">Only few left</div>
          )}
        </Link>
        <div className="actions-icons">
          <div className="action-icon" onClick={handleWishlistToggle}>
            <FontAwesomeIcon icon={isWished ? solidHeart : regularHeart} />
          </div>
        </div>
      </div>

      <div className="product-info">
        <Link to={`/products/${itemId}`} className="name-link">
          <h4 className="product-name">{product.name}</h4>
        </Link>
        <div className="rating-row">
          {starElements}
          <div className="review-count">
            <FontAwesomeIcon icon={faComment} />
            <span>{reviewCount}</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="price-details">
          <div className="final-price">{formatPrice(discountedPrice)}</div>
          {hasDiscount && (
            <div className="price-top-row">
              <span className="original-price">{formatPrice(product.price)}</span>
              <span className="discount-percentage">-{discount}%</span>
            </div>
          )}
        </div>

        <button
          className={`cart-button ${isInCart ? 'is-in-cart' : ''} ${(!product.stock || product.stock <= 0) ? 'out-of-stock' : ''}`}
          onClick={handleCartButtonClick}
          disabled={!product.stock || product.stock <= 0}
        >
          <FontAwesomeIcon icon={faCartShopping} />
          {/* --- NEW: Tooltip added here --- */}
          <span className="cart-tooltip">
            {(!product.stock || product.stock <= 0) ? 'Out of Stock' : (isInCart ? 'View Cart' : 'Add to Cart')}
          </span>
          {isInCart && (
            <div className="added-checkmark">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
          )}
        </button>

        {showToast && ReactDOM.createPortal(
        <div className="add-to-cart-toast">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Item added to cart</span>
        </div>,
        document.body
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
}
