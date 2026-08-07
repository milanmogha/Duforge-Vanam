// src/pages/Compare.jsx — side-by-side product comparison.
import React from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from './CompareContext';
import '../theme/pages.css';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const sell = (p) => Math.floor((p.price * (100 - (p.discount || 0))) / 100);

// Only real, available fields — missing values render as "Not specified".
const ROWS = [
  { label: 'Price', get: (p) => fmt(sell(p)) },
  { label: 'Category', get: (p) => p.category },
  { label: 'Sub-category', get: (p) => p.subCategory },
  { label: 'Material', get: (p) => p.primaryMaterial },
  { label: 'Colour / finish', get: (p) => p.color },
  { label: 'Availability', get: (p) => (p.stock > 0 ? `In stock (${p.stock})` : 'Out of stock') },
];

export default function Compare() {
  const { items, remove, clear } = useCompare();

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Compare</p>
        <h1 className="vn-page__title">Compare pieces side by side</h1>
        <p className="vn-page__lead">
          Add products from any product page. We only show values that actually exist — anything
          unspecified is marked clearly, never invented.
        </p>
      </div>

      <div className="vn-page__body">
        {items.length === 0 ? (
          <div className="vn-empty">
            <p className="vn-empty__title">Nothing to compare yet</p>
            <p>Open a product and choose “Add to compare”.</p>
            <p style={{ marginTop: 16 }}><Link className="vn-linkbtn" to="/products">Browse products</Link></p>
          </div>
        ) : (
          <>
            <div className="vn-row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="vn-linkbtn" onClick={clear} style={{ flex: '0 0 auto' }}>Clear all</button>
            </div>
            <div className="vn-table__scroll">
              <table className="vn-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    {items.map((p) => (
                      <th key={p._id}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: '100%', maxWidth: 160, borderRadius: 6 }} />}
                          <Link className="vn-linkbtn" to={`/products/${p._id}`}>{p.name}</Link>
                          <button className="vn-linkbtn" onClick={() => remove(p._id)} style={{ color: 'var(--vn-mist)' }}>Remove</button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label}>
                      <td style={{ color: 'var(--vn-mist)' }}>{row.label}</td>
                      {items.map((p) => {
                        const v = row.get(p);
                        return <td key={p._id}>{v || <span className="vn-note">Not specified</span>}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
