// src/api/wishlistApi.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = `${API_URL}/api/wishlist`;

// Helper to get auth headers
const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Fetch the user's wishlist
export const fetchWishlist = async (token) => {
  const response = await axios.get(BASE_URL, getAuthHeaders(token));
  return response.data;
};

// Add a product to the wishlist
export const addItemToWishlist = async (token, productId) => {
  const response = await axios.post(BASE_URL, { productId }, getAuthHeaders(token));
  return response.data;
};

// Remove a product from the wishlist
export const removeItemFromWishlist = async (token, productId) => {
  const response = await axios.delete(`${BASE_URL}/${productId}`, getAuthHeaders(token));
  return response.data;
};