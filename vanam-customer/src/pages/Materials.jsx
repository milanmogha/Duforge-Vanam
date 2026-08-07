// src/pages/Materials.jsx — data-driven: distinct materials from the live catalog.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../api/productApi';
import { FINISHES } from '../three/materialData';
import '../theme/pages.css';

export default function Materials() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const products = await getAllProducts({});
        const map = new Map();
        (products || []).forEach((p) => {
          const key = p.primaryMaterial || 'Other';
          if (!map.has(key)) map.set(key, { name: key, count: 0, sample: p });
          map.get(key).count += 1;
        });
        setMaterials([...map.values()].sort((a, b) => b.count - a.count));
      } catch { setMaterials([]); }
    })();
  }, []);

  // Map a material name to a finish swatch colour for a tactile cue.
  const swatch = (name) => {
    const n = (name || '').toLowerCase();
    const key = Object.keys(FINISHES).find((k) => n.includes(k)) || 'oak';
    return FINISHES[key].base;
  };

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Materials</p>
        <h1 className="vn-page__title">Explore by material</h1>
        <p className="vn-page__lead">The species and materials in the current catalogue. Open one to see every piece made from it.</p>
      </div>
      <div className="vn-page__body">
        {materials.length === 0 ? (
          <p className="vn-empty">Loading materials…</p>
        ) : (
          <div className="vn-grid vn-grid--3">
            {materials.map((m) => (
              <button key={m.name} className="vn-card" style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={() => navigate(`/products?primaryMaterial=${encodeURIComponent(m.name)}`)}>
                <span style={{ display: 'inline-block', width: 40, height: 40, borderRadius: 8, background: swatch(m.name), marginBottom: 12 }} />
                <h3 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400, margin: '0 0 6px' }}>{m.name}</h3>
                <span className="vn-badge">{m.count} pieces</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
