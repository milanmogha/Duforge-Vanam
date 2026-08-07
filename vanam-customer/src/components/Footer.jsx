// src/components/Footer.jsx — light editorial footer (Atelier redesign).
// Giant wordmark, real routes only, brand-config contact — no fabricated info.

import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../config/categories';
import BRAND from '../config/brand';
import '../css/Footer.css';

const STUDIO_LINKS = [
  { to: '/finish-lab', label: 'Finish Lab' },
  { to: '/visualizer', label: 'Room Visualizer' },
  { to: '/technology', label: 'Material Technology' },
  { to: '/advisor', label: 'Material Advisor' },
  { to: '/calculator', label: 'Project Calculator' },
  { to: '/compare', label: 'Compare' },
];

const COMPANY_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/collections', label: 'Collections' },
  { to: '/materials', label: 'Materials' },
  { to: '/sustainability', label: 'Sustainability' },
  { to: '/journal', label: 'Journal' },
  { to: '/contact', label: 'Contact' },
];

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      {/* CTA band */}
      <div className="foot__cta">
        <div className="foot__cta-inner">
          <p className="eyebrow">Start a project</p>
          <h2>Material for spaces<br />meant to last.</h2>
          <div className="foot__cta-actions">
            <Link to="/products" className="btn">Shop the catalog</Link>
            <Link to="/quote" className="btn-outline">Request a quote</Link>
          </div>
        </div>
      </div>

      <div className="foot__grid">
        <div className="foot__col foot__col--brand">
          <p className="foot__descriptor">{BRAND.descriptor}</p>
          <p className="foot__tagline">{BRAND.tagline}</p>
          {BRAND.support.email && (
            <a className="foot__mail" href={`mailto:${BRAND.support.email}`}>{BRAND.support.email}</a>
          )}
        </div>

        <div className="foot__col">
          <h4>Shop</h4>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/products?category=${c.slug}`}>{c.title}</Link>
              </li>
            ))}
            <li><Link to="/products">All products</Link></li>
          </ul>
        </div>

        <div className="foot__col">
          <h4>Studio</h4>
          <ul>
            {STUDIO_LINKS.map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="foot__col">
          <h4>Company</h4>
          <ul>
            {COMPANY_LINKS.map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="foot__col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/account">My account</Link></li>
            <li><Link to="/account" state={{ defaultTab: 'orders' }}>Orders</Link></li>
            <li><Link to="/account/projects">Projects</Link></li>
            <li><Link to="/account/samples">Samples</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
            <li><Link to="/quote">Quotes</Link></li>
          </ul>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="foot__wordmark" aria-hidden="true">{BRAND.name}</div>

      <div className="foot__legal">
        <span>© {year} {BRAND.name}. All rights reserved.</span>
        <span className="foot__legal-note">Demo storefront — company details pending.</span>
      </div>
    </footer>
  );
};

export default Footer;
