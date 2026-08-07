// src/api/bannerApi.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch all public banners to display in the customer portal
 * @returns {Promise<Array>}
 */
export const getPublicBanners = async () => {
  const res = await axios.get(`${BASE_URL}/api/banners/public`);
  // Normalize response: some environments may wrap result
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.banners)) return res.data.banners;
  // Fallback: if payload is an object keyed by data or banner, try common shapes
  if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};
