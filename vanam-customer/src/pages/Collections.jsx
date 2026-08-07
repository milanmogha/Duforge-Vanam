// src/pages/Collections.jsx — data-driven: real catalog categories as collections.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../api/productApi';
import { getRootCategories } from '../config/categories';
import '../theme/pages.css';

export default function Collections() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const products = await getAllProducts({});
        const c = {};
        (products || []).forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
        setCounts(c);
      } catch { setCounts({}); }
    })();
  }, []);

  const cats = getRootCategories();

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Collections</p>
        <h1 className="vn-page__title">Browse by collection</h1>
        <p className="vn-page__lead">Each collection maps to a part of the home. Counts reflect the live catalogue.</p>
      </div>
      <div className="vn-page__body vn-grid vn-grid--3">
        {cats.map((cat) => (
          <button key={cat.slug} className="vn-card" style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => navigate(`/products?category=${cat.slug}`)}>
            <h3 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400, margin: '0 0 6px' }}>{cat.title}</h3>
            <span className="vn-badge">{counts[cat.title] || 0} pieces</span>
          </button>
        ))}
      </div>
    </div>
  );
}
