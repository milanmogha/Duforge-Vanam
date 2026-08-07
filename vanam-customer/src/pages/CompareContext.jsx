// src/pages/CompareContext.jsx — client-side product comparison (localStorage).
import React, { createContext, useContext, useEffect, useState } from 'react';

const CompareContext = createContext(null);
export const useCompare = () => useContext(CompareContext);

const KEY = 'vn_compare';
const MAX = 4;

export const CompareProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = (next) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  // Store a compact snapshot so the compare page works even offline.
  const add = (product) => {
    if (!product?._id) return { ok: false, reason: 'invalid' };
    if (items.some((p) => p._id === product._id)) return { ok: false, reason: 'exists' };
    if (items.length >= MAX) return { ok: false, reason: 'full' };
    const snap = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discount: product.discount,
      stock: product.stock,
      category: product.category,
      subCategory: product.subCategory,
      color: product.color,
      primaryMaterial: product.primaryMaterial,
      imageUrl: product.imageUrl || (product.images?.image1?.data
        ? `data:${product.images.image1.contentType};base64,${product.images.image1.data}` : null),
    };
    persist([...items, snap]);
    return { ok: true };
  };

  const remove = (id) => persist(items.filter((p) => p._id !== id));
  const clear = () => persist([]);
  const has = (id) => items.some((p) => p._id === id);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has, max: MAX }}>
      {children}
    </CompareContext.Provider>
  );
};
