// src/api/reviewApi.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE_URL = `${API_URL}/api/reviews`;

/**
 * Fetch all reviews for a given product.
 * @param {string} productId
 * @param {string} token – user’s auth token
 * @returns {Promise<Array>} – array of review objects
 */
export const getReviewsByProduct = async (productId, token) => {
  const response = await axios.get(`${BASE_URL}/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Submit a new review for a product.
 * @param {string} productId
 * @param {{ userId: string, userName: string, rating: number, comment: string }} reviewData
 * @param {string} token – user’s auth token
 * @returns {Promise<Object>} – { success, message, review, productRating }
 */
export const addReviewForProduct = async (productId, reviewData, token) => {
  const response = await axios.post(
    `${BASE_URL}/${productId}`,
    reviewData,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Check if a particular user is eligible to review a given product.
 * @param {string} productId
 * @param {string} userId    // MongoDB user _id (from JWT payload)
 * @param {string} token     // JWT auth token (Bearer)
 * @returns {Promise<boolean>} – true if user can review, false otherwise
 */
export const canUserReview = async (productId, userId, token) => {
  const response = await axios.get(
    `${BASE_URL}/eligible/${productId}/${userId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.canReview;
};
