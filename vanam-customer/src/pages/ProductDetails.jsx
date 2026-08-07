// src/pages/ProductDetails.jsx

import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "./CartContext";
import { getProductById, getAllProducts } from "../api/productApi";
import ProductCard from "./ProductCard";
import { FINISHES, furnitureTypeFromProduct } from "../three/materialData";
import { getReviewsByProduct } from "../api/reviewApi";
import ReviewList from "./ReviewList";
import CustomAlert from "../components/CustomAlert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// --- UPDATED: faEye icon removed ---
import { faStar as solidStar, faStarHalfAlt, faCartShopping, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { updateMetaTags, addSchemaToHead, generateProductSchema, generateBreadcrumbSchema } from "../utils/seoHelper";
import "../css/ProductDetails.css";
import "../theme/pages.css";
import { useAuth } from './AuthContext';
import { useCompare } from './CompareContext';
import { listProjects, addProjectItem, requestSample } from '../api/featuresApi';

// Lazy so three.js only loads when a shopper opens the 3D view.
const ProductViewer = lazy(() => import('../three/ProductViewer'));

// Map a product's color/material text to one of the viewer's wood finishes.
const finishFromProduct = (p) => {
  const s = `${p?.color || ''} ${p?.primaryMaterial || ''}`.toLowerCase();
  if (s.includes('walnut')) return 'walnut';
  if (s.includes('oak')) return 'oak';
  if (s.includes('teak')) return 'teak';
  if (s.includes('ebon') || s.includes('black')) return 'ebonized';
  return 'walnut';
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

// Structured specification rows — real catalog fields only; anything absent
// renders as "Not specified" rather than an invented value.
const SPEC_FIELDS = [
  ['Category', 'category'],
  ['Sub-category', 'subCategory'],
  ['Type', 'childCategory'],
  ['Primary material', 'primaryMaterial'],
  ['Material type', 'materialType'],
  ['Colour / finish', 'color'],
  ['Frame', 'frameType'],
  ['Seating capacity', 'seatingCapacity'],
  ['Bed size', 'bedSize'],
  ['Storage included', 'storageIncluded'],
  ['Weight', 'weight', (v) => `${v} kg`],
];

const renderAverageStars = (avg) => {
  const stars = [];
  const fullStars = Math.floor(avg);
  const hasHalf = avg - fullStars >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FontAwesomeIcon key={`full-${i}`} icon={solidStar} className="avg-star selected" />);
  }
  if (hasHalf) {
    stars.push(<FontAwesomeIcon key="half" icon={faStarHalfAlt} className="avg-star selected" />);
  }
  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FontAwesomeIcon key={`empty-${i}`} icon={solidStar} className="avg-star" />);
  }
  return stars;
};

export default function ProductDetailsPage({ openCart }) {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();

  const { user: currentUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Vanam leads with the 3D viewer, not photos — the interactive model is the
  // whole reason the brand exists, and every product maps to a furniture type,
  // so the viewer always has something to show. Photos are the secondary view.
  const [show3D, setShow3D] = useState(true);

  // Material-tools state (compare / save-to-project / request-sample)
  const { getToken } = useAuth();
  const { add: addCompare, has: inCompare } = useCompare();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [toolMsg, setToolMsg] = useState('');
  const [related, setRelated] = useState([]);

  // Related pieces: same category, excluding this product.
  useEffect(() => {
    if (!product?.category) return;
    let active = true;
    getAllProducts({ category: product.category })
      .then((list) => {
        if (!active || !Array.isArray(list)) return;
        setRelated(list.filter((p) => p._id !== product._id).slice(0, 4));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [product?._id, product?.category]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const token = await getToken();
        const list = await listProjects(token);
        setProjects(list);
        if (list[0]) setSelectedProject(list[0]._id);
      } catch { /* ignore */ }
    })();
  }, [currentUser]);

  const flash = (m) => { setToolMsg(m); setTimeout(() => setToolMsg(''), 2500); };

  const handleSaveToProject = async () => {
    if (!currentUser) return navigate('/login');
    if (!selectedProject) return flash('Create a project first, in Account → Project boards.');
    try {
      const token = await getToken();
      await addProjectItem(token, selectedProject, { product: product._id, quantity: 1 });
      flash('Saved to project.');
    } catch { flash('Could not save to project.'); }
  };

  const handleRequestSample = async () => {
    if (!currentUser) return navigate('/login');
    try {
      const token = await getToken();
      await requestSample(token, { product: product._id, finish: product.color || '' });
      flash('Sample requested — track it in Account → Samples.');
    } catch { flash('Could not request a sample.'); }
  };

  const imageList = useMemo(() =>
    product?.images ? Object.keys(product.images).map(key => {
      const img = product.images[key];
      return img && img.data ? `data:${img.contentType};base64,${img.data}` : null;
    }).filter(Boolean) : [],
    [product]
  );

  const itemInCart = useMemo(() =>
    cartItems?.find(item => item?.product?._id === product?._id),
    [cartItems, product]
  );

  useEffect(() => {
    if (!productId) {
      setLoadingProduct(false);
      return;
    }
    const fetchProduct = async () => {
      setProduct(null);
      setLoadingProduct(true);
      try {
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err) {
        // Error fetching product
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      setLoadingReviews(false);
      return;
    }
    const fetchReviews = async () => {
      try {
        const revData = await getReviewsByProduct(productId, null);
        setReviews(revData);
      } catch (err) {
        // Error fetching reviews
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [productId]);
  
  // SEO: Manage document head and JSON-LD for product page
  useEffect(() => {
    if (!product) return;

    const frontendBase = (process.env.REACT_APP_FRONTEND_URL && process.env.REACT_APP_FRONTEND_URL.replace(/\/$/, '')) || window.location.origin.replace(/\/$/, '');
    
    // Optimized title with target keywords
    const pageTitle = `${product.name} | Buy Premium Wood ${product.category} | Vanam`;
    
    // Enhanced description with keywords
    let description = product.details ? product.details.substring(0, 160) : ``;
    if (!description) {
      description = `Buy ${product.name} at Vanam. Premium quality wood ${product.category} with best prices and fast delivery.`;
    } else if (!description.includes(product.name)) {
      description = `${product.name} - ${description}`;
    }

    // Truncate to 160 chars for optimal display
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    // Build keywords
    const keywords = `${product.name}, ${product.category}, wood furniture, premium wood, buy online, ${product.childCategory || product.subCategory || 'furniture'}`;

    // Update meta tags with SEO helper
    const productUrl = `${frontendBase}/products/${product.slug || product._id}`;
    updateMetaTags(pageTitle, description, productUrl, {
      keywords,
      image: imageList?.[currentImageIndex] || '/images/logoMain.png',
      type: 'product',
    });

    // Generate breadcrumbs for better navigation and SEO
    const breadcrumbs = [
      { label: 'Home', url: `${frontendBase}/` },
      { label: 'Products', url: `${frontendBase}/products` },
      { label: product.category, url: `${frontendBase}/products?category=${product.category}` },
      ...(product.subCategory ? [{ label: product.subCategory, url: `${frontendBase}/products?category=${product.category}&sub=${product.subCategory}` }] : []),
      { label: product.name, url: productUrl },
    ];

    // Add breadcrumb schema
    addSchemaToHead(generateBreadcrumbSchema(breadcrumbs), 'breadcrumb-schema');

    // Generate and add product schema
    addSchemaToHead(generateProductSchema(product, frontendBase), 'product-schema');

    return () => {
      const breadcrumbScript = document.getElementById('breadcrumb-schema');
      if (breadcrumbScript) breadcrumbScript.remove();
      const productScript = document.getElementById('product-schema');
      if (productScript) productScript.remove();
    };
  }, [product, currentImageIndex]);
  
  // --- UPDATED: New handler for the Add to Cart button ---
  const handleCartButtonClick = () => {
    // Guests can add to cart too — the guest cart merges on login.

    // If item is already in cart, just open the cart slider
    if (itemInCart) {
      if (typeof openCart === 'function') {
        openCart();
      }
      return;
    }
    
    // Check if product is out of stock
    if (!product.stock || product.stock <= 0) {
      setShowAlert(true);
      return;
    }
    
    // If item is NOT in cart, add it and show a toast
    if (showToast) return; // Prevent multiple clicks
    addToCart(product, 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (loadingProduct) return <p className="loading-text">Loading product...</p>;
  if (!product) return <p className="empty-text">Product not found.</p>;

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === imageList.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? imageList.length - 1 : prevIndex - 1
    );
  };

  const discount = product.discount || 0;
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? Math.floor((product.price * (100 - discount)) / 100)
    : Math.floor(product.price);

  return (
    <>
    <div className="product-details-page">
      {/* Image Gallery Slider */}
      <div className="gallery-section">
        <div className="vn-media-toggle" role="tablist" aria-label="Media view">
          <button
            role="tab"
            aria-selected={show3D}
            className={show3D ? 'is-active' : ''}
            onClick={() => setShow3D(true)}
          >
            View in 3D
          </button>
          <button
            role="tab"
            aria-selected={!show3D}
            className={!show3D ? 'is-active' : ''}
            onClick={() => setShow3D(false)}
          >
            Photos
          </button>
        </div>

        {show3D ? (
          <Suspense fallback={<div className="vn-viewer__loading">Loading 3D…</div>}>
            <ProductViewer
              posterSrc={imageList[0] || '/images/placeholder.jpg'}
              productName={product.name}
              defaultFinish={finishFromProduct(product)}
              modelType={furnitureTypeFromProduct(product)}
            />
          </Suspense>
        ) : imageList.length > 0 ? (
          <>
            <div className="slider-main-image">
              <img
                key={currentImageIndex}
                src={imageList[currentImageIndex]}
                alt={`${product.name} ${currentImageIndex + 1}`}
                className="gallery-image-main"
                onError={(e) => {
                  // A missing product photo should degrade to the brand
                  // placeholder, not a broken-image glyph. Guard against a
                  // missing placeholder looping the handler.
                  if (!e.currentTarget.dataset.fallback) {
                    e.currentTarget.dataset.fallback = '1';
                    e.currentTarget.src = '/images/placeholder.jpg';
                  }
                }}
              />
              {imageList.length > 1 && (
                <>
                  <button onClick={prevImage} className="slider-btn prev-btn" aria-label="Previous image">&#10094;</button>
                  <button onClick={nextImage} className="slider-btn next-btn" aria-label="Next image">&#10095;</button>
                </>
              )}
            </div>
            {imageList.length > 1 && (
              <div className="slider-thumbnails">
                {imageList.map((src, idx) => (
                  <img
                    key={`thumb-${idx}`}
                    src={src}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`thumbnail-image ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="slider-main-image">
            <img src="/images/placeholder.jpg" alt="No image available" className="gallery-image-main" />
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="details-section">
        <h1 className="detail-name">{product.name}</h1>
        <p className="detail-category">Category: {product.category}</p>

        <div className="detail-pricing">
          {hasDiscount && <span className="detail-price-original">{formatPrice(product.price)}</span>}
          <span className="detail-price-discounted">{formatPrice(discountedPrice)}</span>
          {hasDiscount && <span className="detail-discount-tag">-{discount}%</span>}
        </div>

        <div className="detail-stock-container">
          {product.stock === 0 && (
            <p className="detail-stock out-of-stock">
              <span className="stock-icon">⚠️</span> Out of Stock
            </p>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="detail-stock low-stock">
              <span className="stock-icon">🔥</span> Only {product.stock} left in stock - Order soon!
            </p>
          )}
          {product.stock > 5 && (
            <p className="detail-stock in-stock">
              <span className="stock-icon">✓</span> In Stock ({product.stock} available)
            </p>
          )}
        </div>

        {product.details && (
          <div className="detail-description">
            <h3>Details</h3>
            <p>{product.details}</p>
          </div>
        )}

        {/* --- UPDATED: Button is no longer conditional and uses the new handler --- */}
        <button 
          className="detail-add-cart-btn" 
          onClick={handleCartButtonClick} 
          disabled={product.stock === 0}
        >
          <FontAwesomeIcon icon={faCartShopping} />
          {itemInCart ? 'Go to Cart' : (product.stock > 0 ? 'Add to Cart' : 'Unavailable')}
        </button>

        {showToast && (
          <div className="add-to-cart-toast active">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Item added to cart</span>
          </div>
        )}

        {/* Material tools: compare, save to project, request sample */}
        <div className="vn-card" style={{ marginTop: 18 }}>
          <span className="vn-label">Material tools</span>
          <div className="vn-row" style={{ flexWrap: 'wrap' }}>
            <button className="vn-btn vn-btn--ghost" style={{ flex: '0 0 auto' }}
              disabled={inCompare(product._id)}
              onClick={() => { addCompare(product); flash('Added to compare.'); }}>
              {inCompare(product._id) ? 'In compare' : 'Add to compare'}
            </button>
            <button className="vn-btn vn-btn--ghost" style={{ flex: '0 0 auto' }} onClick={handleRequestSample}>
              Request a sample
            </button>
          </div>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginTop: 10, alignItems: 'flex-end' }}>
            {currentUser && projects.length > 0 && (
              <div style={{ flex: '2 1 180px' }}>
                <span className="vn-label">Save to project</span>
                <select className="vn-select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <button className="vn-btn vn-btn--brass" style={{ flex: '0 0 auto' }} onClick={handleSaveToProject}>
              Save to project
            </button>
          </div>
          {toolMsg && <p className="vn-note" style={{ marginTop: 10 }}>{toolMsg}</p>}
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2 className="reviews-heading">Reviews ({product.rating?.count || 0})</h2>
          {product.rating?.count > 0 && (
            <div className="overall-rating">
              {renderAverageStars(product.rating.average)}
              <span className="avg-text">{product.rating.average.toFixed(1)} / 5</span>
            </div>
          )}
          {loadingReviews ? <p className="loading-text">Loading reviews...</p> : <ReviewList reviews={reviews} />}
        </div>
      </div>

      {showAlert && (
        <CustomAlert
          message="This product is currently out of stock"
          onClose={() => setShowAlert(false)}
          type="warning"
        />
      )}
    </div>

    {/* ── Material story ── */}
    <section className="pdp-story theater">
      <div className="pdp-band">
        <div className="pdp-story__grid">
          <div>
            <span className="tech-label">The material</span>
            <h2>
              {product.primaryMaterial
                ? `${product.primaryMaterial}, shown honestly.`
                : 'Shown honestly.'}
            </h2>
          </div>
          <p>
            Every piece is presented with its true finish and grain — turn it in 3D,
            switch the finish, and what you see on screen is what arrives.
            {product.color ? ` This piece ships in ${product.color.toLowerCase()}.` : ''}
          </p>
        </div>
      </div>
    </section>

    {/* ── Specifications ── */}
    <section className="pdp-band">
      <span className="tech-label">Specifications</span>
      <div className="pdp-specs">
        {SPEC_FIELDS.map(([label, key, fmt]) => {
          const raw = product[key];
          const value = raw === undefined || raw === null || raw === ''
            ? 'Not specified'
            : fmt ? fmt(raw) : String(raw);
          return (
            <div key={key} className="pdp-specs__row">
              <span className="tech-label">{label}</span>
              <span className={`tech ${value === 'Not specified' ? 'pdp-specs__na' : ''}`}>{value}</span>
            </div>
          );
        })}
      </div>
    </section>

    {/* ── Finish gallery ── */}
    <section className="pdp-band">
      <span className="tech-label">Finish gallery</span>
      <div className="pdp-finishes">
        {Object.entries(FINISHES).map(([k, f]) => (
          <button
            key={k}
            className="pdp-finish"
            title={`Preview ${f.label} in 3D`}
            onClick={() => setShow3D(true)}
          >
            <span style={{ background: f.base }} aria-hidden="true" />
            {f.label}
          </button>
        ))}
        <Link to="/finish-lab" className="link-line">Open Finish Lab</Link>
      </div>
      <p className="vn-note">Finish previews are interactive in the 3D view above.</p>
    </section>

    {/* ── Applications ── */}
    <section className="pdp-band">
      <span className="tech-label">Suited to</span>
      <div className="pdp-apps">
        {[product.category, product.subCategory].filter(Boolean).map((c) => (
          <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} className="pdp-app">{c}</Link>
        ))}
        <Link to="/visualizer" className="pdp-app pdp-app--viz">See it in a room →</Link>
      </div>
    </section>

    {/* ── Related pieces ── */}
    {related.length > 0 && (
      <section className="pdp-band">
        <div className="pdp-related__head">
          <span className="tech-label">From the same space</span>
          <Link to={`/products?category=${product.category}`} className="link-line">View all</Link>
        </div>
        <div className="pdp-related">
          {related.map((p) => (
            <ProductCard key={p._id} product={p} openCart={openCart} isCarouselContext={true} />
          ))}
        </div>
      </section>
    )}
    </>
  );
}