// src/components/Navbar.jsx — light editorial navigation (Atelier redesign).
// Wordmark left · editorial links center · utilities right · mobile drawer.

import React, { useState, useRef, useEffect } from 'react';
import '../css/Navbar.css';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../pages/CartContext';
import { useAuth } from '../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHeart, faCartShopping, faSearch, faBars, faXmark, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { getRootCategories } from '../config/categories';
import BRAND from '../config/brand';

const STUDIO_LINKS = [
  { to: '/finish-lab', label: 'Finish Lab' },
  { to: '/visualizer', label: 'Room Visualizer' },
  { to: '/technology', label: 'Material Technology' },
  { to: '/advisor', label: 'Material Advisor' },
  { to: '/calculator', label: 'Project Calculator' },
  { to: '/compare', label: 'Compare' },
];

const Navbar = ({ openCart }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openCat, setOpenCat] = useState(null); // expanded category in the mobile drawer
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const studioRef = useRef(null);
  const megaRef = useRef(null);
  const megaTimer = useRef(null);

  // Hover intent: the panel sits below the nav bar, so the cursor crosses a
  // gap on the way down. A short grace period keeps the menu open in transit.
  const openMega = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    setMegaOpen(true);
  };
  const closeMegaSoon = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setMegaOpen(false), 300);
  };
  useEffect(() => () => { if (megaTimer.current) clearTimeout(megaTimer.current); }, []);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { user, loading, logout } = useAuth();
  const isLoggedIn = !loading && !!user;

  // Overlay mode: transparent over the homepage's carbon hero, solidifying
  // to a material surface on scroll. Other routes get the solid nav.
  const isHome = location.pathname === '/';
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mega menu on route change and on Escape.
  useEffect(() => { setMegaOpen(false); setStudioOpen(false); setShowDropdown(false); }, [location.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMegaOpen(false); setStudioOpen(false); setShowDropdown(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleProfileClick = () => {
    setMenuOpen(false);
    setShowDropdown((prev) => !prev);
  };

  const handleMenuToggle = () => {
    setShowDropdown(false);
    setOpenCat(null); // reopen the drawer with all categories collapsed
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (studioRef.current && !studioRef.current.contains(event.target)) setStudioOpen(false);
      if (megaRef.current && !megaRef.current.contains(event.target)) setMegaOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const handleLogout = () => {
    if (typeof logout === 'function') logout();
    setShowDropdown(false);
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  const closeAll = () => { setMenuOpen(false); setStudioOpen(false); setShowDropdown(false); setMegaOpen(false); setOpenCat(null); };

  const cartCount = cart.items ? cart.items.length : 0;

  const navClass = [
    'nav',
    isHome ? 'nav--overlay' : '',
    isHome && !scrolled && !menuOpen && !megaOpen ? 'nav--transparent' : '',
  ].filter(Boolean).join(' ');

  return (
    <header className={navClass}>
      <div className="nav__inner">
        {/* Wordmark */}
        <Link to="/" className="nav__brand" onClick={closeAll} aria-label={`${BRAND.name} — home`}>
          {BRAND.name}
        </Link>

        {/* Desktop links */}
        <nav className="nav__links" aria-label="Primary">
          <div
            className={`nav__mega ${megaOpen ? 'is-open' : ''}`}
            ref={megaRef}
            onMouseEnter={openMega}
            onMouseLeave={closeMegaSoon}
          >
            <button type="button" aria-expanded={megaOpen} onClick={() => setMegaOpen((p) => !p)}>
              Shop <FontAwesomeIcon icon={faChevronDown} className="nav__caret" />
            </button>
            {megaOpen && (
              <div
                className="nav__mega-panel"
                role="menu"
                onMouseEnter={openMega}
                onMouseLeave={closeMegaSoon}
              >
                <div className="nav__mega-col">
                  <p className="tech-label">Spaces</p>
                  {getRootCategories().map((c) => (
                    <Link key={c.slug} to={`/products?category=${c.slug}`} onClick={closeAll}>{c.title}</Link>
                  ))}
                  <Link to="/products" onClick={closeAll} className="nav__mega-all">All products →</Link>
                </div>
                <div className="nav__mega-col">
                  <p className="tech-label">Materials</p>
                  <Link to="/materials" onClick={closeAll}>Material index</Link>
                  <Link to="/products?primaryMaterial=Walnut" onClick={closeAll}>Walnut</Link>
                  <Link to="/products?primaryMaterial=Oak" onClick={closeAll}>Oak</Link>
                  <Link to="/products?primaryMaterial=Teak" onClick={closeAll}>Teak</Link>
                  <Link to="/collections" onClick={closeAll}>Collections</Link>
                </div>
                <div className="nav__mega-col">
                  <p className="tech-label">Studio</p>
                  {STUDIO_LINKS.slice(0, 4).map((l) => (
                    <Link key={l.to} to={l.to} onClick={closeAll}>{l.label}</Link>
                  ))}
                </div>
                <Link to="/finish-lab" className="nav__mega-feature" onClick={closeAll}>
                  <span className="nav__mega-feature-swatch" aria-hidden="true" />
                  <span>
                    <strong>Finish Lab</strong>
                    Preview any material in real 3D — grain, finish and light.
                  </span>
                </Link>
              </div>
            )}
          </div>
          <NavLink to="/collections" onClick={closeAll}>Collections</NavLink>
          <NavLink to="/materials" onClick={closeAll}>Materials</NavLink>
          <div className={`nav__studio ${studioOpen ? 'is-open' : ''}`} ref={studioRef}>
            <button
              type="button"
              aria-expanded={studioOpen}
              onClick={() => setStudioOpen((p) => !p)}
            >
              Studio <FontAwesomeIcon icon={faChevronDown} className="nav__caret" />
            </button>
            {studioOpen && (
              <div className="nav__studio-menu">
                {STUDIO_LINKS.map((l) => (
                  <Link key={l.to} to={l.to} onClick={closeAll}>{l.label}</Link>
                ))}
              </div>
            )}
          </div>
          <NavLink to="/journal" onClick={closeAll}>Journal</NavLink>
          <NavLink to="/about" onClick={closeAll}>About</NavLink>
        </nav>

        {/* Utilities */}
        <div className="nav__utils">
          <form className={`nav__search ${searchOpen ? 'is-open' : ''}`} onSubmit={handleSearch}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search materials, products…"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type={searchOpen ? 'submit' : 'button'}
              className="nav__iconbtn"
              aria-label="Search"
              onClick={() => { if (!searchOpen) setSearchOpen(true); }}
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </form>

          <div className="nav__profile" ref={dropdownRef}>
            <button type="button" className="nav__iconbtn" aria-label="Account" onClick={handleProfileClick}>
              <FontAwesomeIcon icon={faUser} />
            </button>
            {showDropdown && (
              <div className="nav__menu">
                {isLoggedIn ? (
                  <>
                    <Link to="/account" state={{ defaultTab: 'account' }} onClick={closeAll}>My Account</Link>
                    <Link to="/account" state={{ defaultTab: 'orders' }} onClick={closeAll}>Orders</Link>
                    <Link to="/account/projects" onClick={closeAll}>Projects</Link>
                    <Link to="/account/samples" onClick={closeAll}>Samples</Link>
                    <Link to="/account" state={{ defaultTab: 'savedAddresses' }} onClick={closeAll}>Addresses</Link>
                    <button type="button" onClick={handleLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeAll}>Login</Link>
                    <Link to="/signup" onClick={closeAll}>Sign up</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/wishlist" className="nav__iconbtn" aria-label="Wishlist" onClick={closeAll}>
            <FontAwesomeIcon icon={faHeart} />
          </Link>

          <button type="button" className="nav__iconbtn nav__cart" aria-label={`Cart, ${cartCount} items`} onClick={openCart}>
            <FontAwesomeIcon icon={faCartShopping} />
            {cartCount > 0 && <span className="nav__badge">{cartCount}</span>}
          </button>

          <button type="button" className="nav__iconbtn nav__burger" aria-label="Menu" onClick={handleMenuToggle}>
            <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`nav__drawer ${menuOpen ? 'is-open' : ''}`}>
        <form className="nav__drawer-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products…"
            aria-label="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Search"><FontAwesomeIcon icon={faSearch} /></button>
        </form>

        <p className="nav__drawer-label">Shop</p>
        <div className="nav__acc">
          {getRootCategories().map((category) => {
            const kids = category.children || [];
            const isOpen = openCat === category.slug;
            if (!kids.length) {
              return (
                <Link
                  key={category.slug}
                  to={`/products?category=${category.slug}`}
                  onClick={closeAll}
                  className="nav__acc-head"
                >
                  <span>{category.title}</span>
                </Link>
              );
            }
            return (
              <div key={category.slug} className={`nav__acc-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="nav__acc-head"
                  aria-expanded={isOpen}
                  onClick={() => setOpenCat(isOpen ? null : category.slug)}
                >
                  <span>{category.title}</span>
                  <FontAwesomeIcon icon={faChevronDown} className="nav__acc-caret" aria-hidden="true" />
                </button>
                <div className="nav__acc-panel">
                  <div className="nav__acc-panel-inner">
                    <Link to={`/products?category=${category.slug}`} onClick={closeAll} className="nav__acc-all">
                      All {category.title}
                    </Link>
                    {kids.map((ch) => (
                      <Link key={ch.slug} to={`/products?category=${ch.slug}`} onClick={closeAll}>
                        {ch.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Link to="/products" onClick={closeAll} className="nav__drawer-cta">All products →</Link>

        <p className="nav__drawer-label">Studio</p>
        <div className="nav__drawer-links">
          {STUDIO_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={closeAll}>{l.label}</Link>
          ))}
        </div>

        <p className="nav__drawer-label">Company</p>
        <div className="nav__drawer-links">
          <Link to="/collections" onClick={closeAll}>Collections</Link>
          <Link to="/materials" onClick={closeAll}>Materials</Link>
          <Link to="/journal" onClick={closeAll}>Journal</Link>
          <Link to="/about" onClick={closeAll}>About</Link>
          <Link to="/contact" onClick={closeAll}>Contact</Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
