import axios from 'axios';

const BASE_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/reviews`;

export const fetchReviewsByProduct = async (productId) => {
  const response = await axios.get(`${BASE_URL}/product/${productId}`);
  return response.data;
};

export const deleteReview = async (reviewId, adminToken) => {
  const response = await axios.delete(`${BASE_URL}/${reviewId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return response.data;
};